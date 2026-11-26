import { SIGHTING_ART } from '../art/sightings';
import { h, svgFrom } from '../core/dom';
import { splitText } from '../core/split';
import type { CuriosityBeat, Resolved } from '../types';
import type { BeatContext } from './context';

/**
 * Beat 4, where the temperature flips. Loose and unhurried. The caption, then a viewfinder hops
 * across three things that make a person curious while the voiceover names them.
 */
export function buildCuriosity({ beat, cam, tl, m, tick, snap, at, reduced }: BeatContext<Resolved<CuriosityBeat>>): void {
  const caption = h('h2', 'caption');
  const tiles = beat.sightings.map((s) => {
    const art = svgFrom(SIGHTING_ART[s.art]);
    return { art, kind: s.art, el: h('div', 'tile', [art, h('span', 'tile-label', [s.label])]) };
  });
  const corners = ['tl', 'tr', 'bl', 'br'].map((c) => h('i', `vf-corner vf-corner--${c}`));
  const finder = h('div', 'viewfinder', corners);
  cam.append(caption, h('div', 'sightings', [finder, ...tiles.map((t) => t.el)]));
  const split = splitText(caption, beat.segments.join('\n'));

  m.reveal(split.words, tick(1), { stagger: 0.1 });

  const times = tiles.map((_, i) => snap(at(0.44 + 0.16 * i)));
  tiles.forEach((tile, i) => {
    const t = times[i]!;
    m.pop(tile.el, t, { from: 0.7 });

    // The viewfinder finds focus on the first tile, then hops from tile to tile (one tile pitch = 100%).
    if (reduced) {
      // No hop: the frame fades in on the new tile instead.
      tl.fromTo(finder, { opacity: 0, xPercent: i * 100 }, { opacity: 1, duration: 0.5, ease: 'power1.out' }, t);
    } else if (i === 0) {
      tl.fromTo(finder, { scale: 1.5, opacity: 0, xPercent: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2)' }, t);
    } else {
      tl.fromTo(finder, { xPercent: (i - 1) * 100 }, { xPercent: i * 100, duration: 0.7, ease: 'back.out(1.6)', immediateRender: false }, t - tick(1));
      tl.fromTo(finder, { scale: 1.1 }, { scale: 1, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, t + 0.45);
    }
    if (reduced) return;

    // Each sighting does one small thing of its own.
    const q = (selector: string) => tile.art.querySelector(selector);
    const at0 = t + 0.15;
    if (tile.kind === 'signboard') tl.fromTo(q('.sign-board'), { rotation: -7, svgOrigin: '100 40' }, { rotation: 0, svgOrigin: '100 40', duration: 1.2, ease: 'elastic.out(1, 0.4)' }, at0);
    if (tile.kind === 'sunset') tl.fromTo(q('.sun'), { y: 56 }, { y: 0, duration: 1.2, ease: 'expo.out' }, at0);
    if (tile.kind === 'app') tl.fromTo(q('.dots')?.children ?? [], { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(3)', stagger: 0.1 }, at0);
  });
}
