import { describe, expect, it } from 'vitest';
import { resolveReel } from '../../src/core/resolve';
import { parseMarkup } from '../../src/core/split';
import { reel } from '../../src/reel.config';
import { buildCues } from '../../src/ui/subtitles';

describe('parseMarkup', () => {
  it('splits words and keeps their order', () => {
    expect(parseMarkup('I build products').map((l) => l.map((w) => w.text))).toEqual([['I', 'build', 'products']]);
  });

  it('forces a new line on a newline', () => {
    expect(parseMarkup('Moved real\nnumbers.')).toHaveLength(2);
  });

  it('marks words between underscores as dim, and only those', () => {
    const [line] = parseMarkup("_You're a designer?_ So what");
    expect(line!.map((w) => [w.text, w.dim])).toEqual([
      ["You're", true],
      ['a', true],
      ['designer?', true],
      ['So', false],
      ['what', false],
    ]);
  });

  it('keeps dim across a line break only if it is closed on the same line', () => {
    const lines = parseMarkup('_Honestly?_\nI am curious');
    expect(lines[0]![0]!.dim).toBe(true);
    expect(lines[1]!.every((w) => !w.dim)).toBe(true);
  });

  it('ignores empty lines and extra spaces', () => {
    expect(parseMarkup('a   b\n\n c')).toHaveLength(2);
  });
});

describe('buildCues', () => {
  const resolved = resolveReel(reel);
  const cues = buildCues(resolved);

  it('covers every beat with at least one cue inside its window', () => {
    for (const beat of resolved.beats) {
      const inside = cues.filter((c) => c.start >= beat.start && c.end <= beat.end + 1e-9);
      expect(inside.length).toBeGreaterThan(0);
    }
  });

  it('is in order, never overlaps, and ends each beat on its boundary', () => {
    cues.forEach((cue, i) => {
      expect(cue.end).toBeGreaterThan(cue.start);
      if (i > 0) expect(cue.start).toBeGreaterThanOrEqual(cues[i - 1]!.end - 1e-9);
    });
    for (const beat of resolved.beats) {
      const last = cues.filter((c) => c.start >= beat.start && c.start < beat.end).pop()!;
      expect(last.end).toBeCloseTo(beat.end, 6);
    }
  });

  it('splits the hook voiceover into its two sentences, with typographic apostrophes', () => {
    const hook = cues.filter((c) => c.start < resolved.beats[1]!.start);
    expect(hook.map((c) => c.text)).toEqual(['People always ask — you’re a designer?', 'So what do you actually do?']);
  });
});
