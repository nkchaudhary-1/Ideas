import { gsap } from 'gsap';
import type { ReelOptions } from '../params';
import type { BeatKind, ResolvedBeat, ResolvedReel } from '../types';
import type { BeatContext } from '../beats/context';
import { buildBeats } from '../beats';
import type { StageRefs } from '../ui/stage';
import { h } from './dom';
import { Motion, presence } from './motion';
import { buildCuts, buildWorldTrack } from './world';

/** Slow push-in on every beat's camera. Warm beats also drift a little off axis. */
const PUSH = { precise: 1.03, loose: 1.04 };
const DRIFT_DEGREES = 0.6;
/** Reduced motion: how long a beat takes to fade in and out. */
const REDUCED_FADE = 0.5;

const worldAttribute = (beat: ResolvedBeat) => (beat.world.from === beat.world.to ? beat.world.from : 'blend');

function buildBeat(refs: StageRefs, reel: ResolvedReel, beat: ResolvedBeat, reduced: boolean): { tl: gsap.core.Timeline; root: HTMLElement } {
  const tl = gsap.timeline();
  const cam = h('div', 'cam');
  const root = h('section', `beat beat--${beat.kind}`, [cam], { 'data-beat': beat.id, 'data-world': worldAttribute(beat) });
  refs.frame.append(root);

  const quarter = 60 / reel.bpm / 4;
  const context: BeatContext = {
    beat,
    reel,
    root,
    cam,
    tl,
    m: new Motion(tl, beat.feel, reduced),
    motion: (feel) => new Motion(tl, feel, reduced),
    reduced,
    tick: (n) => n * quarter,
    at: (fraction) => fraction * beat.dur,
    snap: (seconds) => Math.round(seconds / quarter) * quarter,
  };
  (buildBeats[beat.kind as BeatKind] as (ctx: BeatContext) => void)(context);

  // The camera pushes in slowly; under reduced motion it stays still.
  if (!reduced) {
    const drift = beat.feel === 'loose' ? DRIFT_DEGREES : 0;
    tl.fromTo(cam, { scale: 1, rotation: -drift }, { scale: PUSH[beat.feel], rotation: drift, duration: beat.dur, ease: 'none' }, 0);
  }

  tl.set({}, {}, beat.dur); // pin the beat's length so the master places it exactly
  return { tl, root };
}

/**
 * The master timeline: one tween track per concern, all positioned from the config.
 *
 *   master
 *   ├─ world track     grade cuts and blends (cool / warm / neutral, plus dim), loop blend at the tail
 *   ├─ cut flashes     60 ms white flash at every beat start, including the loop point
 *   ├─ presence        each beat's section shown from its start to its end
 *   └─ beats           one sub-timeline per beat, added at beat.start; each builds its own DOM
 *
 * In pip mode it repeats forever. Its length is pinned to `reel.duration`.
 */
export function buildTimeline(refs: StageRefs, reel: ResolvedReel, options: ReelOptions, reduced: boolean): gsap.core.Timeline {
  const master = gsap.timeline({ paused: true, repeat: options.mode === 'pip' ? -1 : 0 });
  for (const beat of reel.beats) {
    const { tl, root } = buildBeat(refs, reel, beat, reduced);
    master.add(tl, beat.start);
    // Cut in and out, in the master's own time so the incoming beat is up on the very frame the outgoing one goes.
    // Under reduced motion the cut becomes a short fade.
    presence(master, root, beat.start, beat.end, reduced ? REDUCED_FADE : 0);
  }
  buildWorldTrack(master, refs, reel, reduced);
  buildCuts(master, refs, reel, reduced);
  master.set({}, {}, reel.duration);
  return master;
}
