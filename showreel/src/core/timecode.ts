import type { Timecode } from '../types';

const CLOCK = /^(\d+):([0-5]?\d)(\.\d+)?$/;

/** Turns `75`, `"75.5"`, `"1:15"` or `"0:22.5"` into seconds. Throws on anything else. */
export function parseTimecode(tc: Timecode): number {
  if (typeof tc === 'number') {
    if (!Number.isFinite(tc) || tc < 0) throw new Error(`Invalid timecode: ${tc}`);
    return tc;
  }
  const clock = CLOCK.exec(tc.trim());
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]) + Number(clock[3] ?? 0);
  const plain = Number(tc);
  if (tc.trim() !== '' && Number.isFinite(plain) && plain >= 0) return plain;
  throw new Error(`Invalid timecode: "${tc}". Use seconds (75) or m:ss ("1:15").`);
}

/** Seconds to `m:ss`, or `m:ss.s` when `decimals` is 1. */
export function formatTimecode(seconds: number, decimals = 0): string {
  const clamped = Math.max(0, seconds);
  const whole = Math.floor(clamped);
  const m = Math.floor(whole / 60);
  const s = String(whole % 60).padStart(2, '0');
  const frac = decimals > 0 ? `.${String(Math.floor((clamped - whole) * 10 ** decimals)).padStart(decimals, '0')}` : '';
  return `${m}:${s}${frac}`;
}
