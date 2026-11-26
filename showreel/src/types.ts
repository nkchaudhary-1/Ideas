/** A point in the reel: seconds (`75`), `"m:ss"` (`"1:15"`) or `"m:ss.s"` (`"0:22.5"`). */
export type Timecode = number | string;

/** The three colour grades the reel moves between. */
export type WorldName = 'cool' | 'warm' | 'neutral';
/** A single world, or a blend that eases from one to the other across the beat. */
export type WorldSpec = WorldName | { from: WorldName; to: WorldName };
/** Motion style: `precise` = locked expo eases, `loose` = overshoot and drift. */
export type FeelName = 'precise' | 'loose';

/** Fields every beat shares. Add a beat-specific block below for its own content. */
interface BeatBase {
  /** Stable key. Also the `data-beat` attribute on the beat's DOM node. */
  id: string;
  /** Short name used by the timeline markers and the debug overlay. */
  label: string;
  /** Where the beat starts. It ends where the next one starts (the last one ends at `duration`). */
  in: Timecode;
  /** Voiceover line, used for the subtitle track and as the transcript. */
  vo: string;
  world: WorldSpec;
  /** 0 to 1: extra darkening on top of the world. Default 0. */
  dim?: number;
  /** Motion style. Default: `loose` for warm beats, `precise` for everything else. */
  feel?: FeelName;
  /**
   * The on-screen caption. A string is one block (`\n` forces a line break); an array is several
   * segments the beat reveals one after another. `_text_` renders dimmer.
   */
  caption: string | string[];
}

export interface HookBeat extends BeatBase {
  kind: 'hook';
  /** The words that flash in turn. Each one has its own concept artwork. */
  flashes: string[];
  /** Seconds each flash holds. Keep it at 0.35 or more (three flashes a second is the safe limit). */
  flashEvery: number;
}

export interface CompaniesBeat extends BeatBase {
  kind: 'companies';
  companies: string[];
}

export interface Metric {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface NumbersBeat extends BeatBase {
  kind: 'numbers';
  metrics: Metric[];
  award: string;
}

export type SightingArt = 'signboard' | 'sunset' | 'app';

export interface CuriosityBeat extends BeatBase {
  kind: 'curiosity';
  /** Things the viewfinder lands on, in order, one per tile. */
  sightings: { art: SightingArt; label: string }[];
}

export interface BuilderBeat extends BeatBase {
  kind: 'builder';
}

export interface CraftBeat extends BeatBase {
  kind: 'craft';
}

export interface CloseBeat extends BeatBase {
  kind: 'close';
  /** The number that rolls up. The caption carries the words after it. */
  years: number;
  /** The closing line that lands after the years. `\n` forces a line break; `_text_` is dimmer. */
  payoff: string;
}

export interface EndCardBeat extends BeatBase {
  kind: 'endcard';
  role: string;
  url: string;
}

export type Beat =
  | HookBeat
  | CompaniesBeat
  | NumbersBeat
  | CuriosityBeat
  | BuilderBeat
  | CraftBeat
  | CloseBeat
  | EndCardBeat;

export interface ReelConfig {
  title: string;
  /** End of the last beat, which is also where the loop wraps. */
  duration: Timecode;
  /** Tempo the choreography is quantised to. One "tick" is a sixteenth note at this tempo. */
  bpm: number;
  /** Second shown as the still frame before play in `full` mode. */
  poster: number;
  /** Seconds the last beat spends grading back to the first beat's world, so the loop is seamless. */
  loopBlend: number;
  /** The white flash laid over every cut. */
  flash: { opacity: number; duration: number };
  audio: {
    /** Path to your voiceover file. Empty = none. */
    vo: string;
    /** Path to your music bed. Empty = none. */
    music: string;
    /** Music volume, 0 to 1. */
    musicGain: number;
  };
  beats: Beat[];
}

/** Timing and defaults worked out from the config. Builders only ever see these. */
export interface Timing {
  index: number;
  start: number;
  end: number;
  dur: number;
  world: { from: WorldName; to: WorldName };
  dim: number;
  feel: FeelName;
  /** `caption` as an array. */
  segments: string[];
}

export type Resolved<B extends Beat = Beat> = B extends Beat ? B & Timing : never;
export type ResolvedBeat = Resolved<Beat>;
export type BeatKind = Beat['kind'];

export interface ResolvedReel extends Omit<ReelConfig, 'beats' | 'duration'> {
  duration: number;
  beats: ResolvedBeat[];
}
