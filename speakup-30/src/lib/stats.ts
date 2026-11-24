// Everything shown on the dashboard and progress screens is computed here from the saved sessions and attempts.
import type { AppData, Attempt, SessionRecord } from "./types";
import { dateKey } from "./time";
import { PROGRAMME_DAYS, WEEKS, weekOf } from "../content/curriculum";

export function completedDays(d: AppData): Set<number> {
  return new Set(d.sessions.map((s) => s.day));
}

/** The next day to practise: the first one not yet completed. */
export function currentDay(d: AppData): number {
  const done = completedDays(d);
  for (let i = 1; i <= PROGRAMME_DAYS; i++) if (!done.has(i)) return i;
  return PROGRAMME_DAYS;
}
export const programmeFinished = (d: AppData) => completedDays(d).size >= PROGRAMME_DAYS;

export function streak(d: AppData, now = new Date()): number {
  const days = new Set(d.sessions.map((s) => dateKey(s.completedAt)));
  const cursor = new Date(now);
  // A streak is still alive if you practised yesterday and have not yet today.
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(dateKey(cursor))) {
    n++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export const practisedToday = (d: AppData, now = new Date()) => d.sessions.some((s) => dateKey(s.completedAt) === dateKey(now));

export function totals(d: AppData) {
  const totalSec = d.sessions.reduce((n, s) => n + s.activeSec, 0);
  return { sessions: d.sessions.length, totalSec, avgSec: d.sessions.length ? totalSec / d.sessions.length : 0, days: completedDays(d).size };
}

/** Attempts with a real score, oldest first. */
export function scoredAttempts(d: AppData): Attempt[] {
  return d.attempts.filter((a) => a.analysis?.scored).sort((a, b) => a.at.localeCompare(b.at));
}

type ScoreKey = keyof NonNullable<Attempt["analysis"]>["scores"];
export function scoreSeries(d: AppData, key: ScoreKey): { at: string; day: number; v: number }[] {
  const out: { at: string; day: number; v: number }[] = [];
  for (const a of scoredAttempts(d)) {
    const v = a.analysis!.scores[key].value;
    if (v !== null) out.push({ at: a.at, day: a.day, v });
  }
  return out;
}
export function metricSeries(d: AppData, key: "wpm" | "fillerPer100"): { at: string; day: number; v: number }[] {
  const out: { at: string; day: number; v: number }[] = [];
  for (const a of d.attempts.slice().sort((x, y) => x.at.localeCompare(y.at))) {
    const m = a.analysis?.metrics;
    if (!m || !a.analysis?.scored) continue;
    const v = m[key];
    if (v !== null && v !== undefined) out.push({ at: a.at, day: a.day, v });
  }
  return out;
}

/** Change in readiness between your first and latest analysed answers. Null until there are two. */
export function improvement(d: AppData): { from: number; to: number; delta: number; n: number } | null {
  const s = scoreSeries(d, "readiness");
  if (s.length < 2) return null;
  const k = Math.min(3, Math.floor(s.length / 2));
  const avg = (xs: { v: number }[]) => xs.reduce((n, x) => n + x.v, 0) / xs.length;
  const from = avg(s.slice(0, k));
  const to = avg(s.slice(-k));
  return { from: Math.round(from * 10) / 10, to: Math.round(to * 10) / 10, delta: Math.round((to - from) * 10) / 10, n: s.length };
}

export function weekProgress(d: AppData, day: number) {
  const w = weekOf(day);
  const done = completedDays(d);
  let n = 0;
  for (let i = w.from; i <= w.to; i++) if (done.has(i)) n++;
  return { week: w, done: n, total: w.to - w.from + 1 };
}

/** How many calendar days of the last seven (including today) you practised. */
export function last7(d: AppData, now = new Date()): { key: string; done: boolean; label: string }[] {
  const have = new Set(d.sessions.map((s) => dateKey(s.completedAt)));
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const x = new Date(now);
    x.setDate(x.getDate() - i);
    out.push({ key: dateKey(x), done: have.has(dateKey(x)), label: x.toLocaleDateString("en-GB", { weekday: "narrow" }) });
  }
  return out;
}

export function lastSession(d: AppData): SessionRecord | null {
  return d.sessions.length ? d.sessions.slice().sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0] : null;
}

export function weekRows(d: AppData) {
  return WEEKS.map((w) => {
    const sessions = d.sessions.filter((s) => s.day >= w.from && s.day <= w.to);
    const attempts = scoredAttempts(d).filter((a) => a.day >= w.from && a.day <= w.to);
    const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
    const get = (f: (a: Attempt) => number | null) => attempts.map(f).filter((v): v is number => v !== null);
    return {
      week: w,
      days: new Set(sessions.map((s) => s.day)).size,
      sessions: sessions.length,
      minutes: Math.round(sessions.reduce((n, s) => n + s.activeSec, 0) / 60),
      readiness: avg(get((a) => a.analysis!.scores.readiness.value)),
      fillers: avg(get((a) => a.analysis!.metrics.fillerPer100)),
      wpm: avg(get((a) => a.analysis!.metrics.wpm)),
    };
  });
}

export function attemptsForQuestion(d: AppData, question: string, day: number): Attempt[] {
  return d.attempts.filter((a) => a.day === day && a.question === question && a.kind !== "read-aloud").sort((a, b) => a.at.localeCompare(b.at));
}
