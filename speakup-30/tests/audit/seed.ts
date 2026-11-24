// Test-only sample data so the audit can exercise screens that need history. Built with the real analysis, so the
// numbers are what the app would really have computed. Never imported by the app.
import { analyse } from "../../src/lib/analysis/analyse";
import { emptyData, type AppData, type Attempt, type KeyPoint } from "../../src/lib/types";
import { dayContent } from "../../src/content/curriculum";

const TEXTS = [
  `The way I approach a new design problem is to start with the business context. First I try to understand what the team wants to achieve and who the user is.\nFor example, on a listing page the problem might be that people leave after the second scroll. Because of that, I would look at the data and talk to a few shoppers before touching any screens.\nThen I define what success looks like, explore two or three options, and test the strongest one with real users. I decided to keep the scope small so we could learn quickly.\nOverall, that is how I move from a vague problem to a decision the team believes in.`,
  `Um, so basically I think I would, like, start with the problem, you know, and then actually look at the data. Sorry, I kind of lose my words sometimes. Maybe we could try a few things and see what works for the users and the business. I guess it depends on the team and the time we have.`,
  `I'm a product designer with eight years of experience in e-commerce. I like to start with the user problem, so first I look at the data and talk to shoppers. For example, when people dropped off on a listing page, I tested two filter layouts. We decided to ship the simpler one. In short, I try to make small decisions quickly and learn from them.`,
];
const KP: KeyPoint[] = [
  { id: "a", label: "Business context", terms: ["business", "context"] },
  { id: "b", label: "User problem", terms: ["user", "shopper"] },
  { id: "c", label: "Research", terms: ["research", "data", "talk to"] },
  { id: "d", label: "Success", terms: ["success", "metric"] },
  { id: "e", label: "Test", terms: ["test"] },
];

export function buildSeed(now = Date.now(), theme: "dark" | "light" = "dark", through = 5): AppData {
  const d = emptyData();
  d.welcomed = true;
  d.settings.theme = theme;
  d.settings.countdown = false;
  const attempts: Attempt[] = [];
  for (let day = 1; day <= through; day++) {
    const when = new Date(now - (through - day) * 86400000);
    const sid = `s${day}`;
    const ids: string[] = [];
    // Only the first five days carry full answers; later days are just completed sessions.
    (day <= 5 ? [0, 1] : []).forEach((k) => {
      const text = TEXTS[(day + k) % 3];
      const dur = 52 + day * 6 + k * 9;
      const vad = { speakingSec: dur - 14, leadSilenceSec: 1.2, tailSilenceSec: 1.5, pauses: 3 + (day % 3), longPauses: day % 2, longestPauseSec: 2.4 };
      const id = `a${day}-${k}`;
      attempts.push({
        id,
        day,
        kind: k === 0 ? "guided" : "challenge",
        question: dayContent(day).questions[0],
        at: new Date(when.getTime() + k * 600000).toISOString(),
        durationSec: dur,
        transcript: text,
        source: "speech",
        vad,
        hasAudio: false,
        analysis: analyse({ transcript: text, durationSec: dur, vad, kind: k === 0 ? "guided" : "challenge", keyPoints: KP, targetSec: [60, 120] }),
        keyPoints: KP,
        targetSec: [60, 120],
        sessionId: sid,
      });
      ids.push(id);
    });
    d.sessions.push({
      id: sid,
      day,
      startedAt: when.toISOString(),
      completedAt: new Date(when.getTime() + 20 * 60000).toISOString(),
      plannedMin: 20,
      activeSec: 19 * 60 + day * 17,
      phases: ["warmup", "teleprompter", "guided", "challenge", "reflection"].map((id) => ({ id, status: "done" as const, sec: 240 })),
      attemptIds: ids,
    });
    d.reflections.push({ id: `r${day}`, day, sessionId: sid, at: when.toISOString(), answers: ["I kept my pace steady.", "I hesitated on the opening.", "The sentence about my role.", "Slow down in the introduction."] });
  }
  d.attempts = attempts;
  return d;
}
