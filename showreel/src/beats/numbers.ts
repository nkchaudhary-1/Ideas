import { trophy } from '../art/icons';
import { h, svgFrom } from '../core/dom';
import { createOdometer, rollOdometer } from '../core/odometer';
import { splitText } from '../core/split';
import type { NumbersBeat, Resolved } from '../types';
import type { BeatContext } from './context';

/**
 * Beat 3. Three metrics count up one after another, each with a rule that fills as it rolls,
 * then the award chip snaps in with a sheen.
 */
export function buildNumbers({ beat, cam, tl, m, tick, snap, at, reduced }: BeatContext<Resolved<NumbersBeat>>): void {
  const caption = h('h2', 'caption');
  const rows = beat.metrics.map((metric) => {
    const odometer = createOdometer(metric);
    const label = h('span', 'metric-label', [metric.label]);
    const fill = h('span', 'metric-fill');
    const track = h('span', 'metric-track', [fill]);
    const row = h('div', 'metric', [odometer.el, label, track]);
    return { row, odometer, label, track, fill };
  });

  const icon = h('span', 'award-icon', [svgFrom(trophy)]);
  const sheen = h('span', 'chip-sheen chip-sheen--dark');
  const award = h('div', 'award', [icon, h('span', 'award-text', [beat.award]), sheen]);

  cam.append(caption, h('div', 'metrics', rows.map((r) => r.row)), award);
  const split = splitText(caption, beat.segments.join('\n'));

  m.reveal(split.words, tick(1));

  // Each metric lands a half second after the last, on the beat.
  const first = tick(10);
  rows.forEach((r, i) => {
    const t = first + tick(4) * i;
    m.wipe(r.track, t, { dur: 0.6 });
    m.rise(r.label, t + tick(1));
    rollOdometer(tl, r.odometer, t + tick(1), { dur: 1.9, reduced });
    if (!reduced) tl.fromTo(r.fill, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 1.9, ease: 'expo.out' }, t + tick(1));
    else m.fade(r.fill, t);
  });

  // The award arrives when the voiceover gets to it.
  const awardAt = snap(at(0.62));
  m.pop(award, awardAt, { from: 0.5, dur: 0.6, ease: 'back.out(2)' });
  if (!reduced) tl.fromTo(sheen, { xPercent: -130 }, { xPercent: 130, duration: 1, ease: 'power2.inOut' }, awardAt + 0.5);
}
