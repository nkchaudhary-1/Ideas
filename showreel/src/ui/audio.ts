import type { ReelConfig } from '../types';

/** How far audio may drift from the timeline before it is pulled back, in seconds. */
const DRIFT_LIMIT = 0.3;
/** Fewest milliseconds between corrections to one slot. A seek takes a moment to land, and seeking every frame stops playback altogether. */
const CORRECTION_GAP = 600;

const slotElement = (id: string): HTMLAudioElement | null => document.getElementById(id) as HTMLAudioElement | null;

/**
 * The optional audio layer: a voiceover and a music bed, each an `<audio>` slot in index.html.
 * It only does anything when the config names a file. It follows the timeline's clock, never the
 * other way round, so the reel looks identical with or without it.
 */
export class AudioLayer {
  private readonly slots: HTMLAudioElement[] = [];
  private readonly voice: HTMLAudioElement | null;
  private readonly lastCorrection = new WeakMap<HTMLAudioElement, number>();
  private analyser: AnalyserNode | null = null;
  private samples: Uint8Array<ArrayBuffer> | null = null;
  muted = false;

  constructor(config: ReelConfig['audio']) {
    this.voice = this.load('audio-vo', config.vo, 1);
    this.load('audio-music', config.music, config.musicGain);
  }

  /** True when at least one file is loaded, so the player knows whether to show a sound button. */
  get available(): boolean {
    return this.slots.length > 0;
  }

  private load(id: string, path: string, volume: number): HTMLAudioElement | null {
    const el = slotElement(id);
    if (!el || !path) return null;
    el.src = new URL(path, document.baseURI).href;
    el.preload = 'auto';
    el.volume = volume;
    // A missing file should leave the reel silent, not broken.
    el.addEventListener('error', () => {
      this.slots.splice(this.slots.indexOf(el), 1);
      console.info(`Audio file "${path}" could not be loaded; carrying on without it.`);
    });
    this.slots.push(el);
    return el;
  }

  /** Starts (or resumes) every slot from `time`. Call from a user gesture, since browsers block sound otherwise. */
  play(time: number): void {
    this.prepareAnalyser();
    for (const el of this.slots) {
      this.place(el, time);
      void el.play().catch(() => undefined);
    }
  }

  pause(): void {
    for (const el of this.slots) el.pause();
  }

  seek(time: number): void {
    for (const el of this.slots) this.place(el, time);
  }

  /**
   * Pulls any slot that has drifted back to the timeline's clock. It waits for a slot that is
   * still seeking or loading, and leaves a gap between corrections, so it can never fight the seek it just made.
   */
  follow(time: number): void {
    const now = performance.now();
    for (const el of this.slots) {
      if (el.paused || el.seeking || el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) continue;
      if (now - (this.lastCorrection.get(el) ?? 0) < CORRECTION_GAP) continue;
      if (Math.abs(this.position(el, time) - el.currentTime) > DRIFT_LIMIT) {
        this.lastCorrection.set(el, now);
        this.place(el, time);
      }
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    for (const el of this.slots) el.muted = muted;
  }

  private position(el: HTMLAudioElement, time: number): number {
    return el.loop && Number.isFinite(el.duration) && el.duration > 0 ? time % el.duration : time;
  }

  private place(el: HTMLAudioElement, time: number): void {
    const target = this.position(el, time);
    if (Number.isFinite(el.duration) && target > el.duration) return;
    el.currentTime = target;
  }

  /**
   * Routes the voiceover through an analyser so the captions can follow its loudness. Done on the
   * first play, which is inside a click or key press, because that is when browsers let audio start.
   */
  private prepareAnalyser(): void {
    const el = this.voice;
    if (!el || this.analyser || typeof AudioContext === 'undefined') return;
    try {
      const context = new AudioContext();
      const source = context.createMediaElementSource(el);
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);
      this.analyser.connect(context.destination);
      this.samples = new Uint8Array(this.analyser.fftSize);
      void context.resume();
    } catch {
      this.analyser = null;
    }
  }

  /** Loudness of the voiceover right now, 0 to 1. Zero until a voiceover is loaded and playing. */
  level(): number {
    const el = this.voice;
    if (!el || el.paused || !this.analyser || !this.samples) return 0;
    this.analyser.getByteTimeDomainData(this.samples);
    let sum = 0;
    for (const v of this.samples) sum += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(sum / this.samples.length) * 3);
  }
}
