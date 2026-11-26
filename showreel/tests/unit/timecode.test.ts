import { describe, expect, it } from 'vitest';
import { formatTimecode, parseTimecode } from '../../src/core/timecode';

describe('parseTimecode', () => {
  it('passes seconds through', () => {
    expect(parseTimecode(75)).toBe(75);
    expect(parseTimecode('75')).toBe(75);
    expect(parseTimecode('22.5')).toBe(22.5);
  });

  it('reads m:ss clocks', () => {
    expect(parseTimecode('0:00')).toBe(0);
    expect(parseTimecode('0:22')).toBe(22);
    expect(parseTimecode('1:15')).toBe(75);
    expect(parseTimecode('1:08')).toBe(68);
  });

  it('reads fractions on a clock', () => {
    expect(parseTimecode('0:22.5')).toBe(22.5);
  });

  it('rejects anything else, with a hint', () => {
    expect(() => parseTimecode('1:75')).toThrow(/Invalid timecode/);
    expect(() => parseTimecode('soon')).toThrow(/m:ss/);
    expect(() => parseTimecode('')).toThrow();
    expect(() => parseTimecode(-1)).toThrow();
    expect(() => parseTimecode(Number.NaN)).toThrow();
  });
});

describe('formatTimecode', () => {
  it('formats m:ss', () => {
    expect(formatTimecode(0)).toBe('0:00');
    expect(formatTimecode(22.9)).toBe('0:22');
    expect(formatTimecode(75)).toBe('1:15');
  });

  it('formats one decimal when asked', () => {
    expect(formatTimecode(22.55, 1)).toBe('0:22.5');
  });

  it('never goes negative', () => {
    expect(formatTimecode(-3)).toBe('0:00');
  });
});
