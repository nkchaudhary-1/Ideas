import { gsap } from 'gsap';
import { Player } from './core/player';
import { plainCaption, resolveReel } from './core/resolve';
import { buildTimeline } from './core/timeline';
import { DEFAULT_OPTIONS, type ReelOptions } from './params';
import { reel as defaultConfig } from './reel.config';
import type { ReelConfig, ResolvedReel } from './types';
import { AudioLayer } from './ui/audio';
import { mountControls } from './ui/controls';
import { mountDebug } from './ui/debug';
import { createStage } from './ui/stage';
import { Subtitles } from './ui/subtitles';

export interface ReelHandle {
  player: Player;
  reel: ResolvedReel;
  options: ReelOptions;
  /** Removes the reel, its listeners and its timeline from the page. */
  destroy(): void;
}

/** How hard the voiceover pushes the captions when it is loud: a few percent, no more. */
const PULSE = 0.035;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One sentence for assistive tech: the stage is a picture, and this is its description. */
const describe = (reel: ResolvedReel) =>
  `Showreel, "${reel.title}". ${reel.beats.map((beat) => plainCaption(beat.caption)).join(' ')}`;

/**
 * Mounts the reel into `root`. This is the "props" entry point: pass any of `ReelOptions`
 * (`mode`, `aspect`, `debug`, ...), or let `main.ts` read them from the URL.
 */
export async function mountReel(
  root: HTMLElement,
  options: Partial<ReelOptions> = {},
  config: ReelConfig = defaultConfig,
): Promise<ReelHandle> {
  const opts: ReelOptions = { ...DEFAULT_OPTIONS, ...options };
  const reel = resolveReel(config);
  const reduced = opts.motion === 'reduced' || (opts.motion === 'auto' && prefersReducedMotion());
  const full = opts.mode === 'full';

  gsap.config({ force3D: true });
  const refs = createStage(root, opts, describe(reel));

  // Line breaks are measured, so the font has to be in before anything is split.
  await document.fonts.load('650 100px "Inter Variable"');
  await document.fonts.ready;

  const timeline = buildTimeline(refs, reel, opts, reduced);
  const audio = full ? new AudioLayer(reel.audio) : null;
  const player = new Player(timeline, reel, audio);

  const cleanups: (() => void)[] = [];
  if (full) {
    const subtitles = new Subtitles(refs.stage, reel, opts.subtitles);
    cleanups.push(mountControls(refs.app, player, subtitles, audio!));
    if (audio && !reduced) cleanups.push(pulseCaptions(refs.stage, audio));
  }
  if (opts.debug) cleanups.push(mountDebug(refs, player, opts.aspect));

  // Where to start: an explicit time, else the poster frame in full mode, else the top.
  const start = opts.start > 0 ? opts.start : full ? reel.poster : 0;
  timeline.time(start % reel.duration, true);
  refs.stage.dataset.ready = '';
  if (!full) timeline.play();

  // If the person changes their motion setting while the reel is up, rebuild it to match.
  let reload: (() => void) | null = null;
  if (opts.motion === 'auto') {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    reload = () => {
      const resumeAt = player.time;
      const wasPlaying = player.playing;
      handle.destroy();
      void mountReel(root, { ...opts, start: resumeAt }, config).then((next) => {
        if (!wasPlaying && full) next.player.pause();
      });
    };
    query.addEventListener('change', reload);
    cleanups.push(() => query.removeEventListener('change', reload!));
  }

  const handle: ReelHandle = {
    player,
    reel,
    options: opts,
    destroy: () => {
      for (const cleanup of cleanups) cleanup();
      player.destroy();
      timeline.kill();
      root.textContent = '';
    },
  };
  return handle;
}

/** Audio-reactive captions: the camera of every beat swells a touch with the voiceover's loudness. */
function pulseCaptions(stage: HTMLElement, audio: AudioLayer): () => void {
  const cams = Array.from(stage.querySelectorAll<HTMLElement>('.cam'));
  let last = 1;
  const tick = () => {
    const scale = 1 + audio.level() * PULSE;
    if (Math.abs(scale - last) < 0.0005) return;
    last = scale;
    for (const cam of cams) cam.style.scale = String(scale);
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}
