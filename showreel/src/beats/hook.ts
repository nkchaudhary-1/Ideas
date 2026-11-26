import { HOOK_ART } from '../art/hook';
import { h, svgFrom } from '../core/dom';
import { presence } from '../core/motion';
import { splitText } from '../core/split';
import type { HookBeat, Resolved } from '../types';
import type { BeatContext } from './context';
import { createMarks } from './marks';

/** The artwork sits behind its word, so it settles well short of full strength. */
const ART_OPACITY = 0.6;

/**
 * Beat 1. Four concept flashes, one word each, cut hard on the beat. Then the question the
 * rest of the reel answers. The marks and the huge centred word are what the end card echoes.
 */
export function buildHook({ beat, root, cam, tl, m, reduced }: BeatContext<Resolved<HookBeat>>): void {
  const marks = createMarks();
  root.append(marks);

  const total = beat.flashes.length;
  const stack = h('div', 'hook-stack');
  const frames = beat.flashes.map((word, i) => {
    const art = svgFrom(HOOK_ART[i % HOOK_ART.length]!);
    const label = h('div', 'word-hero', [], { 'data-word': word });
    const index = h('div', 'hook-index num', [`${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`]);
    const el = h('div', 'hf', [art, label, index]);
    stack.append(el);
    return { el, art, label, word };
  });

  const question = h('h2', 'caption hook-question');
  cam.append(stack, question);

  // Measure after everything is in the document.
  const chars = frames.map((f) => splitText(f.label, f.word, { chars: true, mask: false }).chars);
  const q = splitText(question, beat.segments.join('\n'));

  // Registration marks snap in like a viewfinder finding focus.
  if (reduced) m.fade(marks, 0);
  else tl.fromTo(marks, { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' }, 0);

  // The flashes. Each is shown for `flashEvery`, then cut.
  frames.forEach((f, i) => {
    const s = i * beat.flashEvery;
    const e = s + beat.flashEvery;
    presence(tl, f.el, s, e, reduced ? 0.2 : 0);
    if (reduced) return;
    // The word slams in, big and fast, stretching as it lands.
    tl.fromTo(
      chars[i]!,
      { scale: 1.5, scaleY: 1.9, opacity: 0, transformOrigin: '50% 60%' },
      { scale: 1, scaleY: 1, opacity: 1, duration: 0.24, ease: 'expo.out', stagger: 0.018 },
      s,
    );
    tl.fromTo(f.art, { scale: 0.82, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: ART_OPACITY, duration: 0.4, ease: 'expo.out' }, s);
    tl.fromTo(f.el.querySelector('.hook-index'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, s + 0.1);
  });

  if (!reduced) buildFrameBusiness(frames.map((f) => f.art), beat.flashEvery, tl, root);

  // The question. This is what carries the hook with the sound off.
  const qAt = total * beat.flashEvery;
  m.reveal(q.words, qAt, { stagger: 0.07, dur: 0.8 });
}

/** The little extras that make each flash its own idea: spinning blades, a lifting shackle, a camera pop. */
function buildFrameBusiness(arts: SVGSVGElement[], every: number, tl: gsap.core.Timeline, root: HTMLElement): void {
  const part = (i: number, selector: string) => arts[i]?.querySelector(selector) ?? null;

  const blades = part(1, '.art-main');
  if (blades) tl.fromTo(blades, { rotation: -60, svgOrigin: '540 540' }, { rotation: 0, svgOrigin: '540 540', duration: every * 0.9, ease: 'expo.out' }, every);

  const pop = h('div', 'hook-pop');
  root.append(pop);
  tl.fromTo(pop, { opacity: 0.5 }, { opacity: 0, duration: 0.32, ease: 'power2.out', immediateRender: false }, every);

  const cursor = part(2, '.art-cursor');
  if (cursor) tl.fromTo(cursor, { x: 200, y: 160, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: every * 0.8, ease: 'expo.out' }, every * 2);

  const shackle = part(3, '.art-shackle');
  if (shackle) {
    tl.fromTo(shackle, { y: 0, rotation: 0, svgOrigin: '440 500' }, { y: -72, rotation: -24, svgOrigin: '440 500', duration: every * 0.7, ease: 'back.out(2)' }, every * 3 + 0.08);
  }
  const sparks = part(3, '.art-sparks');
  if (sparks) tl.fromTo(sparks, { opacity: 0, scale: 0.7, svgOrigin: '540 400' }, { opacity: 0.8, scale: 1, svgOrigin: '540 400', duration: every * 0.8, ease: 'expo.out' }, every * 3 + 0.1);
}
