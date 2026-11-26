import { gsap } from 'gsap';
import type { FeelName } from '../types';

type Targets = gsap.TweenTarget;

interface FeelSpec {
  reveal: { ease: string; dur: number; y: number; rot: number; stagger: number };
  pop: { ease: string; dur: number; from: number };
  rise: { ease: string; dur: number; y: number };
}

/**
 * The two motion styles. Cool beats are locked: expo eases, no overshoot, tight staggers.
 * Warm beats are looser: overshoot, a little rotation, longer staggers. The change of style
 * at the cool-to-warm cut is half of what makes it felt.
 */
const FEELS: Record<FeelName, FeelSpec> = {
  precise: {
    reveal: { ease: 'expo.out', dur: 0.9, y: 118, rot: 0, stagger: 0.045 },
    pop: { ease: 'expo.out', dur: 0.7, from: 0.9 },
    rise: { ease: 'expo.out', dur: 0.8, y: 24 },
  },
  loose: {
    reveal: { ease: 'back.out(1.5)', dur: 1.1, y: 130, rot: 5, stagger: 0.085 },
    pop: { ease: 'back.out(2.2)', dur: 0.9, from: 0.55 },
    rise: { ease: 'back.out(1.4)', dur: 1.0, y: 40 },
  },
};

/** A cut is a very short tween rather than a zero-length one, which GSAP treats as a plain set. */
const CUT = 0.001;

/** Soft entrance used instead of any movement when reduced motion is on. */
const REDUCED = { dur: 0.6, ease: 'power1.out' };

export interface MotionOptions {
  stagger?: number;
  dur?: number;
  ease?: string;
  from?: number;
  /** `reveal` only: degrees of tilt on entry. Pass 0 for wide targets such as whole lines. */
  rotate?: number;
}

/**
 * Entrance and exit moves bound to one timeline and one feel. Every helper writes explicit
 * start values (`fromTo`), so scrubbing in any direction, or looping, always lands on the
 * same frame. With reduced motion on, every helper becomes an opacity fade.
 */
export class Motion {
  constructor(
    readonly tl: gsap.core.Timeline,
    readonly feel: FeelName,
    readonly reduced: boolean,
  ) {}

  private get spec(): FeelSpec {
    return FEELS[this.feel];
  }

  /** Words or lines rise through their mask. */
  reveal(targets: Targets, at: number, o: MotionOptions = {}): this {
    const s = this.spec.reveal;
    if (this.reduced) return this.fade(targets, at, { dur: o.dur });
    const tilt = o.rotate ?? s.rot;
    this.tl.fromTo(
      targets,
      { yPercent: s.y, rotation: (i: number) => (tilt ? (i % 2 ? 1 : -1) * tilt : 0), transformOrigin: '0% 100%' },
      { yPercent: 0, rotation: 0, duration: o.dur ?? s.dur, ease: o.ease ?? s.ease, stagger: o.stagger ?? s.stagger },
      at,
    );
    return this;
  }

  /** Words or lines leave upward through their mask. */
  conceal(targets: Targets, at: number, o: MotionOptions = {}): this {
    if (this.reduced) return this.fade(targets, at, { from: 1, to: 0, dur: o.dur ?? 0.4 });
    this.tl.to(targets, { yPercent: -this.spec.reveal.y, duration: o.dur ?? 0.5, ease: o.ease ?? 'expo.in', stagger: o.stagger ?? 0.03 }, at);
    return this;
  }

  /** Scale up from `from` with this feel's overshoot. */
  pop(targets: Targets, at: number, o: MotionOptions = {}): this {
    const s = this.spec.pop;
    if (this.reduced) return this.fade(targets, at, { dur: o.dur });
    this.tl.fromTo(
      targets,
      { scale: o.from ?? s.from, opacity: 0 },
      { scale: 1, opacity: 1, duration: o.dur ?? s.dur, ease: o.ease ?? s.ease, stagger: o.stagger ?? 0 },
      at,
    );
    return this;
  }

  /** Slide up a little and fade in. For rows, tiles and other solid blocks. */
  rise(targets: Targets, at: number, o: MotionOptions = {}): this {
    const s = this.spec.rise;
    if (this.reduced) return this.fade(targets, at, { dur: o.dur });
    this.tl.fromTo(
      targets,
      { yPercent: s.y, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: o.dur ?? s.dur, ease: o.ease ?? s.ease, stagger: o.stagger ?? 0 },
      at,
    );
    return this;
  }

  /** Grow a rule or bar along x from `origin`. */
  wipe(targets: Targets, at: number, o: MotionOptions & { origin?: string } = {}): this {
    if (this.reduced) return this.fade(targets, at, { dur: o.dur });
    this.tl.fromTo(
      targets,
      { scaleX: 0, transformOrigin: o.origin ?? '0% 50%' },
      { scaleX: 1, duration: o.dur ?? 0.8, ease: o.ease ?? 'expo.inOut', stagger: o.stagger ?? 0 },
      at,
    );
    return this;
  }

  /** Opacity only, `from` 0 `to` 1 unless told otherwise. */
  fade(targets: Targets, at: number, o: MotionOptions & { to?: number } = {}): this {
    this.tl.fromTo(
      targets,
      { opacity: o.from ?? 0 },
      { opacity: o.to ?? 1, duration: o.dur ?? REDUCED.dur, ease: o.ease ?? REDUCED.ease, stagger: o.stagger ?? 0 },
      at,
    );
    return this;
  }
}

/**
 * Shows `el` from `start` to `end`, hidden before and after. With `fade` above zero the edges are
 * short fades (reduced motion). At zero they are hard cuts, timed so the incoming window has
 * finished appearing at exactly the moment the outgoing one has finished disappearing: a frame
 * sampled on a boundary (a scripted capture at 30 fps lands on every half second) never sees a gap.
 *
 * The element is first set hidden, and that is not optional. GSAP rewinds a tween that starts
 * with `immediateRender: false` to whatever the element was when the tween first ran, not to the
 * `from` values. Without this line the element rewinds to its CSS default (shown), so a loop wrap
 * or a scrub backwards leaves every window open at once.
 */
export function presence(tl: gsap.core.Timeline, el: gsap.TweenTarget, start: number, end: number, fade = 0): void {
  gsap.set(el, { autoAlpha: 0 });
  if (fade > 0) {
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: fade, ease: 'power1.out', immediateRender: false }, start);
    tl.to(el, { autoAlpha: 0, duration: fade, ease: 'power1.in' }, end - fade);
    return;
  }
  tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: CUT, immediateRender: false }, Math.max(0, start - CUT));
  tl.to(el, { autoAlpha: 0, duration: CUT }, end - CUT);
}
