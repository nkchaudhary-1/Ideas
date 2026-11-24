// Script markup → speaking units for the teleprompter.
//
// Authors write plain text with a few inline markers:
//   [PAUSE 1] [PAUSE 2] [BREATHE]     timed stops (the teleprompter really waits)
//   [SLOW] … [CONTINUE]               slows the pace by a quarter until [CONTINUE]
//   [EMPHASISE] [TONE] [CONFIDENT] [SMILE] [LOOK UP]   stage directions shown as chips
//   *a phrase*                        emphasised phrase (blue)
//   {{key|Label|Coaching hint}}       a placeholder the speaker fills with their own detail
// Blank lines separate paragraphs. The text is split into sentences, then at pauses, and long sentences are cut
// again at commas and conjunctions so each unit is a manageable speaking chunk.
import type { CueMode, SupportMode } from "./types";
import { tokenize } from "./analysis/text";

export type CueId = "pause1" | "pause2" | "breathe" | "emphasise" | "slow" | "tone" | "confident" | "smile" | "lookup" | "continue";
export type CueGroup = "pause" | "emphasis" | "other";

export const CUES: Record<CueId, { token: string; label: string; group: CueGroup; seconds?: number; hint: string }> = {
  pause1: { token: "PAUSE 1", label: "Pause — 1 sec", group: "pause", seconds: 1, hint: "Stop for one second. Let the last point land." },
  pause2: { token: "PAUSE 2", label: "Pause — 2 sec", group: "pause", seconds: 2, hint: "Stop for two seconds. Silence reads as confidence." },
  breathe: { token: "BREATHE", label: "Breathe", group: "pause", seconds: 1.5, hint: "Take a slow breath in through the nose." },
  emphasise: { token: "EMPHASISE", label: "Emphasise this phrase", group: "emphasis", hint: "Lean on the blue words. Louder, slower, clearer." },
  slow: { token: "SLOW", label: "Slow down", group: "other", hint: "Drop your pace by a quarter until the next Continue." },
  tone: { token: "TONE", label: "Change your tone", group: "other", hint: "Shift your energy: warmer, lower or more direct." },
  confident: { token: "CONFIDENT", label: "Confident delivery", group: "other", hint: "Steady voice, no upward lift at the end." },
  smile: { token: "SMILE", label: "Smile", group: "other", hint: "Smile as you say it. It changes how the words sound." },
  lookup: { token: "LOOK UP", label: "Look up", group: "other", hint: "Look away from the screen, as if at the interviewer." },
  continue: { token: "CONTINUE", label: "Continue", group: "other", hint: "Back to your normal pace." },
};
const TOKEN_TO_CUE: Record<string, CueId> = Object.fromEntries((Object.keys(CUES) as CueId[]).map((id) => [CUES[id].token, id]));

export type Part =
  | { t: "text"; text: string }
  | { t: "em"; text: string; emId: number }
  | { t: "cue"; cue: CueId }
  | { t: "ph"; key: string; label: string; value?: string };

export interface Unit {
  id: number;
  para: number;
  parts: Part[];
  words: number;
  /** Seconds the teleprompter waits after this unit (from pause and breathe cues). */
  pauseAfter: number;
  /** 1 normally, 0.75 between [SLOW] and [CONTINUE]. */
  speed: number;
  /** The spoken text only, without cues. */
  plain: string;
  /** Emphasised phrases in this unit. */
  emphasised: string[];
}
export interface Placeholder {
  key: string;
  label: string;
  hint: string;
}
export interface ScriptDoc {
  units: Unit[];
  paras: number;
  placeholders: Placeholder[];
  words: number;
  /** Placeholders without a filled-in answer. */
  unfilled: number;
  errors: string[];
}

const PH_RE = /\{\{([a-z0-9_]+)\|([^|}]+)\|([^}]+)\}\}/gi;
const TOKEN_RE = /(\[[A-Z0-9 ]+\]|\*[^*]+\*|\{\{[^}]+\}\})/g;
const CONJ = new Set(["and", "but", "because", "which", "while", "so", "then", "although", "since"]);
const MAX_UNIT_WORDS = 22;
const TARGET_UNIT_WORDS = 16;
/** An unfilled placeholder is timed as a short phrase, so the estimate matches a real answer. */
const UNFILLED_WORDS = 6;

interface Atom {
  kind: "text" | "em" | "ph" | "cue";
  text: string;
  emId?: number;
  key?: string;
  label?: string;
  value?: string;
  cue?: CueId;
  words: number;
}

