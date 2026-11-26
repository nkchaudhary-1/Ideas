import { check, play, sparkle } from '../art/icons';
import { h, svgFrom } from '../core/dom';
import { presence } from '../core/motion';
import { splitText } from '../core/split';
import type { BuilderBeat, Resolved } from '../types';
import type { BeatContext } from './context';

/** Where each phase starts and ends, as fractions of the beat. Uneven on purpose: the middle one carries the demo. */
const PHASES = [0, 0.32, 0.68, 1];

/**
 * Beat 5. Energetic. Three phases, each with its own caption and a small picture of the idea:
 * a deck of new things being dealt, a task list ticking itself off, two circles becoming friends.
 * Capsules stream behind all of it for the whole beat.
 */
export function buildBuilder({ beat, root, cam, tl, m, tick, snap, at, reduced }: BeatContext<Resolved<BuilderBeat>>): void {
  // Background stream: three rows of outline capsules sliding in alternate directions.
  const widths = [160, 240, 120, 200, 280, 140, 220, 180, 260, 120, 200, 240, 160, 300, 140, 220];
  const rows = [0, 1, 2].map((r) => {
    const set = widths.slice(r * 3).concat(widths.slice(0, r * 3));
    return h('div', `stream-row stream-row--${r}`, set.map((w) => h('i', 'stream-cap', [], { style: `width:calc(var(--u)*${w})` })));
  });
  const stream = h('div', 'stream', rows, { 'aria-hidden': 'true' });
  root.prepend(stream);
  if (reduced) m.fade(stream, 0);
  else {
    tl.fromTo(stream, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);
    rows.forEach((row, r) => {
      tl.fromTo(row, { xPercent: r % 2 ? -34 : 0 }, { xPercent: r % 2 ? 0 : -34, duration: beat.dur, ease: 'none' }, 0);
    });
  }

  // The three phases share one cell so the beat keeps a steady height.
  const phases = beat.segments.map((text) => {
    const caption = h('h2', 'caption');
    const art = h('div', 'phase-art');
    const el = h('div', 'phase', [caption, art]);
    return { el, caption, art, text };
  });
  cam.append(h('div', 'phases', phases.map((p) => p.el)));
  const splits = phases.map((p) => splitText(p.caption, p.text));

  const art = [dealDeck(phases[0]!.art), tickList(phases[1]!.art), friends(phases[2]!.art)];

  phases.forEach((phase, i) => {
    const start = i === 0 ? 0 : snap(at(PHASES[i]!));
    const end = i === phases.length - 1 ? beat.dur : snap(at(PHASES[i + 1]!));
    const last = i === phases.length - 1;

    // Each phase is on screen for its own window; the previous one has lifted out by the time it arrives.
    presence(tl, phase.el, start, end, reduced ? 0.3 : 0);

    m.reveal(splits[i]!.words, start + tick(1), { stagger: 0.075 });
    if (!last) m.conceal(splits[i]!.words, end - 0.42, { dur: 0.4, stagger: 0.025 });
    if (!last) tl.to(phase.art, { opacity: 0, duration: reduced ? 0.4 : 0.25 }, end - 0.3);

    art[i]!(start + tick(3));
  });

  /* The pictures. Each is a function of its start time so the phase stays retimeable. */
  function dealDeck(host: HTMLElement): (t: number) => void {
    const cards = [-14, -5, 5, 14].map((deg, i) => {
      const lines = h('span', 'card-lines', [h('i'), h('i'), h('i')]);
      const el = h('div', 'deal-card', [h('span', 'card-swatch'), lines]);
      el.dataset.deg = String(deg);
      el.dataset.x = String(-96 + i * 64);
      host.append(el);
      return el;
    });
    host.classList.add('phase-art--deck');
    return (t) => {
      cards.forEach((card, i) => {
        const deg = Number(card.dataset.deg);
        const x = Number(card.dataset.x);
        if (reduced) {
          tl.fromTo(card, { opacity: 0, rotation: deg, xPercent: x }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, t + tick(2) * i);
          return;
        }
        tl.fromTo(card, { xPercent: 330, rotation: 40, opacity: 0 }, { xPercent: x, rotation: deg, opacity: 1, duration: 0.9, ease: 'back.out(1.5)' }, t + tick(2) * i);
      });
    };
  }

  function tickList(host: HTMLElement): (t: number) => void {
    const button = h('span', 'run', [svgFrom(play)]);
    const progressFill = h('span', 'run-fill');
    const header = h('div', 'task-head', [button, h('span', 'run-bar', [progressFill])]);
    const items = [78, 62, 90, 54].map((w) => {
      const fill = h('i', 'task-fill');
      const mark = h('span', 'task-check', [svgFrom(check)]);
      const box = h('span', 'task-box', [fill, mark]);
      const line = h('span', 'task-line', [], { style: `width:${w}%` });
      return { el: h('div', 'task', [box, line]), fill, mark, line };
    });
    host.classList.add('phase-art--tasks');
    host.append(h('div', 'task-card', [header, ...items.map((it) => it.el)]));
    return (t) => {
      m.pop(button, t, { from: 0.6, dur: 0.5 });
      items.forEach((it, i) => {
        const at = t + tick(4) + tick(3) * i;
        m.rise(it.el, t + tick(2) * i, { dur: 0.5 });
        if (reduced) {
          m.fade([it.fill, it.mark], at);
          return;
        }
        tl.fromTo([it.fill, it.mark], { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(3)' }, at);
        tl.fromTo(it.line, { opacity: 1 }, { opacity: 0.35, duration: 0.3 }, at);
      });
      if (!reduced) tl.fromTo(progressFill, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: tick(4) + tick(3) * items.length, ease: 'none' }, t + tick(2));
      else m.fade(progressFill, t);
    };
  }

  function friends(host: HTMLElement): (t: number) => void {
    const a = h('i', 'friend friend--a');
    const b = h('i', 'friend friend--b');
    const spark = h('span', 'friend-spark', [svgFrom(sparkle)]);
    host.classList.add('phase-art--friends');
    host.append(a, b, spark);
    return (t) => {
      if (reduced) {
        m.fade([a, b, spark], t);
        return;
      }
      tl.fromTo(a, { xPercent: -260, opacity: 0 }, { xPercent: -28, opacity: 1, duration: 1, ease: 'back.out(1.4)' }, t);
      tl.fromTo(b, { xPercent: 260, opacity: 0 }, { xPercent: 28, opacity: 1, duration: 1, ease: 'back.out(1.4)' }, t);
      tl.fromTo(spark, { scale: 0, rotation: -90, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: 'back.out(3)' }, t + 0.8);
      tl.to(spark, { rotation: 90, duration: Math.max(0.5, beat.dur - t - 1.5), ease: 'none' }, t + 1.5);
    };
  }
}
