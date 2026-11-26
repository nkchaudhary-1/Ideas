import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, parseParams } from '../../src/params';

describe('parseParams', () => {
  it('defaults to a pip loop at 16:9', () => {
    expect(parseParams('')).toEqual(DEFAULT_OPTIONS);
    expect(DEFAULT_OPTIONS.mode).toBe('pip');
    expect(DEFAULT_OPTIONS.aspect).toBe('16:9');
  });

  it('switches mode', () => {
    expect(parseParams('?mode=full').mode).toBe('full');
    expect(parseParams('?mode=nonsense').mode).toBe('pip');
  });

  it('accepts aspect written as 9:16, 9x16 or 9-16, in any case', () => {
    expect(parseParams('?aspect=9:16').aspect).toBe('9:16');
    expect(parseParams('?aspect=9%3A16').aspect).toBe('9:16');
    expect(parseParams('?aspect=1x1').aspect).toBe('1:1');
    expect(parseParams('?aspect=16-9').aspect).toBe('16:9');
    expect(parseParams('?aspect=4:3').aspect).toBe('16:9');
  });

  it('reads flags, so ?debug and ?debug=1 are on and ?debug=0 is off', () => {
    expect(parseParams('?debug').debug).toBe(true);
    expect(parseParams('?debug=1').debug).toBe(true);
    expect(parseParams('?debug=0').debug).toBe(false);
    expect(parseParams('?debug=false').debug).toBe(false);
    expect(parseParams('?subs=1').subtitles).toBe(true);
    expect(parseParams('').subtitles).toBe(false);
  });

  it('forces motion only for known values', () => {
    expect(parseParams('?motion=reduced').motion).toBe('reduced');
    expect(parseParams('?motion=full').motion).toBe('full');
    expect(parseParams('?motion=wild').motion).toBe('auto');
  });

  it('starts from a timecode', () => {
    expect(parseParams('?t=22').start).toBe(22);
    expect(parseParams('?t=0:22.5').start).toBe(22.5);
    expect(parseParams('?t=banana').start).toBe(0);
  });

  it('keeps the stage radius between 0 and 32', () => {
    expect(parseParams('?radius=0').radius).toBe(0);
    expect(parseParams('?radius=12').radius).toBe(12);
    expect(parseParams('?radius=99').radius).toBe(32);
    expect(parseParams('?radius=-4').radius).toBe(0);
    expect(parseParams('?radius=x').radius).toBe(32);
  });
});
