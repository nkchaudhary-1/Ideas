// The shape of a practice session for each day, exactly as in the programme brief.
export type PhaseKind = "warmup" | "teleprompter" | "guided" | "challenge" | "simulation" | "prep" | "interview" | "full-interview" | "reflection";

export interface PhaseDef {
  id: string;
  kind: PhaseKind;
  title: string;
  minutes: number;
  blurb: string;
}

const warm = (m: number): PhaseDef => ({ id: "warmup", kind: "warmup", title: m === 2 ? "Vocal warm-up" : "Warm-up", minutes: m, blurb: "Breathing, voice and clear speech" });
const tele: PhaseDef = { id: "teleprompter", kind: "teleprompter", title: "Teleprompter", minutes: 5, blurb: "Read today's answer aloud with speaking cues" };
const guided = (m: number): PhaseDef => ({ id: "guided", kind: "guided", title: "Guided speaking", minutes: m, blurb: "Keywords only. Say it in your own words" });
const challenge = (m: number): PhaseDef => ({ id: "challenge", kind: "challenge", title: "Challenge", minutes: m, blurb: "A real interview question, recorded" });
const refl = (m: number, title = "Reflection"): PhaseDef => ({ id: "reflection", kind: "reflection", title, minutes: m, blurb: "Four short questions, saved to your journal" });

export function phasesForDay(day: number): PhaseDef[] {
  if (day <= 7) return [warm(2), tele, guided(5), challenge(5), refl(3)];
  if (day <= 14) return [warm(3), tele, guided(6), challenge(5), refl(3)];
  if (day <= 21) return [warm(3), tele, guided(7), challenge(6), refl(3)];
  if (day <= 28) return [warm(3), tele, guided(7), { id: "simulation", kind: "simulation", title: "Interview simulation", minutes: 8, blurb: "Three questions with follow-ups" }, refl(3)];
  if (day === 29)
    return [
      warm(3),
      { id: "prep", kind: "prep", title: "Guided preparation", minutes: 5, blurb: "Plan your first 90 days in keywords" },
      { id: "interview", kind: "interview", title: "Interview practice", minutes: 15, blurb: "Four questions, no script" },
      refl(5, "Feedback & reflection"),
    ];
  return [
    warm(3),
    { id: "full-interview", kind: "full-interview", title: "Full interview simulation", minutes: 22, blurb: "Ten parts from introduction to unexpected questions" },
    refl(5, "Reflection & evaluation"),
  ];
}

export const plannedMinutes = (day: number) => phasesForDay(day).reduce((n, p) => n + p.minutes, 0);
