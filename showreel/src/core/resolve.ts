import type { Beat, FeelName, ReelConfig, ResolvedBeat, ResolvedReel, Timing, WorldName } from '../types';
import { formatTimecode, parseTimecode } from './timecode';

/** The shortest a beat can be before its choreography no longer fits. */
export const MIN_BEAT_SECONDS = 3;

export function segmentsOf(caption: string | string[]): string[] {
  return Array.isArray(caption) ? caption : [caption];
}

/** Plain-text version of a caption: markup stripped, line breaks as spaces. */
export function plainCaption(caption: string | string[]): string {
  return segmentsOf(caption).join(' ').replace(/_/g, '').replace(/\s*\n\s*/g, ' ').trim();
}

function worldRange(world: Beat['world']): { from: WorldName; to: WorldName } {
  return typeof world === 'string' ? { from: world, to: world } : world;
}

function defaultFeel(world: { from: WorldName; to: WorldName }): FeelName {
  return world.from === 'warm' && world.to === 'warm' ? 'loose' : 'precise';
}

/**
 * Turns the editable config into what the timeline builder uses: seconds instead of timecodes,
 * each beat's end taken from the next beat's start, and defaults filled in. Throws a readable
 * error when the beats don't line up, so a bad retime fails loudly instead of playing wrong.
 */
export function resolveReel(config: ReelConfig): ResolvedReel {
  if (config.beats.length === 0) throw new Error('reel.config: add at least one beat.');
  if (!(config.bpm > 0)) throw new Error('reel.config: bpm must be above 0.');

  const duration = parseTimecode(config.duration);
  const starts = config.beats.map((beat) => parseTimecode(beat.in));

  const beats = config.beats.map((beat, index): ResolvedBeat => {
    const start = starts[index]!;
    const end = index + 1 < starts.length ? starts[index + 1]! : duration;
    const label = `beat "${beat.id}"`;
    if (index === 0 && start !== 0) throw new Error(`reel.config: the first beat must start at 0:00, not ${formatTimecode(start)}.`);
    if (end <= start) throw new Error(`reel.config: ${label} runs ${formatTimecode(start)} to ${formatTimecode(end)}. Each beat must start after the one before it, and before \`duration\`.`);
    if (end - start < MIN_BEAT_SECONDS) throw new Error(`reel.config: ${label} is ${(end - start).toFixed(1)}s long. Beats need at least ${MIN_BEAT_SECONDS}s for their choreography.`);

    const world = worldRange(beat.world);
    const timing: Timing = {
      index,
      start,
      end,
      dur: end - start,
      world,
      dim: beat.dim ?? 0,
      feel: beat.feel ?? defaultFeel(world),
      segments: segmentsOf(beat.caption),
    };
    return { ...beat, ...timing } as ResolvedBeat;
  });

  const ids = new Set<string>();
  for (const beat of beats) {
    if (ids.has(beat.id)) throw new Error(`reel.config: two beats share the id "${beat.id}".`);
    ids.add(beat.id);
  }

  const { beats: _beats, ...rest } = config;
  return { ...rest, duration, beats };
}
