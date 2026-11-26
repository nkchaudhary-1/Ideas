import { gsap } from 'gsap';
import type { ResolvedReel, WorldName } from '../types';
import type { StageRefs } from '../ui/stage';

/** How long a world change takes under reduced motion: a crossfade instead of a cut. */
const REDUCED_FADE = 0.9;
/** A cut is a very short tween rather than a zero-length one, which GSAP treats as a plain set. */
const CUT = 0.001;

type Layer = 'cool' | 'warm' | 'neutral' | 'dim';
type Grade = Record<Layer, number>;
const LAYERS: Layer[] = ['cool', 'warm', 'neutral', 'dim'];

const gradeOf = (world: WorldName, dim: number): Grade => ({
  cool: world === 'cool' ? 1 : 0,
  warm: world === 'warm' ? 1 : 0,
  neutral: world === 'neutral' ? 1 : 0,
  dim,
});

/**
 * Lays the colour grade onto the master timeline. Each beat cuts to its world (a hard cut, or a
 * short crossfade under reduced motion), then optionally blends to a second world across the
 * beat. The last beat grades back into the first beat's world, so the loop point has no seam.
 * A cool/warm change also fires a heat bloom over the cut.
 */
export function buildWorldTrack(master: gsap.core.Timeline, refs: StageRefs, reel: ResolvedReel, reduced: boolean): void {
  const el = (layer: Layer): HTMLElement => (layer === 'dim' ? refs.shade : refs.worlds[layer]);
  const cut = reduced ? REDUCED_FADE : CUT;
  const first = reel.beats[0]!;
  const firstStart = gradeOf(first.world.from, first.dim);

  // The page loads on the first beat's grade.
  for (const layer of LAYERS) gsap.set(el(layer), { opacity: firstStart[layer] });

  let previousEnd: Grade | null = null;
  for (const beat of reel.beats) {
    const start = gradeOf(beat.world.from, beat.dim);
    const end = gradeOf(beat.world.to, beat.dim);

    for (const layer of LAYERS) {
      const from = previousEnd?.[layer] ?? start[layer];
      if (from !== start[layer]) {
        master.fromTo(el(layer), { opacity: from }, { opacity: start[layer], duration: cut, ease: 'none', immediateRender: false }, beat.start);
      }
      if (start[layer] !== end[layer]) {
        master.fromTo(el(layer), { opacity: start[layer] }, { opacity: end[layer], duration: beat.dur, ease: 'sine.inOut', immediateRender: false }, beat.start + cut);
      }
    }

    // Temperature flip: a bloom of the new world's colour that settles after the cut.
    if (previousEnd && !reduced && Math.abs(start.warm - previousEnd.warm) >= 0.5) {
      const target = start.warm > previousEnd.warm ? refs.bloom.warm : refs.bloom.cool;
      master.fromTo(target, { opacity: 0.9, scale: 1.4 }, { opacity: 0, scale: 1, duration: 0.9, ease: 'expo.out', immediateRender: false }, beat.start);
    }
    previousEnd = end;
  }

  // Close the loop: grade the last beat back into the first.
  const last = reel.beats[reel.beats.length - 1]!;
  const lastEnd = gradeOf(last.world.to, last.dim);
  const blend = Math.min(reel.loopBlend, last.dur);
  for (const layer of LAYERS) {
    if (lastEnd[layer] === firstStart[layer]) continue;
    master.fromTo(el(layer), { opacity: lastEnd[layer] }, { opacity: firstStart[layer], duration: blend, ease: 'sine.inOut', immediateRender: false }, reel.duration - blend);
  }
}

/** A short white flash on every cut, the first one included, so the loop point reads as an edit. */
export function buildCuts(master: gsap.core.Timeline, refs: StageRefs, reel: ResolvedReel, reduced: boolean): void {
  if (reduced) return;
  for (const beat of reel.beats) {
    master.fromTo(
      refs.flash,
      { opacity: reel.flash.opacity },
      { opacity: 0, duration: reel.flash.duration, ease: 'none', immediateRender: false },
      beat.start,
    );
  }
}
