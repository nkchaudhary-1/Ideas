import { parseTimecode } from './core/timecode';

export type Mode = 'pip' | 'full';
export type Aspect = '16:9' | '9:16' | '1:1';
export type MotionPref = 'auto' | 'full' | 'reduced';

/** Everything the player can be told, whether by URL (`?mode=full`) or by passing props to `mountReel`. */
export interface ReelOptions {
  /** `pip`: muted autoplay loop, no controls. `full`: transport, scrubber and subtitles. */
  mode: Mode;
  aspect: Aspect;
  /** Show the beat, timecode, fps and safe-area guides. */
  debug: boolean;
  /** `full` mode: start with the voiceover subtitles on. */
  subtitles: boolean;
  /** `auto` follows `prefers-reduced-motion`; the other two force it. */
  motion: MotionPref;
  /** Second to start from. */
  start: number;
  /** Stage corner radius in px, 0 to 32. Use 0 when the page around the reel already rounds it. */
  radius: number;
}

export const DEFAULT_OPTIONS: ReelOptions = {
  mode: 'pip',
  aspect: '16:9',
  debug: false,
  subtitles: false,
  motion: 'auto',
  start: 0,
  radius: 32,
};

const ASPECTS: Record<string, Aspect> = {
  '16:9': '16:9', '16x9': '16:9', '16-9': '16:9',
  '9:16': '9:16', '9x16': '9:16', '9-16': '9:16',
  '1:1': '1:1', '1x1': '1:1', '1-1': '1:1',
};

/** A flag is on when present and not `0` or `false`, so `?debug` and `?debug=1` both work. */
function flag(value: string | null): boolean {
  return value !== null && value !== '0' && value !== 'false';
}

/** Reads `?mode=full&aspect=9:16&debug&subs=1&motion=reduced&t=22&radius=0`. Bad values fall back to the defaults. */
export function parseParams(search: string): ReelOptions {
  const q = new URLSearchParams(search);
  const options: ReelOptions = { ...DEFAULT_OPTIONS };

  if (q.get('mode') === 'full') options.mode = 'full';
  options.aspect = ASPECTS[(q.get('aspect') ?? '').toLowerCase()] ?? options.aspect;
  options.debug = flag(q.get('debug'));
  options.subtitles = flag(q.get('subs'));

  const motion = q.get('motion');
  if (motion === 'reduced' || motion === 'full') options.motion = motion;

  const t = q.get('t');
  if (t !== null) {
    try {
      options.start = parseTimecode(t);
    } catch {
      /* keep the default */
    }
  }

  const radius = Number(q.get('radius'));
  if (q.get('radius') !== null && Number.isFinite(radius)) options.radius = Math.min(32, Math.max(0, radius));

  return options;
}
