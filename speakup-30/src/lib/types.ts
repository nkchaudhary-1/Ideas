// Shared types. Everything the app stores is plain JSON so it can be exported and restored as one file.

export type CueMode = "beginner" | "intermediate" | "advanced";
export type SupportMode = "full" | "first-words" | "key-phrases";
export type Theme = "dark" | "light" | "system";
export type AttemptKind = "read-aloud" | "guided" | "challenge" | "simulation" | "interview" | "practice";
export type TranscriptSource = "speech" | "typed" | "edited";

/** What the microphone level told us, measured from the real audio signal while recording. */
export interface VadStats {
  /** Seconds the level was above the speech threshold. */
  speakingSec: number;
  /** Seconds from pressing record to the first words. */
  leadSilenceSec: number;
  /** Seconds of silence after the last words. */
  tailSilenceSec: number;
  /** Silences of 1 second or more between speech (not counting the start or the end). */
  pauses: number;
  /** Silences of 2 seconds or more between speech. */
  longPauses: number;
  /** Longest silence between speech, in seconds. */
  longestPauseSec: number;
}

export interface Score {
  /** 0 to 10, or null when there is not enough real data to score it. */
  value: number | null;
  /** One line saying what the number is based on. */
  note: string;
}

export interface FillerExample {
  sentence: string;
  counted: boolean;
  reason: string;
}
export interface FillerFinding {
  label: string;
  total: number;
  counted: number;
  okay: number;
  examples: FillerExample[];
}
export interface HedgeFinding {
  kind: "hedge" | "apology";
  label: string;
  count: number;
  example: string;
  suggestion: string;
}
export interface SentenceFinding {
  text: string;
  words: number;
  issue: "long" | "tangled" | "repetitive-start";
  advice: string;
}
export interface VocabSuggestion {
  from: string;
  to: string;
  sentence: string;
  why: string;
}
export interface StructureElement {
  id: "opening" | "context" | "explanation" | "example" | "conclusion";
  label: string;
  found: boolean;
  evidence?: string;
}
export interface KeyPoint {
  id: string;
  label: string;
  /** Lower-case words or phrases. Any one of them counts as touching the idea. */
  terms: string[];
}
export interface BetterSentence {
  original: string;
  better: string;
  changes: string[];
}

export interface Analysis {
  version: 1;
  wordCount: number;
  sentenceCount: number;
  sentencesReliable: boolean;
  /** False when the answer is too short to score honestly. */
  scored: boolean;
  metrics: {
    durationSec: number | null;
    wpm: number | null;
    articulationWpm: number | null;
    fillerPer100: number;
    fillerCount: number;
    hesitations: number;
    hedgePer100: number;
    avgSentenceWords: number | null;
    longSentences: number;
    repetitions: number;
    pauses: number | null;
    longPauses: number | null;
  };
  scores: {
    clarity: Score;
    fluency: Score;
    pace: Score;
    fillers: Score;
    structure: Score;
    phrasing: Score;
    relevance: Score;
    readiness: Score;
  };
  fillers: FillerFinding[];
  hedges: HedgeFinding[];
  sentences: SentenceFinding[];
  vocabulary: VocabSuggestion[];
  structure: StructureElement[];
  relevance: { covered: KeyPoint[]; missed: KeyPoint[] } | null;
  wentWell: string[];
  improve: string[];
  better: BetterSentence | null;
  limitations: string[];
}

export interface AIReview {
  model: string;
  at: string;
  summary: string;
  wentWell: string[];
  improve: string[];
  betterSentences: { original: string; better: string; why: string }[];
  followUp: string;
}

export interface Attempt {
  id: string;
  day: number;
  kind: AttemptKind;
  question: string;
  at: string;
  /** Length of the recording in seconds (or the time on the clock for a typed answer). */
  durationSec: number;
  transcript: string;
  source: TranscriptSource;
  vad: VadStats | null;
  /** True when audio was recorded on this device and kept (see Settings). */
  hasAudio: boolean;
  analysis: Analysis | null;
  ai?: AIReview;
  retryOf?: string;
  followUpOf?: string;
  /** Why this follow-up was asked, when it is one. */
  followUpReason?: string;
  sessionId?: string;
  /** Key points this question is scored against, kept so the report still makes sense if the curriculum changes. */
  keyPoints?: KeyPoint[];
  targetSec?: [number, number];
}

export interface PhaseResult {
  id: string;
  status: "done" | "skipped";
  sec: number;
}
export interface SessionRecord {
  id: string;
  day: number;
  startedAt: string;
  completedAt: string;
  plannedMin: number;
  /** Seconds actually spent, from the clocks (paused time is not counted). */
  activeSec: number;
  phases: PhaseResult[];
  attemptIds: string[];
}

export interface Reflection {
  id: string;
  day: number;
  sessionId?: string;
  at: string;
  /** Answers in the order of REFLECTION_QUESTIONS. */
  answers: [string, string, string, string];
}

export interface Settings {
  theme: Theme;
  /** BCP 47 language tag for speech recognition. */
  lang: "en-IN" | "en-GB" | "en-US";
  liveTranscript: boolean;
  keepRecordings: boolean;
  countdown: boolean;
  ai: { enabled: boolean; apiKey: string; model: string };
}

export interface PrompterPrefs {
  wpm: number | null; // null = follow the day's default
  fontSize: number;
  lineHeight: number;
  cueMode: CueMode | null; // null = follow the day's default
  support: SupportMode | null; // null = follow the day's default
}

export interface PhaseClock {
  accMs: number;
  /** Epoch ms when the clock last started running; null while paused. */
  runningSince: number | null;
}
export interface ActiveSession {
  id: string;
  day: number;
  startedAt: string;
  phaseIndex: number;
  clocks: PhaseClock[];
  status: ("pending" | "done" | "skipped")[];
  attemptIds: string[];
  /** Free text kept for the day: the Day 29 preparation notes. */
  notes?: string;
  /** Index into the question list for sequenced phases. */
  step?: number;
}

export interface AppData {
  version: 1;
  welcomed: boolean;
  settings: Settings;
  prompter: PrompterPrefs;
  sessions: SessionRecord[];
  attempts: Attempt[];
  reflections: Reflection[];
  /** Placeholder answers per day: customisations[day][key]. */
  fills: Record<number, Record<string, string>>;
  active: ActiveSession | null;
  /** Day 29 preparation notes survive reloads even without an active session. */
  notes: Record<number, string>;
}

export const REFLECTION_QUESTIONS = [
  "What did I do well today?",
  "Where did I hesitate?",
  "Which sentence was difficult to express?",
  "What will I improve tomorrow?",
] as const;

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  lang: "en-IN",
  liveTranscript: true,
  keepRecordings: false,
  countdown: true,
  ai: { enabled: false, apiKey: "", model: "claude-opus-5-5" },
};

export const DEFAULT_PROMPTER: PrompterPrefs = { wpm: null, fontSize: 32, lineHeight: 1.6, cueMode: null, support: null };

export function emptyData(): AppData {
  return {
    version: 1,
    welcomed: false,
    settings: { ...DEFAULT_SETTINGS, ai: { ...DEFAULT_SETTINGS.ai } },
    prompter: { ...DEFAULT_PROMPTER },
    sessions: [],
    attempts: [],
    reflections: [],
    fills: {},
    active: null,
    notes: {},
  };
}
