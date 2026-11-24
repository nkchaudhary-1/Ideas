// Rule-based detectors that run on the real transcript. They are deliberately transparent: every finding shows the
// sentence it came from and why it was (or was not) counted. Context matters, so most words are only counted in
// the contexts where they act as fillers, and a couple of natural uses are always allowed.
import type { FillerFinding, HedgeFinding, VocabSuggestion } from "../types";
import { tokenize, trimQuote } from "./text";

// ── Filler words ────────────────────────────────────────────────────────────────────────────────────────────────

interface Hit {
  group: string;
  counted: boolean;
  reason: string;
  sentence: string;
  /** Ambiguous hits are free up to an allowance, then counted. */
  allowance?: number;
}

const FILLER_RE = /\b(um+|uh+|uhh+|er+m?|hmm+|you know|i think|actually|basically|like|maybe|so)\b/gi;
const LIKE_PREV_TRIGGER = new Set(["and", "but", "so", "just"]);
const LIKE_QUOTATIVE_PREV = new Set(["was", "were", "is", "it's", "that's", "i'm", "he's", "she's"]);
const LIKE_QUOTATIVE_NEXT = new Set(["really", "very", "so", "just", "totally", "kind", "sort", "you", "i", "we", "they", "he", "she", "it"]);
const YK_PREV = new Set(["and", "so", "like", "but"]);

const GROUP_LABEL: Record<string, string> = {
  hesitation: "um / uh",
  actually: "actually",
  basically: "basically",
  like: "like",
  "you know": "you know",
  so: "so",
  "i think": "I think",
  maybe: "maybe",
};
const GROUP_ORDER = ["hesitation", "actually", "basically", "like", "you know", "so", "i think", "maybe"];
const ALLOWANCE: Record<string, number> = { actually: 1, basically: 1, so: 1, "i think": 2, maybe: 1 };

export function findFillers(sentences: string[]): { findings: FillerFinding[]; counted: number; hesitations: number } {
  const hits: Hit[] = [];
  for (const sentence of sentences) {
    FILLER_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = FILLER_RE.exec(sentence))) {
      const word = m[1].toLowerCase();
      const before = sentence.slice(0, m.index);
      const after = sentence.slice(m.index + m[0].length);
      const prevTokens = tokenize(before);
      const prev = prevTokens[prevTokens.length - 1] ?? "";
      const next = tokenize(after)[0] ?? "";
      const commaBefore = /[,;—–-]\s*$/.test(before);
      const commaAfter = /^\s*[,;—–-]/.test(after);
      // "And"/"But" at the front do not stop a word counting as sentence-initial.
      const atStart = prevTokens.length === 0 || (prevTokens.length === 1 && (prev === "and" || prev === "but"));
      const atEnd = /^\s*[.?!]*\s*$/.test(after);
      const push = (group: string, counted: boolean, reason: string, allowance?: number) => hits.push({ group, counted, reason, sentence, allowance });

      if (/^(um+|uh+|uhh+|er+m?|hmm+)$/.test(word)) {
        push("hesitation", true, "Hesitation sound");
      } else if (word === "actually" || word === "basically") {
        if (atStart || commaBefore || commaAfter) push(word, true, `Used as a pause-filler ("${word}," or at the start)`);
        else push(word, false, "Natural use mid-sentence", ALLOWANCE[word]);
      } else if (word === "like") {
        const quotative = LIKE_QUOTATIVE_PREV.has(prev) && LIKE_QUOTATIVE_NEXT.has(next);
        if (commaBefore || commaAfter || atStart || LIKE_PREV_TRIGGER.has(prev) || quotative) push("like", true, "Used as a filler, not to compare or to say what you enjoy");
        else push("like", false, "Used to compare or to say what you prefer");
      } else if (word === "you know") {
        if (commaBefore || commaAfter || atStart || atEnd || YK_PREV.has(prev)) push("you know", true, 'Used as a filler ("you know,")');
        else push("you know", false, "Literal use");
      } else if (word === "so") {
        if (atStart) push("so", false, 'Starting with "so" once is natural', ALLOWANCE.so);
        else if (commaAfter || prev === "and") push("so", true, 'Used as a connector filler ("so," or "and so")');
        else push("so", false, "Causal or intensifying use");
      } else if (word === "i think") {
        push("i think", false, "Fine once or twice, it becomes a hedge when repeated", ALLOWANCE["i think"]);
      } else if (word === "maybe") {
        push("maybe", false, "Fine once, it softens a recommendation when repeated", ALLOWANCE.maybe);
      }
    }
  }
  // Apply allowances in order of appearance.
  const used: Record<string, number> = {};
  for (const h of hits) {
    if (h.allowance === undefined) continue;
    used[h.group] = (used[h.group] ?? 0) + 1;
    if (used[h.group] > h.allowance) {
      h.counted = true;
      h.reason = `Repeated: more than ${h.allowance} in one answer`;
    }
  }
  const findings: FillerFinding[] = [];
  for (const g of GROUP_ORDER) {
    const gh = hits.filter((h) => h.group === g);
    if (!gh.length) continue;
    findings.push({
      label: GROUP_LABEL[g],
      total: gh.length,
      counted: gh.filter((h) => h.counted).length,
      okay: gh.filter((h) => !h.counted).length,
      examples: gh.slice(0, 3).map((h) => ({ sentence: trimQuote(h.sentence), counted: h.counted, reason: h.reason })),
    });
  }
  return {
    findings,
    counted: hits.filter((h) => h.counted).length,
    hesitations: hits.filter((h) => h.group === "hesitation").length,
  };
}

