import { h, slug } from '../core/dom';
import { splitText } from '../core/split';
import type { CompaniesBeat, Resolved } from '../types';
import type { BeatContext } from './context';

/** Beat 2. The caption, then the logo chips snapping in one eighth note apart, then a sheen passing along them. */
export function buildCompanies({ beat, cam, tl, m, tick, snap, at, reduced }: BeatContext<Resolved<CompaniesBeat>>): void {
  const caption = h('h2', 'caption');
  const chips = beat.companies.map((name) => {
    const sheen = h('span', 'chip-sheen');
    return h('span', `chip chip--${slug(name)}`, [h('span', 'chip-text', [name]), sheen]);
  });
  cam.append(caption, h('div', 'chips', chips));
  const split = splitText(caption, beat.segments.join('\n'));

  m.reveal(split.words, tick(1));

  // Chips snap in with a small overshoot, locked to the grid.
  const first = snap(at(0.18));
  chips.forEach((chip, i) => {
    const t = first + tick(2) * i;
    if (reduced) m.fade(chip, t);
    else m.pop(chip, t, { from: 0.6, dur: 0.42, ease: 'back.out(1.8)' });
  });

  // Once they have all landed, a sheen runs along them, then once more later in the beat.
  if (reduced) return;
  const landed = first + tick(2) * chips.length + 0.4;
  [landed, snap(at(0.78))].forEach((pass, n) => {
    chips.forEach((chip, i) => {
      // Passes after the first must not render early: they would overwrite the first pass's end state.
      tl.fromTo(chip.querySelector('.chip-sheen'), { xPercent: -130 }, { xPercent: 130, duration: 0.9, ease: 'power2.inOut', immediateRender: n === 0 }, pass + tick(1) * i);
    });
  });
}
