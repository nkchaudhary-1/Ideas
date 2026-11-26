import type { ResolvedBeat, ResolvedReel } from '../types';
import type { AudioLayer } from '../ui/audio';

type Listener = () => void;

/**
 * The one place that starts, stops and seeks the reel, so the timeline, the audio and the
 * controls cannot disagree about what is playing.
 */
export class Player {
  private readonly listeners = new Set<Listener>();

  constructor(
    readonly timeline: gsap.core.Timeline,
    readonly reel: ResolvedReel,
    private readonly audio: AudioLayer | null,
  ) {
    timeline.eventCallback('onUpdate', () => {
      this.audio?.follow(this.time);
      this.emit();
    });
    timeline.eventCallback('onComplete', () => {
      this.audio?.pause();
      this.emit();
    });
  }

  get time(): number {
    return this.timeline.time();
  }

  get playing(): boolean {
    return !this.timeline.paused();
  }

  /** The beat on screen at `time` (the current time by default). */
  beatAt(time = this.time): ResolvedBeat {
    const beats = this.reel.beats;
    for (let i = beats.length - 1; i >= 0; i--) if (time >= beats[i]!.start) return beats[i]!;
    return beats[0]!;
  }

  play(): void {
    if (this.timeline.progress() >= 1) this.timeline.restart();
    else this.timeline.play();
    this.audio?.play(this.time);
    this.emit();
  }

  pause(): void {
    this.timeline.pause();
    this.audio?.pause();
    this.emit();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(seconds: number): void {
    const t = Math.min(Math.max(seconds, 0), this.reel.duration - 0.001);
    this.timeline.time(t);
    this.audio?.seek(t);
    this.emit();
  }

  restart(): void {
    this.seek(0);
    this.play();
  }

  /** Jumps by whole beats: -1 for the start of this beat (or the previous one if near its start), +1 for the next. */
  stepBeat(direction: 1 | -1): void {
    const current = this.beatAt();
    if (direction === 1) this.seek((this.reel.beats[current.index + 1] ?? current).start);
    else this.seek(this.time - current.start > 1 ? current.start : (this.reel.beats[current.index - 1] ?? current).start);
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  destroy(): void {
    this.timeline.eventCallback('onUpdate', null);
    this.timeline.eventCallback('onComplete', null);
    this.listeners.clear();
  }
}
