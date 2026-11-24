import { test, eq, ok, done } from "./harness";
import { currentDay, streak, improvement, completedDays } from "../../src/lib/stats";
import { exportJSON, parseImport, mergeData } from "../../src/lib/storage";
import { emptyData, type AppData, type SessionRecord, type Attempt } from "../../src/lib/types";
import { analyse } from "../../src/lib/analysis/analyse";

const day = (offset: number, hour = 12) => {
  const d = new Date(2026, 10, 24, hour);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};
const session = (n: number, when: string): SessionRecord => ({ id: `s${n}-${when}`, day: n, startedAt: when, completedAt: when, plannedMin: 20, activeSec: 1200, phases: [], attemptIds: [] });
const NOW = new Date(2026, 10, 24, 18);

test("the current day is the first one not completed", () => {
  const d = emptyData();
  eq(currentDay(d), 1);
  d.sessions = [session(1, day(-2)), session(2, day(-1)), session(4, day(0))];
  eq(currentDay(d), 3);
  eq(completedDays(d).size, 3);
});

test("streak counts consecutive calendar days and survives until the end of today", () => {
  const d = emptyData();
  d.sessions = [session(1, day(-3)), session(2, day(-2)), session(3, day(-1))];
  eq(streak(d, NOW), 3, "practised yesterday, not yet today");
  d.sessions.push(session(4, day(0)));
  eq(streak(d, NOW), 4, "today counts");
  d.sessions = [session(1, day(-5)), session(2, day(-4))];
  eq(streak(d, NOW), 0, "a gap breaks it");
});

test("two sessions on one day count once", () => {
  const d = emptyData();
  d.sessions = [session(1, day(0, 8)), session(2, day(0, 20))];
  eq(streak(d, NOW), 1);
});

const attempt = (i: number, text: string, dur: number): Attempt => ({
  id: `a${i}`, day: 1, kind: "challenge", question: "q", at: day(-10 + i), durationSec: dur, transcript: text, source: "speech", vad: null, hasAudio: false,
  analysis: analyse({ transcript: text, durationSec: dur, kind: "challenge" }),
});
const WEAK = "Um, so basically I think, like, we would, uh, maybe look at it, you know. Sorry, I kind of lose my words. I guess it depends, actually, on the team and the time we have.";
const STRONG = "My approach is to start with the business context and the user problem. For example, on a listing page I would look at the data first. Because of that, I would test two options. In short, I decide with evidence and measure the result after launch.";

test("improvement needs two scored answers and compares the start with the latest", () => {
  const d = emptyData();
  eq(improvement(d), null);
  d.attempts = [attempt(1, WEAK, 40)];
  eq(improvement(d), null);
  d.attempts = [attempt(1, WEAK, 40), attempt(2, STRONG, 40)];
  const imp = improvement(d)!;
  ok(imp.delta > 0, `delta ${imp.delta}`);
  eq(imp.n, 2);
});

test("a backup round-trips and never carries the API key", () => {
  const d: AppData = emptyData();
  d.sessions = [session(1, day(0))];
  d.attempts = [attempt(1, STRONG, 40)];
  d.settings.ai.apiKey = "sk-ant-secret";
  d.active = { id: "x", day: 2, startedAt: day(0), phaseIndex: 0, clocks: [], status: [], attemptIds: [] };
  const text = exportJSON(d);
  ok(!text.includes("sk-ant-secret"), "no key in the file");
  const r = parseImport(text);
  ok(r.ok);
  if (r.ok) {
    eq(r.data.sessions.length, 1);
    eq(r.data.attempts[0].transcript, STRONG);
    eq(r.data.active, null, "an in-progress session is not exported");
  }
});

test("bad files are refused with a plain message", () => {
  const a = parseImport("not json");
  ok(!a.ok && /not valid JSON/.test(a.error));
  const b = parseImport(JSON.stringify({ hello: 1 }));
  ok(!b.ok && /not a SpeakUp 30 backup/.test(b.error));
  const c = parseImport(JSON.stringify({ app: "speakup-30", data: { sessions: 1 } }));
  ok(!c.ok);
});

test("old or partial data is filled in with defaults", () => {
  const d = mergeData({ welcomed: true, settings: { theme: "light" } });
  eq(d.settings.theme, "light");
  eq(d.settings.lang, "en-IN");
  eq(d.sessions, []);
});

done();
