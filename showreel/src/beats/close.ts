import { h } from '../core/dom';
import { createOdometer, rollOdometer } from '../core/odometer';
import { splitText } from '../core/split';
import type { CloseBeat, Resolved } from '../types';
import type { BeatContext } from './context';

/** Seconds the years take to roll. The ease is the speed ramp: fast, then settling. */
const ROLL = 3.4;
const RAMP = 'power4.out';

/**
 * Beat 7. The grade turns from cool to warm across the beat, and the pace ramps down with it.
 * The years roll up fast and settle on the number, with a tick for each year that lands in step
 * with the digits. Then the payoff arrives slower, in the warm, loose motion.
 */
export function buildClose({ beat, cam, tl, m, motion, tick, snap, at, reduced }: BeatContext<Resolved<CloseBeat>>): void {
  const odometer = createOdometer({ value: beat.years });
  const words = h('h2', 'caption close-years');
  const row = h('div', 'close-row', [odometer.el, words]);
  const line = h('h2', 'caption close-line');
  const ticks = Array.from({ length: beat.years }, () => h('i', 'close-tick'));
  const stage = h('div', 'close-a', [row, line, h('div', 'close-ticks', ticks)]);

  const payoff = h('h2', 'caption close-payoff');
  const rule = h('span', 'rule');
  const end = h('div', 'close-b', [payoff, rule]);
  cam.append(stage, end);

  // `caption` carries the words after the number: "years in." then "Same excitement."
  const [first = '', ...rest] = beat.segments.join('\n').split('\n');
  const yearsSplit = splitText(words, first);
  const lineSplit = splitText(line, rest.join('\n'));
  const payoffSplit = splitText(payoff, beat.payoff);

  const rollAt = tick(2);
  const warm = motion('loose');

  // The number rolls; each tick lights as the digits pass its year.
  rollOdometer(tl, odometer, rollAt, { dur: ROLL, ease: RAMP, reduced });
  const spins = 10 + beat.years; // rows travelled: one full cycle, then the digit
  ticks.forEach((tickEl, k) => {
    const progress = (10 + k + 1) / spins;
    const when = rollAt + ROLL * (1 - Math.pow(1 - progress, 1 / 4)); // inverse of power4.out
    if (reduced) m.fade(tickEl, rollAt + 0.3);
    else tl.fromTo(tickEl, { opacity: 0.18, scaleY: 0.5, transformOrigin: '50% 100%' }, { opacity: 1, scaleY: 1, duration: 0.25, ease: 'expo.out' }, when);
  });

  m.reveal(yearsSplit.words, rollAt + 0.9, { stagger: 0.08 });
  m.reveal(lineSplit.words, snap(rollAt + ROLL * 0.7), { stagger: 0.07 });

  // Hand over to the payoff: the first half lifts out, slower than before.
  const handover = snap(at(0.5));
  if (reduced) tl.to(stage, { opacity: 0, duration: 0.6 }, handover);
  else tl.to(stage, { yPercent: -14, opacity: 0, duration: 0.7, ease: 'power3.in' }, handover);

  warm.reveal(payoffSplit.lines[0]!, handover + 0.6, { dur: 1.2, rotate: 0 });
  warm.reveal(payoffSplit.lines[1]!, handover + 1.7, { dur: 1.4, rotate: 0 });
  warm.wipe(rule, handover + 3, { dur: 1.2, origin: '50% 50%' });
}