export function extractPlaceholders(markup: string): Placeholder[] {
  const out: Placeholder[] = [];
  const seen = new Set<string>();
  PH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PH_RE.exec(markup))) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push({ key: m[1], label: m[2].trim(), hint: m[3].trim() });
  }
  return out;
}

function atomsFromText(text: string): Atom[] {
  const out: Atom[] = [];
  for (const m of text.matchAll(/\s*\S+\s*/g)) out.push({ kind: "text", text: m[0], words: tokenize(m[0]).length });
  return out;
}

function partsFromAtoms(atoms: Atom[]): Part[] {
  const parts: Part[] = [];
  for (const a of atoms) {
    const last = parts[parts.length - 1];
    if (a.kind === "text") {
      if (last && last.t === "text") last.text += a.text;
      else parts.push({ t: "text", text: a.text });
    } else if (a.kind === "em") {
      if (last && last.t === "em" && last.emId === a.emId) last.text += a.text;
      else parts.push({ t: "em", text: a.text, emId: a.emId! });
    } else if (a.kind === "ph") parts.push({ t: "ph", key: a.key!, label: a.label!, value: a.value });
    else parts.push({ t: "cue", cue: a.cue! });
  }
  // Trim the outer whitespace of the unit.
  const first = parts.find((p) => p.t === "text" || p.t === "em") as { text: string } | undefined;
  if (first) first.text = first.text.replace(/^\s+/, "");
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.t === "text" || p.t === "em") {
      p.text = p.text.replace(/\s+$/, "");
      break;
    }
    if (p.t === "ph") break;
  }
  return parts;
}

/** Cut a long run of atoms at commas and conjunctions into chunks of roughly 16 words. */
function chunkAtoms(atoms: Atom[]): Atom[][] {
  const count = (xs: Atom[]) => xs.reduce((n, a) => n + (a.kind === "cue" ? 0 : a.words), 0);
  if (count(atoms) <= MAX_UNIT_WORDS) return [atoms];
  const candidates: number[] = [];
  let before = 0;
  const total = count(atoms);
  for (let i = 0; i < atoms.length - 1; i++) {
    const a = atoms[i];
    if (a.kind !== "cue") before += a.words;
    const n = atoms[i + 1];
    const endsPunct = (a.kind === "text" || a.kind === "em") && /[,;—–]\s*$/.test(a.text);
    const beforeConj = n.kind === "text" && CONJ.has(n.text.trim().toLowerCase().replace(/[^a-z]/g, ""));
    const sameEm = a.kind === "em" && n.kind === "em" && a.emId === n.emId;
    if ((endsPunct || beforeConj) && !sameEm && before >= 5 && total - before >= 5) candidates.push(i);
  }
  if (!candidates.length) return [atoms];
  // Choose the split nearest the target size, then recurse on both sides.
  let best = candidates[0];
  let bestDist = Infinity;
  for (const i of candidates) {
    const left = count(atoms.slice(0, i + 1));
    const d = Math.abs(left - TARGET_UNIT_WORDS) + (total - left < 5 ? 100 : 0);
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  }
  return [...chunkAtoms(atoms.slice(0, best + 1)), ...chunkAtoms(atoms.slice(best + 1))];
}

function emphasisedPhrases(atoms: Atom[]): string[] {
  const groups = new Map<number, string>();
  for (const a of atoms) if (a.kind === "em") groups.set(a.emId!, (groups.get(a.emId!) ?? "") + a.text);
  return [...groups.values()].map((g) => g.replace(/\s+/g, " ").trim());
}

