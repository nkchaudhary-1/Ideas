import type { Motion } from '../core/motion';
import type { FeelName, ResolvedBeat, ResolvedReel } from '../types';

/** What a beat builder is given. The builder fills `cam` with DOM and `tl` with tweens, in beat-local time. */
export interface BeatContext<B extends ResolvedBeat = ResolvedBeat> {
  beat: B;
  reel: ResolvedReel;
  /** The beat's section. The timeline shows and hides it. */
  root: HTMLElement;
  /** The camera: the centred column everything sits in. */
  cam: HTMLElement;
  /** The beat's own timeline. Time 0 is the start of the beat, `beat.dur` its end. */
  tl: gsap.core.Timeline;
  /** Motion helpers in the beat's feel. */
  m: Motion;
  /** Motion helpers in another feel, for a beat that changes character part-way. */
  motion(feel: FeelName): Motion;
  reduced: boolean;
  /** `n` sixteenth notes at the reel's tempo, in seconds. Choreography snaps to this grid. */
  tick(n: number): number;
  /** A fraction of the beat's length, in seconds. */
  at(fraction: number): number;
  /** Rounds a time to the nearest tick, so it lands on the grid. */
  snap(seconds: number): number;
}
