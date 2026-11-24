export interface Week {
  id: number;
  name: string;
  short: string;
  goal: string;
  from: number;
  to: number;
}

export const WEEKS: Week[] = [
  { id: 1, name: "Foundation & self-expression", short: "Week 1", goal: "Become comfortable speaking about myself and my experience.", from: 1, to: 7 },
  { id: 2, name: "Product design fundamentals", short: "Week 2", goal: "Clearly explain my design process and reasoning.", from: 8, to: 14 },
  { id: 3, name: "Portfolio & cross-functional collaboration", short: "Week 3", goal: "Present projects confidently and handle challenging conversations.", from: 15, to: 21 },
  { id: 4, name: "Leadership & strategic thinking", short: "Week 4", goal: "Communicate like a senior product designer.", from: 22, to: 28 },
  { id: 5, name: "Advanced interview simulation", short: "Final two days", goal: "Perform a full interview without a script.", from: 29, to: 30 },
];

export const weekOf = (day: number): Week => WEEKS.find((w) => day >= w.from && day <= w.to) ?? WEEKS[4];

export type SupportLevel = "full" | "bullets" | "minimal" | "none";
/** How much help the day gives, and the teleprompter defaults that go with it. */
export function levelFor(day: number): {
  support: SupportLevel;
  label: string;
  cueMode: "beginner" | "intermediate" | "advanced";
  wpm: number;
  supportMode: "full" | "first-words" | "key-phrases";
  followUps: number;
} {
  if (day <= 7) return { support: "full", label: "Full script, slow pace, detailed cues", cueMode: "beginner", wpm: 100, supportMode: "full", followUps: 0 };
  if (day <= 14) return { support: "full", label: "Full script, structured answers, longer speaking", cueMode: "intermediate", wpm: 115, supportMode: "full", followUps: 1 };
  if (day <= 21) return { support: "bullets", label: "Script, then bullet prompts and follow-up questions", cueMode: "intermediate", wpm: 125, supportMode: "full", followUps: 2 };
  if (day <= 28) return { support: "minimal", label: "Minimal prompter support, strategic questions", cueMode: "advanced", wpm: 135, supportMode: "key-phrases", followUps: 3 };
  return { support: "none", label: "No script. Realistic interview with unexpected follow-ups", cueMode: "advanced", wpm: 135, supportMode: "key-phrases", followUps: 3 };
}
