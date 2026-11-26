import { describe, expect, it } from 'vitest';
import { MIN_BEAT_SECONDS, plainCaption, resolveReel, segmentsOf } from '../../src/core/resolve';
import { reel as shipped } from '../../src/reel.config';
import type { Beat, ReelConfig } from '../../src/types';

const beat = (id: string, at: string | number, extra: Partial<Beat> = {}): Beat =>
  ({ id, kind: 'builder', label: id, in: at, world: 'cool', caption: id, vo: id, ...extra }) as Beat;

const config = (beats: Beat[], duration: string | number = '0:30'): ReelConfig => ({
  ...shipped,
  duration,
  beats,
});

describe('resolveReel', () => {
  it('takes each beat end from the next beat start, and the last from duration', () => {
    const r = resolveReel(config([beat('a', 0), beat('b', 10), beat('c', '0:20')]));
    expect(r.beats.map((b) => [b.start, b.end, b.dur])).toEqual([
      [0, 10, 10],
      [10, 20, 10],
      [20, 30, 10],
    ]);
    expect(r.duration).toBe(30);
  });

  it('retimes with a single edit: moving one boundary moves both neighbours', () => {
    const r = resolveReel(config([beat('a', 0), beat('b', 12), beat('c', 20)]));
    expect(r.beats[0]!.dur).toBe(12);
    expect(r.beats[1]!.dur).toBe(8);
  });

  it('defaults feel from the world: warm is loose, everything else precise', () => {
    const r = resolveReel(config([beat('a', 0, { world: 'cool' }), beat('b', 10, { world: 'warm' }), beat('c', 20, { world: { from: 'cool', to: 'warm' } })]));
    expect(r.beats.map((b) => b.feel)).toEqual(['precise', 'loose', 'precise']);
  });

  it('lets a beat override its feel', () => {
    const r = resolveReel(config([beat('a', 0, { world: 'warm', feel: 'precise' }), beat('b', 10)]));
    expect(r.beats[0]!.feel).toBe('precise');
  });

  it('normalises a single world to a from/to pair', () => {
    const r = resolveReel(config([beat('a', 0, { world: 'neutral' }), beat('b', 10)]));
    expect(r.beats[0]!.world).toEqual({ from: 'neutral', to: 'neutral' });
  });

  it('fails loudly when a beat is out of order', () => {
    expect(() => resolveReel(config([beat('a', 0), beat('b', 15), beat('c', 10)]))).toThrow(/beat "b"/);
  });

  it('fails when the first beat does not start at zero', () => {
    expect(() => resolveReel(config([beat('a', 2), beat('b', 10)]))).toThrow(/first beat must start at 0:00/);
  });

  it('fails when a beat is too short for its choreography', () => {
    expect(() => resolveReel(config([beat('a', 0), beat('b', MIN_BEAT_SECONDS - 1)]))).toThrow(/at least 3s/);
  });

  it('fails when the last beat runs past duration', () => {
    expect(() => resolveReel(config([beat('a', 0), beat('b', 40)], '0:30'))).toThrow(/beat "b"/);
  });

  it('fails on duplicate ids and empty reels', () => {
    expect(() => resolveReel(config([beat('a', 0), beat('a', 10)]))).toThrow(/share the id "a"/);
    expect(() => resolveReel(config([]))).toThrow(/at least one beat/);
  });
});

describe('the shipped reel.config', () => {
  const r = resolveReel(shipped);

  it('resolves, with beats that tile the whole duration', () => {
    expect(r.beats[0]!.start).toBe(0);
    expect(r.beats[r.beats.length - 1]!.end).toBe(r.duration);
    r.beats.forEach((b, i) => {
      if (i > 0) expect(b.start).toBe(r.beats[i - 1]!.end);
    });
  });

  it('opens on the hook and closes on the end card', () => {
    expect(r.beats[0]!.kind).toBe('hook');
    expect(r.beats[r.beats.length - 1]!.kind).toBe('endcard');
  });

  it('loops back into the grade it opened with, or has a blend long enough to get there', () => {
    expect(r.loopBlend).toBeGreaterThan(0);
    expect(r.loopBlend).toBeLessThanOrEqual(r.beats[r.beats.length - 1]!.dur);
  });

  it('keeps the hook flashes under three a second', () => {
    const hook = r.beats[0]!;
    if (hook.kind === 'hook') expect(hook.flashEvery).toBeGreaterThanOrEqual(1 / 3);
  });
});

describe('captions', () => {
  it('treats a string as one segment and an array as several', () => {
    expect(segmentsOf('a')).toEqual(['a']);
    expect(segmentsOf(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('flattens markup for assistive text', () => {
    expect(plainCaption(["_You're a designer?_\nSo what?", 'Next.'])).toBe("You're a designer? So what? Next.");
  });
});