// ── Hedging and apologies ───────────────────────────────────────────────────────────────────────────────────────

interface HedgeRule {
  label: string;
  kind: "hedge" | "apology";
  re: RegExp;
  suggestion: string;
  /** Only report when it appears at least this many times. */
  min?: number;
}

const HEDGE_RULES: HedgeRule[] = [
  { label: "kind of / sort of", kind: "hedge", re: /\b(kind of|sort of)\b/gi, suggestion: 'Drop "kind of" and say the thing plainly.' },
  { label: "I guess / I suppose", kind: "hedge", re: /\b(i guess|i suppose)\b/gi, suggestion: 'Replace with a position: "My view is…" or "I recommend…".' },
  { label: "probably / perhaps / hopefully", kind: "hedge", re: /\b(probably|perhaps|hopefully)\b/gi, min: 2, suggestion: 'State the plan, then name the risk separately: "The plan is X. The risk is Y."' },
  { label: "I'm not sure", kind: "hedge", re: /\b(i'?m not (really )?sure|not sure (if|whether)|i don'?t know if)\b/gi, suggestion: 'Say what you do know: "What I know is… and the part I would validate is…".' },
  { label: "just (as a minimiser)", kind: "hedge", re: /\b(i|we) just\b|\bjust (a|an|trying|wanted|wanna)\b/gi, min: 2, suggestion: 'Delete "just": "I wanted to" becomes "I will".' },
  { label: "a bit / a little", kind: "hedge", re: /\b(a (little )?bit|a little)\b/gi, min: 3, suggestion: "Name the amount, or cut it. Small qualifiers add up." },
  { label: "or something / if that makes sense", kind: "hedge", re: /\b(if that makes sense|does that make sense|or something|or whatever)\b/gi, suggestion: "End the sentence on your point. Check understanding once at the end, not after every idea." },
  { label: "apology", kind: "apology", re: /\b(sorry|apologi[sz]e|excuse my|my english (is|isn'?t)|pardon (my|me))\b/gi, suggestion: 'Skip the apology. If you lose your thread, pause, then say "Let me rephrase that."' },
];

export function findHedges(sentences: string[]): { findings: HedgeFinding[]; count: number; apologies: number } {
  const findings: HedgeFinding[] = [];
  let count = 0;
  let apologies = 0;
  for (const rule of HEDGE_RULES) {
    let n = 0;
    let example = "";
    for (const s of sentences) {
      const matches = s.match(rule.re);
      if (matches) {
        n += matches.length;
        if (!example) example = trimQuote(s);
      }
    }
    if (n === 0 || n < (rule.min ?? 1)) continue;
    findings.push({ kind: rule.kind, label: rule.label, count: n, example, suggestion: rule.suggestion });
    if (rule.kind === "apology") apologies += n;
    else count += n;
  }
  return { findings, count, apologies };
}

// ── Vocabulary: natural, professional phrasing without upgrading simple words ──────────────────────────────────

interface VocabRule {
  re: RegExp;
  to: string | ((m: RegExpMatchArray) => string);
  why: string;
}

export const VOCAB_RULES: VocabRule[] = [
  { re: /\brevert back\b/i, to: "reply", why: '"Revert" already means to go back. "Reply" or "get back to you" is what people say.' },
  { re: /\bdo the needful\b/i, to: "take care of it", why: '"Do the needful" sounds dated in product teams.' },
  { re: /\bprepone\b/i, to: "move it earlier", why: 'Not widely understood outside India.' },
  { re: /\bdiscuss about\b/i, to: "discuss", why: '"Discuss" already carries the "about".' },
  { re: /\bexplain you\b/i, to: "explain to you", why: 'Add "to": explain something to someone.' },
  { re: /\bsince (the )?last (\w+) years\b/i, to: (m) => `for the last ${m[2]} years`, why: 'Use "for" with a length of time, "since" with a start point.' },
  { re: /\bi am having\b/i, to: "I have", why: '"Have" is not used in the continuous form to talk about owning or experience.' },
  { re: /\bi have an? experience (of|in|on)\b/i, to: "I have experience in", why: '"Experience" is uncountable here: "I have experience in…".' },
  { re: /\bcope up with\b/i, to: "cope with", why: 'No "up" needed.' },
  { re: /\bemphasi[sz]e on\b/i, to: "emphasise", why: '"Emphasise" takes no "on".' },
  { re: /\breach to\b/i, to: "reach", why: '"Reach" takes no "to".' },
  { re: /\bmore better\b/i, to: "better", why: '"Better" is already comparative.' },
  { re: /\bvery very\b/i, to: "extremely", why: 'One strong word beats two weak ones.' },
  { re: /\bvery much passionate\b/i, to: "passionate", why: 'Say it once and show it with an example.' },
  { re: /\butili[sz]e\b/i, to: "use", why: '"Use" is simpler and sounds more natural out loud.' },
  { re: /\bfacilitate\b/i, to: "help", why: '"Help" says the same thing in speech.' },
  { re: /\bin order to\b/i, to: "to", why: 'Shorter in speech with the same meaning.' },
  { re: /\bdue to the fact that\b/i, to: "because", why: "Four words for one." },
  { re: /\bat this point in time\b/i, to: "now", why: "Four words for one." },
  { re: /\bvery good\b/i, to: "strong", why: 'Name what made it good, or use a sharper word such as "strong" or "clear".' },
  { re: /\bthe same thing like\b/i, to: "the same thing as", why: 'Use "as" after "the same".' },
  { re: /\b(he|she|it) don'?t\b/i, to: "doesn't", why: 'With he, she or it, use "doesn\'t".' },
  { re: /\bpeoples\b/i, to: "people", why: '"People" is already plural.' },
  { re: /\bfeedbacks\b/i, to: "feedback", why: '"Feedback" is uncountable. Say "pieces of feedback" if you need a count.' },
  { re: /\binformations\b/i, to: "information", why: '"Information" is uncountable.' },
  { re: /\bpass out\b/i, to: "graduate", why: '"Pass out" means to faint in most places.' },
  { re: /\bmy good name\b/i, to: "my name", why: "Not needed in an interview." },
  { re: /\bkindly\b/i, to: "please", why: '"Please" is the everyday word.' },
];

export function findVocabulary(sentences: string[], limit = 6): VocabSuggestion[] {
  const out: VocabSuggestion[] = [];
  const seen = new Set<string>();
  for (const s of sentences) {
    for (const rule of VOCAB_RULES) {
      const m = s.match(rule.re);
      if (!m) continue;
      const to = typeof rule.to === "function" ? rule.to(m) : rule.to;
      const key = m[0].toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ from: m[0], to, sentence: trimQuote(s), why: rule.why });
    }
  }
  // Vague words: only worth raising when they repeat.
  const all = sentences.join(" ");
  const vague = all.match(/\b(things?|stuff)\b/gi);
  if (vague && vague.length >= 3) {
    out.push({
      from: `"thing" or "stuff" (${vague.length} times)`,
      to: "the specific thing",
      sentence: trimQuote(sentences.find((s) => /\b(things?|stuff)\b/i.test(s)) ?? ""),
      why: 'Name it: "the filters", "the checkout step", "the returns policy". Specific nouns sound senior.',
    });
  }
  return out.slice(0, limit);
}

// ── A tightened version of a sentence, built from the user's own words ──────────────────────────────────────────

const REMOVABLE: { re: RegExp; to: string; label: string }[] = [
  { re: /\b(um+|uh+|uhh+|er+m?|hmm+)\b,?\s*/gi, to: "", label: "hesitation sounds" },
  { re: /\b(basically|actually),\s*/gi, to: "", label: 'the filler "basically" or "actually"' },
  { re: /,?\s*\byou know\b,?\s*/gi, to: " ", label: '"you know"' },
  { re: /^(and\s+)?so,?\s+/i, to: "", label: 'a leading "so"' },
  { re: /^(basically|actually)\s+/i, to: "", label: 'the filler "basically" or "actually"' },
  { re: /\b(kind of|sort of)\s+/gi, to: "", label: '"kind of" and "sort of"' },
  { re: /\b(i guess|i suppose),?\s*/gi, to: "", label: '"I guess"' },
  { re: /\b(I|we) just\b/gi, to: "$1", label: 'the minimiser "just"' },
];

export function tightenSentence(sentence: string): { better: string; changes: string[] } | null {
  let s = sentence.trim();
  const changes: string[] = [];
  const original = s;
  for (const { re, to, label } of REMOVABLE) {
    const next = s.replace(re, to);
    if (next !== s) {
      changes.push(`Removed ${label}`);
      s = next;
    }
  }
  for (const rule of VOCAB_RULES) {
    const m = s.match(rule.re);
    if (m && typeof rule.to === "string") {
      s = s.replace(rule.re, rule.to);
      changes.push(`"${m[0]}" → "${rule.to}"`);
    } else if (m && typeof rule.to === "function") {
      const to = rule.to(m);
      s = s.replace(rule.re, to);
      changes.push(`"${m[0]}" → "${to}"`);
    }
  }
  s = s.replace(/\s{2,}/g, " ").replace(/\s+([,.;?!])/g, "$1").replace(/^[\s,;]+/, "").trim();
  // Split a very long sentence at its most natural join.
  if (tokenize(s).length > 30) {
    const mid = s.length / 2;
    let best = -1;
    let bestDist = Infinity;
    const re = /(,?\s+(and then|and so|so|because|but|which|while)\s+)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      const d = Math.abs(m.index - mid);
      if (d < bestDist && m.index > 30 && s.length - m.index > 30) {
        best = m.index;
        bestDist = d;
      }
    }
    if (best > 0) {
      const mm = s.slice(best).match(/^(,?\s+)(and then|and so|so|because|but|which|while)\s+/i)!;
      const head = s.slice(0, best).replace(/[,;\s]+$/, "") + ".";
      let tail = s.slice(best + mm[0].length);
      const joiner = mm[2].toLowerCase();
      if (joiner === "because") tail = "That is because " + tail;
      else if (joiner === "but") tail = "But " + tail;
      else if (joiner === "which") tail = "This " + tail;
      else if (joiner === "while") tail = "At the same time, " + tail;
      else tail = tail[0].toUpperCase() + tail.slice(1);
      s = head + " " + tail;
      changes.push("Split into two shorter sentences");
    }
  }
  if (!changes.length || s === original) return null;
  s = s[0].toUpperCase() + s.slice(1);
  if (!/[.!?]["')\]]*$/.test(s)) s += ".";
  return { better: s, changes };
}
