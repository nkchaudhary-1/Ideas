import type { Analysis } from "../types";
import { fmtClock } from "./text";

export interface CompareRow {
  label: string;
  prev: string;
  next: string;
  /** "better", "worse" or "same". Null when one side was not measured. */
  verdict: "better" | "worse" | "same" | null;
}

type ScoreKey = keyof Analysis["scores"];
const SCORE_LABELS: [ScoreKey, string][] = [
  ["readiness", "Interview readiness"],
  ["relevance", "Interview relevance"],
  ["clarity", "Clarity"],
  ["fluency", "Fluency"],
  ["structure", "Structure"],
  ["pace", "Pacing"],
  ["fillers", "Filler word control"],
  ["phrasing", "Phrasing"],
];

const fmtScore = (v: number | null) => (v === null ? "not scored" : `${v}/10`);

function verdict(a: number | null, b: number | null, higherIsBetter: boolean, tolerance = 0): CompareRow["verdict"] {
  if (a === null || b === null) return null;
  const d = (b - a) * (higherIsBetter ? 1 : -1);
  if (Math.abs(b - a) <= tolerance) return "same";
  return d > 0 ? "better" : "worse";
}

export function compareAnalyses(prev: Analysis, next: Analysis, prevSec?: number, nextSec?: number): CompareRow[] {
  const rows: CompareRow[] = SCORE_LABELS.map(([k, label]) => ({
    label,
    prev: fmtScore(prev.scores[k].value),
    next: fmtScore(next.scores[k].value),
    verdict: verdict(prev.scores[k].value, next.scores[k].value, true),
  }));
  rows.push({
    label: "Speed",
    prev: prev.metrics.wpm === null ? "not measured" : `${prev.metrics.wpm} wpm`,
    next: next.metrics.wpm === null ? "not measured" : `${next.metrics.wpm} wpm`,
    // Closer to the comfortable middle (135) is better.
    verdict: prev.metrics.wpm === null || next.metrics.wpm === null ? null : verdict(Math.abs(prev.metrics.wpm - 135), Math.abs(next.metrics.wpm - 135), false, 3),
  });
  rows.push({
    label: "Filler words per 100",
    prev: String(prev.metrics.fillerPer100),
    next: String(next.metrics.fillerPer100),
    verdict: verdict(prev.metrics.fillerPer100, next.metrics.fillerPer100, false, 0.2),
  });
  rows.push({ label: "Words", prev: String(prev.wordCount), next: String(next.wordCount), verdict: null });
  if (prevSec || nextSec) rows.push({ label: "Length", prev: prevSec ? fmtClock(prevSec) : "n/a", next: nextSec ? fmtClock(nextSec) : "n/a", verdict: null });
  return rows;
}
