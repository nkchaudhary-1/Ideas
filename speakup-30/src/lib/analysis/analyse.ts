// The scoring. Every number comes from the transcript text and, when available, from the real microphone signal
// (see speech/capture.ts). If there is not enough real data for a score it is null, never a guess.
import type { Analysis, AttemptKind, BetterSentence, KeyPoint, Score, SentenceFinding, StructureElement, VadStats } from "../types";
import { clamp, fmtClock, round1, splitSentences, tokenize, trimQuote, wordCount } from "./text";
import { findFillers, findHedges, findVocabulary, tightenSentence } from "./rules";

export const MIN_WORDS_TO_SCORE = 15;
const LONG_SENTENCE = 35;
export const MAX_PLAUSIBLE_WPM = 300;

export interface AnalysisInput {
  transcript: string;
  durationSec?: number | null;
  vad?: VadStats | null;
  kind?: AttemptKind;
  keyPoints?: KeyPoint[];
  targetSec?: [number, number];
}

const na = (note: string): Score => ({ value: null, note });
const sc = (value: number, note: string): Score => ({ value: Math.round(clamp(value, 0, 10)), note });
/**
 * Judgement-style scores (clarity, structure, relevance, phrasing, readiness) come from rules that can only say "no problem
 * found", never "perfect", so they top out at 9. Pace, fluency and filler control are direct measurements and can reach 10.
 */
const MAX_JUDGED = 9;
const judged = (value: number, note: string): Score => sc(Math.min(value, MAX_JUDGED), note);

// ── Structure: signal phrases for the five parts of a spoken answer ────────────────────────────────────────────

