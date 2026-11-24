// Small text helpers shared by the analysis. Everything here is plain string work on the real transcript.

export function tokenize(s: string): string[] {
  return (s.toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? []) as string[];
}

export function wordCount(s: string): number {
  return tokenize(s).length;
}

/**
 * Split a transcript into sentences. Lines count as boundaries because speech recognition returns one line per
 * phrase and often adds no punctuation. `reliable` is false when there is too little punctuation or too few
 * line breaks to say anything about sentence length.
 */
export function splitSentences(text: string): { sentences: string[]; reliable: boolean } {
  const lines = text.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
  const sentences: string[] = [];
  let terminals = 0;
  for (const line of lines) {
    const parts = line.split(/(?<=[.!?])\s+/).map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      sentences.push(p);
      if (/[.!?]["')\]]*$/.test(p)) terminals++;
    }
  }
  const words = wordCount(text);
  const boundaries = terminals + Math.max(0, lines.length - 1);
  const reliable = words > 0 && boundaries >= words / 45;
  return { sentences, reliable };
}

export function capitalise(s: string): string {
  const t = s.trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

export function ensureEnd(s: string): string {
  const t = s.trim();
  return /[.!?]["')\]]*$/.test(t) ? t : t + ".";
}

export function trimQuote(s: string, max = 140): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function plural(n: number, one: string, many?: string): string {
  return `${n} ${n === 1 ? one : many ?? one + "s"}`;
}
