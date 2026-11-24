import type { KeyPoint } from "../lib/types";

export interface GuidedGroup {
  heading: string;
  /** Keywords and short phrases only. Guided mode never shows full sentences. */
  points: string[];
}

/** One part of the Day 29 and Day 30 interviews. */
export interface Segment {
  id: string;
  title: string;
  question: string;
  seconds: number;
  keyPoints: KeyPoint[];
}

export interface DayContent {
  day: number;
  topic: string;
  skill: string;
  objective: string;
  /** Teleprompter script in the markup described in lib/script.ts. Days 1 to 28 only. */
  script?: string;
  /** Shown above the script: how to use it and how to make it yours. */
  scriptNote?: string;
  guided: GuidedGroup[];
  /** The first is the day's main question. The others are variations used in the question bank and simulations. */
  questions: string[];
  keyPoints: KeyPoint[];
  /** One coaching tip for the day. */
  tip: string;
  /** How long a good answer to the main question runs, in seconds. */
  target: [number, number];
  segments?: Segment[];
  /** Days 29 and 30: a reference answer opened only after speaking. */
  reference?: string;
}

export const kp = (id: string, label: string, ...terms: string[]): KeyPoint => ({ id, label, terms });
