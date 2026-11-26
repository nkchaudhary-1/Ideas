import { h } from '../core/dom';
import { splitText } from '../core/split';
import type { CraftBeat, Resolved } from '../types';
import type { BeatContext } from './context';

/** The sprite: a four-point star on a 9 x 9 grid. The centre cell is "one pixel". */
const SPRITE = [
  '....#....',
  '....#....',
  '...###...',
  '..#####..',
  '#########',
  '..#####..',
  '...###...',
  '....#....',
  '....#....',
];
const SIZE = SPRITE.length;
const MID = (SIZE - 1) / 2;

/** What sits in the eight tiles around the sprite's tile: tiny wireframes of interface parts. */
const PARTS = ['button', 'toggle', 'card', 'input', null, 'avatar', 'chart', 'tabs', 'slider'] as const;

/**
 * Beat 6. Precise and satisfying. One pixel appears, the grid fills outward into a sprite, the
 * sprite shrinks into one tile of a system, and the other tiles fill in around it.
 * The caption is split in two: "From one pixel" at the start, "to a whole system." at the end.
 */
export function buildCraft({ beat, cam, tl, m, tick, snap, at, reduced }: BeatContext<Resolved<CraftBeat>>): void {
  const top = h('h2', 'caption craft-caption');
  const bottom = h('h2', 'caption craft-caption');

  // The sprite: only filled cells are drawn.
  const cells: { el: HTMLElement; d: number; centre: boolean }[] = [];
  const sprite = h('div', 'sprite');
  SPRITE.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '#') return;
      const centre = x === MID && y === MID;
      const el = h('i', centre ? 'px px--centre' : 'px', [], { style: `grid-column:${x + 1};grid-row:${y + 1}` });
      sprite.append(el);
      cells.push({ el, d: Math.abs(x - MID) + Math.abs(y - MID), centre });
    });
  });

  // The system: a 3 x 3 grid of tiles; the sprite shrinks into the middle one.
  const tiles = PARTS.map((part, i) => {
    const lit = h('span', 'lit');
    const el = h('div', `sys-tile${part ? ` part part--${part}` : ' sys-tile--home'}`, part ? [h('i'), h('i'), h('i'), lit] : []);
    return { el, lit, d: Math.abs((i % 3) - 1) + Math.abs(Math.floor(i / 3) - 1), home: !part };
  });
  const system = h('div', 'sys', tiles.map((t) => t.el));
  const art = h('div', 'craft-art', [system, sprite]);
  cam.append(top, art, bottom);

  const first = splitText(top, beat.segments[0] ?? '');
  const second = splitText(bottom, beat.segments.slice(1).join('\n'));

  const shrinkAt = snap(at(0.4));
  const lastAt = snap(at(0.52));

  m.reveal(first.words, tick(1));

  // One pixel.
  const centre = cells.find((c) => c.centre)!;
  m.pop(centre.el, tick(3), { from: 0, dur: 0.5, ease: 'back.out(3)' });

  // The grid fills outward from that pixel, one ring at a time.
  const fillAt = snap(at(0.18));
  for (const cell of cells) {
    if (cell.centre) continue;
    if (reduced) m.fade(cell.el, fillAt + cell.d * 0.06);
    else tl.fromTo(cell.el, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'expo.out' }, fillAt + cell.d * 0.07);
  }

  // The sprite shrinks into one tile; the system fills in around it.
  if (reduced) {
    tl.to(sprite, { opacity: 0, duration: 0.5 }, shrinkAt);
    m.fade(system, shrinkAt);
  } else {
    tl.to(sprite, { scale: 0.26, duration: 1.2, ease: 'expo.inOut' }, shrinkAt);
    tl.fromTo(system, { scale: 0.92 }, { scale: 1, duration: 1.4, ease: 'expo.out' }, shrinkAt);
    for (const tile of tiles) {
      tl.fromTo(
        tile.el,
        { opacity: 0, scale: tile.home ? 1 : 0.7 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' },
        shrinkAt + (tile.home ? 0.4 : 0.7 + tile.d * 0.12),
      );
    }
  }

  // "to a whole system."
  m.reveal(second.words, lastAt, { stagger: 0.06 });

  // A pass over the tiles, ring by ring, so the system feels wired.
  if (!reduced) {
    for (const tile of tiles) {
      if (tile.home) continue;
      const t = lastAt + 1.2 + tile.d * 0.14;
      tl.fromTo(tile.lit, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power2.out', immediateRender: false }, t);
      tl.to(tile.lit, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, t + 0.25);
    }
  }
}
