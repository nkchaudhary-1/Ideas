import { h } from '../core/dom';
import type { ResolvedReel } from '../types';

export interface Cue {
  start: number;
  end: number;
  text: string;
}

/** Share of a beat the voiceover is assumed to fill, leaving a breath at each end. */
const SPOKEN_SHARE = 0.9;
const LEAD_IN = 0.25;

/**
 * Splits each beat's voiceover into sentences and spreads them across the beat by length.
 * This is an estimate, not a forced alignment: it is for reviewing the reel, not for export.
 */
export function buildCues(reel: ResolvedReel): Cue[] {
  const cues: Cue[] = [];
  for (const beat of reel.beats) {
    const sentences = beat.vo.replace(/'/g, '’').split(/(?<=[.?!])\s+/).filter(Boolean);
    const total = sentences.reduce((sum, s) => sum + s.length, 0);
    const span = beat.dur * SPOKEN_SHARE - LEAD_IN;
    let cursor = beat.start + LEAD_IN;
    sentences.forEach((text, i) => {
      const start = cursor;
      cursor += span * (text.length / total);
      cues.push({ start, end: i === sentences.length - 1 ? beat.end : cursor, text });
    });
  }
  return cues;
}

/** The voiceover subtitle track, laid over the foot of the stage. Off in pip mode, where the baked-in captions do the job. */
export class Subtitles {
  readonly el = h('div', 'subs', [], { 'aria-hidden': 'true' });
  private readonly cues: Cue[];
  private shown = '';

  constructor(stage: HTMLElement, reel: ResolvedReel, enabled: boolean) {
    this.cues = buildCues(reel);
    stage.append(this.el);
    this.setEnabled(enabled);
  }

  setEnabled(enabled: boolean): void {
    this.el.toggleAttribute('data-on', enabled);
  }

  get enabled(): boolean {
    return this.el.hasAttribute('data-on');
  }

  /** Shows the cue for `time`. Only touches the DOM when the line changes. */
  update(time: number): void {
    const cue = this.cues.find((c) => time >= c.start && time < c.end);
    const text = cue?.text ?? '';
    if (text === this.shown) return;
    this.shown = text;
    this.el.textContent = text;
    this.el.toggleAttribute('data-empty', !text);
  }
}
