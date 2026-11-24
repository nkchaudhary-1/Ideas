import { test, eq, ok, done } from "./harness";
import { CURRICULUM, phasesForDay, plannedMinutes, warmupFor } from "../../src/content/curriculum";
import { parseScript } from "../../src/lib/script";
import { tokenize } from "../../src/lib/analysis/text";

test("30 days in order", () => {
  eq(CURRICULUM.length, 30);
  CURRICULUM.forEach((d, i) => eq(d.day, i + 1));
});

test("session lengths match the brief", () => {
  const expect: Record<number, number> = { 1: 20, 7: 20, 8: 22, 14: 22, 15: 24, 21: 24, 22: 26, 28: 26, 29: 28, 30: 30 };
  for (const [d, m] of Object.entries(expect)) eq(plannedMinutes(+d), m, `day ${d}`);
});

test("phase lists match the brief", () => {
  eq(phasesForDay(1).map((p) => p.minutes), [2, 5, 5, 5, 3]);
  eq(phasesForDay(10).map((p) => p.minutes), [3, 5, 6, 5, 3]);
  eq(phasesForDay(18).map((p) => p.minutes), [3, 5, 7, 6, 3]);
  eq(phasesForDay(24).map((p) => p.kind), ["warmup", "teleprompter", "guided", "simulation", "reflection"]);
  eq(phasesForDay(29).map((p) => p.minutes), [3, 5, 15, 5]);
  eq(phasesForDay(30).map((p) => p.minutes), [3, 22, 5]);
});

test("warm-ups fit their phase", () => {
  eq(warmupFor(1).reduce((n, e) => n + e.seconds, 0), 120);
  eq(warmupFor(9).reduce((n, e) => n + e.seconds, 0), 180);
});

test("every day has a script (1 to 28), parses cleanly and has realistic length", () => {
  for (const d of CURRICULUM) {
    if (d.day >= 29) {
      ok(!d.script, `day ${d.day} must have no full script`);
      continue;
    }
    ok(d.script, `day ${d.day} script`);
    const first = parseScript(d.script!);
    const fills = Object.fromEntries(first.placeholders.map((p) => [p.key, "one two three four five six seven eight"]));
    const doc = parseScript(d.script!, fills);
    eq(doc.errors, [], `day ${d.day} errors`);
    ok(doc.words >= 130 && doc.words <= 420, `day ${d.day} words ${doc.words}`);
    ok(doc.units.length >= 8, `day ${d.day} units`);
    const keys = doc.placeholders.map((p) => p.key);
    eq(new Set(keys).size, keys.length, `day ${d.day} unique placeholder keys`);
    ok(doc.units.every((u) => u.words <= 28), `day ${d.day} chunk size`);
  }
});

test("scripts include the cue types and use pauses throughout", () => {
  const all = CURRICULUM.filter((d) => d.script).map((d) => d.script!).join("\n");
  for (const c of ["[PAUSE 1]", "[PAUSE 2]", "[BREATHE]", "[EMPHASISE]", "[SLOW]", "[CONTINUE]", "[TONE]", "[CONFIDENT]", "[SMILE]", "[LOOK UP]"]) ok(all.includes(c), `cue ${c} used`);
});

test("guided prompts never contain full sentences", () => {
  for (const d of CURRICULUM) {
    for (const g of d.guided) for (const p of g.points) ok(!/[.!?]$/.test(p) && tokenize(p).length <= 12, `day ${d.day}: "${p}"`);
  }
});

test("every day has questions, key points and a target", () => {
  for (const d of CURRICULUM) {
    ok(d.questions.length >= 1);
    ok(d.topic && d.skill && d.objective && d.tip);
    ok(d.target[0] < d.target[1]);
    if (d.day !== 30) ok(d.keyPoints.length >= 4, `day ${d.day} key points`);
  }
});

test("days 29 and 30 have segments, day 30 has the ten interview parts", () => {
  eq(CURRICULUM[28].segments!.length, 4);
  const s = CURRICULUM[29].segments!;
  eq(s.length, 10);
  eq(s.map((x) => x.title), ["Introduction", "Career journey", "Design process", "Portfolio walkthrough", "Product thinking", "Collaboration", "Conflict", "Leadership", "Strategic decision-making", "Unexpected questions"]);
  ok(s.reduce((n, x) => n + x.seconds, 0) <= 22 * 60);
});

test("copy uses British spelling and no trailing full stop on topics", () => {
  for (const d of CURRICULUM) {
    ok(!/[.]$/.test(d.topic), `topic ${d.day}`);
    const txt = [d.script ?? "", d.tip, d.objective].join(" ");
    ok(!/\b(prioritiz|organiz|summariz|realiz|utiliz|behavior|center|color)/i.test(txt), `day ${d.day} US spelling`);
  }
});

done();