export function parseScript(markup: string, fills: Record<string, string> = {}): ScriptDoc {
  const placeholders = extractPlaceholders(markup);
  const errors: string[] = [];
  const units: Unit[] = [];
  const paras = markup.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  let speed = 1;
  let emCounter = 0;

  paras.forEach((para, pi) => {
    let cur: Atom[] = [];
    const flush = (pauseAfter = 0) => {
      const spoken = cur.filter((a) => a.kind !== "cue");
      if (!spoken.length) return;
      // Chunk long sentences; the pause belongs to the last chunk, SLOW state applies to all.
      const chunks = chunkAtoms(cur);
      chunks.forEach((atoms, ci) => {
        const parts = partsFromAtoms(atoms);
        const plain = atoms
          .filter((a) => a.kind !== "cue")
          .map((a) => (a.kind === "ph" ? (a.value?.trim() ? a.value : `[${a.label}]`) : a.text))
          .join("")
          .replace(/\s+/g, " ")
          .trim();
        units.push({
          id: units.length,
          para: pi,
          parts,
          words: Math.max(1, atoms.reduce((n, a) => n + (a.kind === "cue" ? 0 : a.words), 0)),
          pauseAfter: ci === chunks.length - 1 ? pauseAfter : 0,
          speed,
          plain,
          emphasised: emphasisedPhrases(atoms),
        });
      });
      cur = [];
    };
    const attachPause = (secs: number, atom: Atom) => {
      const hasWords = cur.some((a) => a.kind !== "cue");
      if (hasWords) {
        cur.push(atom);
        flush(secs);
      } else if (units.length && units[units.length - 1].para === pi) {
        const u = units[units.length - 1];
        u.parts.push({ t: "cue", cue: atom.cue! });
        u.pauseAfter = Math.max(u.pauseAfter, secs);
      } else {
        cur.push(atom); // a pause at the very start of a paragraph: shown, not timed
      }
    };

    for (const tok of para.split(TOKEN_RE)) {
      if (!tok) continue;
      if (tok.startsWith("[") && tok.endsWith("]")) {
        const id = TOKEN_TO_CUE[tok.slice(1, -1)];
        if (!id) {
          errors.push(`Unknown cue ${tok}`);
          continue;
        }
        const atom: Atom = { kind: "cue", text: "", cue: id, words: 0 };
        if (CUES[id].group === "pause") attachPause(CUES[id].seconds!, atom);
        else {
          if (id === "slow") speed = 0.75;
          if (id === "continue") speed = 1;
          cur.push(atom);
        }
      } else if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
        const id = emCounter++;
        for (const a of atomsFromText(tok.slice(1, -1))) cur.push({ ...a, kind: "em", emId: id });
      } else if (tok.startsWith("{{")) {
        const m = tok.match(/^\{\{([a-z0-9_]+)\|([^|}]+)\|([^}]+)\}\}$/i);
        if (!m) {
          errors.push(`Bad placeholder ${tok}`);
          continue;
        }
        const value = fills[m[1]]?.trim();
        cur.push({ kind: "ph", text: "", key: m[1], label: m[2].trim(), value, words: value ? tokenize(value).length || 1 : Math.max(tokenize(m[2]).length, UNFILLED_WORDS) });
      } else {
        // Plain text: close a unit at every sentence end.
        let rest = tok;
        for (;;) {
          const m = rest.match(/^([\s\S]*?[.?!]+["')]*)(\s+|$)/);
          if (!m) break;
          const head = m[1];
          rest = rest.slice(m[0].length);
          for (const a of atomsFromText(head + (rest ? " " : ""))) cur.push(a);
          flush();
          if (!rest) break;
        }
        if (rest.trim()) for (const a of atomsFromText(rest)) cur.push(a);
      }
    }
    flush();
  });

  const words = units.reduce((n, u) => n + u.words, 0);
  const unfilled = placeholders.filter((p) => !fills[p.key]?.trim()).length;
  return { units, paras: paras.length, placeholders, words, unfilled, errors };
}

export function unitSeconds(u: Unit, wpm: number): number {
  return Math.max(1.2, (u.words * 60) / wpm / u.speed);
}
export function scriptSeconds(doc: ScriptDoc, wpm: number): number {
  return doc.units.reduce((n, u) => n + unitSeconds(u, wpm) + u.pauseAfter, 0);
}

/** How a cue is shown for a cue mode. */
export function cueDisplay(cue: CueId, mode: CueMode): "chip" | "dot" | "none" {
  const group = CUES[cue].group;
  if (mode === "beginner") return "chip";
  if (mode === "intermediate") return group === "pause" || group === "emphasis" ? "chip" : "none";
  return group === "pause" ? "dot" : "none";
}

/** The text shown for a unit under a support mode (days 22 onward fade the script out). */
export function supportText(u: Unit, mode: SupportMode): string | null {
  if (mode === "full") return null;
  const words = u.plain.split(/\s+/);
  if (mode === "first-words") return words.slice(0, 3).join(" ") + (words.length > 3 ? " …" : "");
  if (u.emphasised.length) return u.emphasised.join(" · ");
  return words.slice(0, 3).join(" ") + " …";
}
