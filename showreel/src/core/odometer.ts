import { gsap } from 'gsap';
import { h } from './dom';

export interface OdometerSpec {
  prefix?: string;
  value: number;
  decimals?: number;
  suffix?: string;
}

interface Column {
  strip: HTMLElement;
  rows: number;
  /** Where the strip stops: a number of rows from the top. */
  stop: number;
}

export interface Odometer {
  el: HTMLElement;
  columns: Column[];
}

/** A suffix made of letters (` bps`) sits small beside the number; a symbol (`%`) stays full size. */
const isUnit = (suffix: string) => /^[a-z]+$/i.test(suffix.trim());

/**
 * Builds a rolling-digit counter. Each digit is a strip of 0 to 9 that moves with `transform`,
 * so counting up never touches layout. The digits further right spin more times, like a real
 * odometer, so the whole number reads as counting up and settles from the left.
 */
export function createOdometer(spec: OdometerSpec): Odometer {
  const text = spec.value.toFixed(spec.decimals ?? 0);
  const digitCount = [...text].filter((ch) => /\d/.test(ch)).length;
  const el = h('span', 'od num', [], { role: 'img', 'aria-label': `${spec.prefix ?? ''}${text}${spec.suffix ?? ''}`.trim() });
  el.setAttribute('data-odometer', '');
  const columns: Column[] = [];

  if (spec.prefix) el.append(h('span', 'od-fix', [spec.prefix], { 'aria-hidden': 'true' }));

  let digitIndex = 0;
  for (const ch of text) {
    if (!/\d/.test(ch)) {
      el.append(h('span', 'od-fix', [ch], { 'aria-hidden': 'true' }));
      continue;
    }
    const spins = 1 + (digitCount - 1 - digitIndex);
    const rows = (spins + 1) * 10;
    const strip = h('span', 'od-strip', [], { 'aria-hidden': 'true' });
    for (let r = 0; r < rows; r++) strip.append(h('i', '', [String(r % 10)]));
    el.append(h('span', 'od-col', [strip]));
    columns.push({ strip, rows, stop: spins * 10 + Number(ch) });
    digitIndex++;
  }

  const suffix = spec.suffix;
  if (suffix && suffix.trim()) {
    el.append(h('span', isUnit(suffix) ? 'od-unit' : 'od-fix', [suffix.trim()], { 'aria-hidden': 'true' }));
  }
  return { el, columns };
}

/**
 * Rolls every column from 0 to its digit across `dur`. With `reduced`, the digits sit at their
 * final value and the whole counter fades in instead.
 */
export function rollOdometer(
  tl: gsap.core.Timeline,
  od: Odometer,
  at: number,
  o: { dur: number; ease?: string; reduced: boolean },
): void {
  const final = (c: Column) => -(c.stop / c.rows) * 100;
  if (o.reduced) {
    for (const c of od.columns) gsap.set(c.strip, { yPercent: final(c) });
    tl.fromTo(od.el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, at);
    return;
  }
  // Hidden until it starts, so the zeros are never seen sitting there waiting.
  tl.fromTo(od.el, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'none' }, at);
  for (const c of od.columns) {
    tl.fromTo(c.strip, { yPercent: 0 }, { yPercent: final(c), duration: o.dur, ease: o.ease ?? 'expo.out' }, at);
  }
}