const SIGNALS: Record<StructureElement["id"], RegExp> = {
  opening: /\b(my (approach|process|take|answer|view|philosophy)|the (short|quick) (answer|version)|i('d| would| will) (start|say|begin|walk)|let me|to (start|begin)|first(ly)?|i (believe|approach|usually|typically|always)|at a high level|in (short|brief)|i('m| am) a|i have (been|about|over|around)|over the (last|past)|for me)\b/i,
  context: /\b(context|situation|background|the (problem|challenge|goal|brief)|when i (was|joined|started)|at (my|the|our) (company|team|org)|our (team|users|customers|goal)|the (users|customers|business|team|stakeholders) (were|was|had|wanted|needed)|we (had|were|needed|wanted)|at the time|the product)\b/i,
  explanation: /\b(because|so that|which (means|meant|is why)|the reason|that('s| is) why|this (meant|helped|let|allowed)|therefore|as a result|the idea (was|is)|what i did|i (decided|chose|focused|prioriti[sz]ed|looked|started|ran|worked|partnered|built|designed|tested))\b/i,
  example: /\b(for (example|instance)|one (time|project|example)|in one (project|case|instance)|a (good|recent|specific) example|take (a|the) (case|example)|say (you|a|we)|imagine|on (a|one|the) project|i (once|remember)|there was a (time|case|project))\b/i,
  conclusion: /\b(in (summary|short|conclusion)|to (sum|wrap|summari[sz]e)|overall|that('s| is) (how|what|why)|the (result|outcome|takeaway|lesson)|what i learned|looking back|ultimately|at the end of the day|bottom line|so that is)\b/i,
};
const STRUCTURE_LABELS: Record<StructureElement["id"], string> = {
  opening: "Opening",
  context: "Context",
  explanation: "Explanation",
  example: "Example",
  conclusion: "Conclusion",
};
const STRUCTURE_WEIGHT: Record<StructureElement["id"], number> = { opening: 2, context: 1.5, explanation: 2.5, example: 2.5, conclusion: 1.5 };

function detectStructure(sentences: string[]): StructureElement[] {
  const n = sentences.length;
  // Position matters for the opening (early) and the conclusion (late). With very few sentences, allow any.
  const early = Math.max(2, Math.ceil(n * 0.3));
  const late = Math.max(2, Math.ceil(n * 0.3));
  const find = (id: StructureElement["id"], from: number, to: number) => {
    for (let i = from; i < to; i++) if (SIGNALS[id].test(sentences[i])) return sentences[i];
    return undefined;
  };
  return (Object.keys(SIGNALS) as StructureElement["id"][]).map((id) => {
    const evidence = id === "opening" ? find(id, 0, Math.min(n, early)) : id === "conclusion" ? find(id, Math.max(0, n - late), n) : find(id, 0, n);
    return { id, label: STRUCTURE_LABELS[id], found: !!evidence, evidence: evidence ? trimQuote(evidence, 120) : undefined };
  });
}

// ── Relevance: how many of the key ideas for the question were touched ─────────────────────────────────────────

function termRegex(term: string): RegExp {
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${esc}`, "i");
}
function coverKeyPoints(text: string, keyPoints: KeyPoint[]) {
  const covered: KeyPoint[] = [];
  const missed: KeyPoint[] = [];
  for (const kp of keyPoints) (kp.terms.some((t) => termRegex(t).test(text)) ? covered : missed).push(kp);
  return { covered, missed };
}

// ── Scoring helpers ────────────────────────────────────────────────────────────────────────────────────────────

export function paceScoreFor(wpm: number): number {
  if (wpm >= 115 && wpm <= 155) return 10;
  if (wpm < 115) return clamp(10 - (115 - wpm) / 8, 0, 10);
  return clamp(10 - (wpm - 155) / 6, 0, 10);
}

export function emptyAnalysis(): Analysis {
  return analyse({ transcript: "" });
}

export function analyse(input: AnalysisInput): Analysis {
  const transcript = input.transcript.trim();
  const words = wordCount(transcript);
  const { sentences, reliable } = splitSentences(transcript);
  const scored = words >= MIN_WORDS_TO_SCORE;
  const vad = input.vad ?? null;
  const duration = input.durationSec && input.durationSec > 0 ? input.durationSec : null;
  const limitations: string[] = [];

  const fl = findFillers(sentences);
  const hd = findHedges(sentences);
  const vocabulary = findVocabulary(sentences);
  const fillerPer100 = words ? round1((fl.counted / words) * 100) : 0;
  const hedgePer100 = words ? round1(((hd.count + hd.apologies) / words) * 100) : 0;

  // Repetitions: the same word twice in a row ("the the", "I I").
  const toks = tokenize(transcript);
  let repetitions = 0;
  for (let i = 1; i < toks.length; i++) if (toks[i] === toks[i - 1] && toks[i].length <= 4 && !/^\d+$/.test(toks[i]) && toks[i] !== "had" && toks[i] !== "that") repetitions++;

  // Sentences
  const lens = sentences.map(wordCount);
  const avg = reliable && lens.length ? round1(lens.reduce((a, b) => a + b, 0) / lens.length) : null;
  const sentenceFindings: SentenceFinding[] = [];
  if (reliable) {
    sentences.forEach((s, i) => {
      const w = lens[i];
      const connectors = (s.match(/\b(and|which|that|because|but|so)\b/gi) ?? []).length;
      if (w > LONG_SENTENCE) sentenceFindings.push({ text: trimQuote(s), words: w, issue: "long", advice: "Split this at the first natural join. One idea per sentence, then pause." });
      else if (w > 25 && connectors >= 4) sentenceFindings.push({ text: trimQuote(s), words: w, issue: "tangled", advice: "Too many joined clauses to follow by ear. Pick the main point and say it first." });
    });
    const starts: Record<string, number> = {};
    for (const s of sentences) {
      const k = tokenize(s).slice(0, 2).join(" ");
      if (k) starts[k] = (starts[k] ?? 0) + 1;
    }
    for (const [k, n] of Object.entries(starts)) {
      if (n >= 3 && k.split(" ").length === 2) {
        const sample = sentences.find((s) => tokenize(s).slice(0, 2).join(" ") === k)!;
        sentenceFindings.push({ text: trimQuote(sample), words: wordCount(sample), issue: "repetitive-start", advice: `${n} sentences start with "${k}". Vary the openings, or join two of them.` });
      }
    }
  } else if (words > 0) {
    limitations.push("Your transcript has little punctuation, so sentence length cannot be measured. Add full stops when you edit it to get sentence feedback.");
  }
  const longSentences = sentenceFindings.filter((f) => f.issue === "long").length;

  // Pace, from the real clock and, when we have it, the real signal
  let wpm: number | null = null;
  let articulation: number | null = null;
  let pauses: number | null = null;
  let longPauses: number | null = null;
  if (duration && words >= 5) {
    // Leading and trailing silence is not part of the answer.
    const trimmed = vad ? Math.max(duration - vad.leadSilenceSec - vad.tailSilenceSec, 1) : duration;
    wpm = Math.round((words / trimmed) * 60);
    if (vad && vad.speakingSec > 3) articulation = Math.round((words / vad.speakingSec) * 60);
    // Nobody speaks faster than about 300 words a minute. If the numbers say so, the transcript and the recording do not
    // belong together (pasted text, or a recording that was cut short), so say that instead of reporting nonsense.
    if (wpm > MAX_PLAUSIBLE_WPM) {
      limitations.push(`The transcript has ${words} words but the recording is only ${fmtClock(duration)} long, which is faster than anyone can speak. Pace was not measured. Check that the transcript matches the recording.`);
      wpm = null;
      articulation = null;
    }
  }
  if (vad) {
    pauses = vad.pauses;
    longPauses = vad.longPauses;
  }
  if (!vad) limitations.push("Pauses were not measured because no microphone signal was recorded for this answer.");
  if (wpm !== null) limitations.push("Speed is words in the transcript divided by time. If the transcript missed words, the real pace was a little faster.");

  const structure = detectStructure(sentences);
  const relevance = input.keyPoints?.length && scored ? coverKeyPoints(transcript, input.keyPoints) : null;
  const readAloud = input.kind === "read-aloud";

  // ── Scores
  const scores: Analysis["scores"] = {
    clarity: na("Needs at least 15 words."),
    fluency: na("Needs at least 15 words."),
    pace: na("Needs a recording time and at least 5 words."),
    fillers: na("Needs at least 15 words."),
    structure: na("Needs at least 15 words."),
    phrasing: na("Needs at least 15 words."),
    relevance: na("Needs a transcript and a question with key ideas."),
    readiness: na("Needs at least 15 words."),
  };

  if (wpm !== null) {
    const base = paceScoreFor(wpm);
    scores.pace = sc(base, `About ${wpm} words per minute overall${articulation ? ` (${articulation} while speaking)` : ""}. A comfortable interview pace is roughly 115 to 155.`);
  }

  if (scored) {
    // Filler control: 10 at 1 per 100 words or fewer, 0 at 11 or more.
    scores.fillers = sc(10 - Math.max(0, fillerPer100 - 1), `${fl.counted} counted in ${words} words (${fillerPer100} per 100). Natural uses are not counted.`);

    // Fluency: hesitations, repeated words, and real long pauses when we measured them.
    const hesRate = (fl.hesitations / words) * 100;
    const repRate = (repetitions / words) * 100;
    let f = 10 - Math.min(3.5, hesRate * 0.9) - Math.min(2, repRate * 0.8);
    const parts = [`${fl.hesitations} hesitation sounds`, `${repetitions} repeated words`];
    if (vad) {
      f -= Math.min(3, Math.max(0, vad.longPauses - 1) * 0.5);
      parts.push(`${vad.longPauses} pauses over 2 seconds`);
    }
    scores.fluency = sc(f, `${parts.join(", ")}. Short pauses of a second or two are normal and not penalised.`);

    // Clarity: short sentences, a direct opening, specific nouns.
    let c = 10;
    const notes: string[] = [];
    const opening = structure.find((s) => s.id === "opening")!.found;
    if (reliable && avg !== null) {
      if (avg > 24) {
        c -= Math.min(3, (avg - 24) * 0.25);
        notes.push(`sentences average ${avg} words`);
      }
      if (longSentences) {
        c -= Math.min(3, (longSentences / Math.max(sentences.length, 1)) * 6);
        notes.push(`${longSentences} sentence${longSentences > 1 ? "s" : ""} over ${LONG_SENTENCE} words`);
      }
    } else notes.push("sentence length not measured");
    if (!opening) {
      c -= 1.5;
      notes.push("no clear opening line");
    }
    const vague = (transcript.match(/\b(things?|stuff)\b/gi) ?? []).length;
    if (vague / words > 0.02) {
      c -= 1;
      notes.push('vague words ("thing", "stuff")');
    }
    scores.clarity = judged(Math.max(3, c), notes.length ? `Based on: ${notes.join("; ")}.` : "Short sentences and a direct opening.");

    // Structure
    if (!readAloud) {
      const got = structure.filter((s) => s.found);
      const total = got.reduce((a, s) => a + STRUCTURE_WEIGHT[s.id], 0);
      scores.structure = judged(total, `Found ${got.map((s) => s.label.toLowerCase()).join(", ") || "none of the five parts"} using signal phrases.`);
    }

    // Phrasing (not a measure of how confident your voice sounds)
    const p = 10 - Math.min(7, hedgePer100 * 1.0 + hd.apologies * 1.5);
    scores.phrasing = judged(p, `${hd.count} hedging phrases and ${hd.apologies} apologies, from the words you used. This does not measure how confident your voice sounds.`);

    if (relevance && input.keyPoints) {
      const cov = relevance.covered.length / input.keyPoints.length;
      scores.relevance = judged(10 * Math.min(1, cov / 0.7), `Touched ${relevance.covered.length} of ${input.keyPoints.length} key ideas for this question. Covering about 70% is a strong answer.`);
    }

    // Interview readiness: a weighted mean over what could be measured.
    const weights: [Score, number][] = readAloud
      ? [[scores.pace, 3], [scores.fluency, 3], [scores.fillers, 2], [scores.clarity, 1]]
      : [[scores.relevance, 3], [scores.structure, 2], [scores.clarity, 1.5], [scores.fluency, 1], [scores.fillers, 1], [scores.phrasing, 0.5], [scores.pace, 0.5]];
    let sum = 0;
    let wsum = 0;
    for (const [s, w] of weights) if (s.value !== null) { sum += s.value * w; wsum += w; }
    if (wsum > 0) {
      let r = sum / wsum;
      const notes2 = [`Weighted from ${weights.filter(([s]) => s.value !== null).length} measured scores. Rule-based scores top out at 9, because rules can only say that no problem was found.`];
      if (input.targetSec && duration) {
        const [lo, hi] = input.targetSec;
        if (duration < lo * 0.5) { r *= 0.9; notes2.push(`The answer was short (${fmtClock(duration)}); aim for ${fmtClock(lo)} to ${fmtClock(hi)}.`); }
        else if (duration > hi * 1.6) { r *= 0.92; notes2.push(`The answer ran long (${fmtClock(duration)}); aim for ${fmtClock(lo)} to ${fmtClock(hi)}.`); }
      }
      scores.readiness = judged(r, notes2.join(" "));
    }
  } else if (words > 0) {
    limitations.push(`Only ${words} words, so scores are not shown. Speak for at least 20 seconds to get a report.`);
  }

  // ── What went well / improve
  const wentWell: string[] = [];
  const improve: string[] = [];
  if (scored) {
    const op = structure.find((s) => s.id === "opening")!;
    const ex = structure.find((s) => s.id === "example")!;
    const co = structure.find((s) => s.id === "conclusion")!;
    const exp = structure.find((s) => s.id === "explanation")!;
    if (!readAloud) {
      if (op.found) wentWell.push(`Your answer had a clear beginning: "${op.evidence}"`);
      if (exp.found) wentWell.push("You explained your reasoning, not just what you did.");
      if (ex.found) wentWell.push("You gave an example, which makes an answer easier to remember.");
      if (co.found) wentWell.push("You closed with a conclusion.");
    }
    if (wpm !== null && wpm >= 115 && wpm <= 155) wentWell.push(`Your pace was comfortable: about ${wpm} words per minute.`);
    if (fillerPer100 <= 2 && words >= 40) wentWell.push(`Filler words stayed low: ${fl.counted} in ${words} words.`);
    if (relevance && input.keyPoints && relevance.covered.length / input.keyPoints.length >= 0.6) wentWell.push(`You covered ${relevance.covered.length} of ${input.keyPoints.length} key ideas for this question.`);
    if (reliable && avg !== null && avg <= 20 && longSentences === 0) wentWell.push("Your sentences were short enough to follow by ear.");
    if (vad && vad.longPauses === 0 && words >= 40) wentWell.push("You kept going without long gaps.");

    const top = fl.findings.filter((f) => f.counted > 0).sort((a, b) => b.counted - a.counted)[0];
    if (top && fillerPer100 > 2) improve.push(top.label === "um / uh" ? `Pause silently instead of saying "um" or "uh" (${top.counted} times).` : `Pause instead of saying "${top.label}" (${top.counted} times).`);
    if (longSentences) improve.push(`Reduce long sentences: ${longSentences} went over ${LONG_SENTENCE} words. Say one idea, then breathe.`);
    if (wpm !== null && wpm < 105) improve.push(`Speak a little faster. At about ${wpm} words per minute you may lose the listener.`);
    if (wpm !== null && wpm > 165) improve.push(`Slow down. At about ${wpm} words per minute it is hard to take in. Pause after each main point.`);
    if (!readAloud) {
      if (!op.found) improve.push("Open with your answer in one line, then explain.");
      if (!co.found) improve.push("Finish with a clear conclusion: one sentence that restates your point.");
      if (!ex.found) improve.push('Add a short example. Start it with "For example," so the listener knows it is coming.');
    }
    if (hedgePer100 > 1.5) improve.push(`Replace hedges with a position. You used ${hd.count} hedging phrases ("${hd.findings.find((h) => h.kind === "hedge")?.label ?? "kind of"}"…).`);
    if (hd.apologies) improve.push("Drop the apologies. If you lose your thread, pause and say \"Let me rephrase that.\"");
    if (relevance && relevance.missed.length) improve.push(`You did not touch: ${relevance.missed.slice(0, 3).map((m) => m.label.toLowerCase()).join(", ")}.`);
    if (vad && vad.longPauses >= 3) improve.push(`You had ${vad.longPauses} pauses over 2 seconds. Keep a short bridge phrase ready, such as "The way I think about it is…".`);
    if (input.targetSec && duration && duration < input.targetSec[0] * 0.5) improve.push(`Your answer was short. Aim for ${fmtClock(input.targetSec[0])} to ${fmtClock(input.targetSec[1])}.`);
    if (input.targetSec && duration && duration > input.targetSec[1] * 1.6) improve.push(`Your answer ran long. Aim for ${fmtClock(input.targetSec[0])} to ${fmtClock(input.targetSec[1])}.`);
  }
  if (!wentWell.length && words > 0) wentWell.push(`You spoke for ${duration ? fmtClock(duration) : `${words} words`}. Every attempt gives us more to compare.`);

  // ── The sentence most worth rewriting
  let better: BetterSentence | null = null;
  if (scored) {
    let worst: { s: string; score: number } | null = null;
    for (const s of sentences) {
      const w = wordCount(s);
      if (w < 6) continue;
      const f = findFillers([s]).counted;
      const h = findHedges([s]);
      const v = findVocabulary([s]).length;
      const score = f * 2 + (h.count + h.apologies) * 2 + v * 2 + (reliable && w > 30 ? 2 : 0);
      if (score > 0 && (!worst || score > worst.score)) worst = { s, score };
    }
    if (worst) {
      const t = tightenSentence(worst.s);
      if (t) better = { original: worst.s, better: t.better, changes: t.changes };
    }
  }
  if (better) limitations.push("The better sentence is built from your own words by removing fillers and hedges and fixing common phrasing. Read it aloud and adjust it to sound like you.");

  return {
    version: 1,
    wordCount: words,
    sentenceCount: sentences.length,
    sentencesReliable: reliable,
    scored,
    metrics: {
      durationSec: duration,
      wpm,
      articulationWpm: articulation,
      fillerPer100,
      fillerCount: fl.counted,
      hesitations: fl.hesitations,
      hedgePer100,
      avgSentenceWords: avg,
      longSentences,
      repetitions,
      pauses,
      longPauses,
    },
    scores,
    fillers: fl.findings,
    hedges: hd.findings,
    sentences: sentenceFindings,
    vocabulary,
    structure,
    relevance,
    wentWell: wentWell.slice(0, 4),
    improve: improve.slice(0, 4),
    better,
    limitations,
  };
}
