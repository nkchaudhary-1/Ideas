import { test, eq, ok, done } from "./harness";
import { parseScript, cueDisplay, supportText, scriptSeconds } from "../../src/lib/script";

test("splits sentences into units", () => {
  const d = parseScript("Hello there. This is a test. Third one here!");
  eq(d.units.length, 3);
  eq(d.units[0].plain, "Hello there.");
  eq(d.units[2].plain, "Third one here!");
});

test("pause cues become timed pauses on the preceding unit", () => {
  const d = parseScript("I design products. [PAUSE 2] Then I ship them. [BREATHE]");
  eq(d.units.length, 2);
  eq(d.units[0].pauseAfter, 2);
  eq(d.units[1].pauseAfter, 1.5);
});

test("a pause mid-sentence splits the sentence into two chunks", () => {
  const d = parseScript("When I joined, [PAUSE 1] the checkout was a mess.");
  eq(d.units.length, 2);
  eq(d.units[0].pauseAfter, 1);
});

test("emphasis phrases are collected and kept as one phrase", () => {
  const d = parseScript("I care about *real user problems* first.");
  eq(d.units[0].emphasised, ["real user problems"]);
  ok(d.units[0].parts.some((p) => p.t === "em" && p.text === "real user problems"));
});

test("placeholders list, fill and count words", () => {
  const md = "At {{company|Your company|Name the company.}} I led {{metric|A number|Use a real number.}} work.";
  const d = parseScript(md);
  eq(d.placeholders.length, 2);
  eq(d.unfilled, 2);
  const f = parseScript(md, { company: "Acme", metric: "" });
  eq(f.unfilled, 1);
  ok(f.units[0].plain.includes("Acme"));
  ok(f.units[0].plain.includes("[A number]"));
});

test("slow down applies until continue", () => {
  const d = parseScript("Normal pace here. [SLOW] Slow now. Still slow. [CONTINUE] Back to normal.");
  eq(d.units.map((u) => u.speed), [1, 0.75, 0.75, 1]);
});

test("long sentences are chunked at commas and conjunctions", () => {
  const long = "We looked at the data from the last quarter, and we noticed that people were dropping off on the listing page, because the filters were hidden behind a tiny icon that nobody could find.";
  const d = parseScript(long);
  ok(d.units.length >= 2, `expected a split, got ${d.units.length}`);
  ok(d.units.every((u) => u.words <= 24), "chunks stay small");
  eq(d.units.map((u) => u.plain).join(" ").replace(/\s+/g, " "), long);
});

test("unknown cues are reported", () => {
  eq(parseScript("Hello. [WAVE] There.").errors.length, 1);
});

test("cue display follows the mode", () => {
  eq(cueDisplay("smile", "beginner"), "chip");
  eq(cueDisplay("smile", "intermediate"), "none");
  eq(cueDisplay("pause1", "intermediate"), "chip");
  eq(cueDisplay("emphasise", "intermediate"), "chip");
  eq(cueDisplay("pause2", "advanced"), "dot");
  eq(cueDisplay("emphasise", "advanced"), "none");
});

test("support text fades the script", () => {
  const d = parseScript("I always start with *the user problem* before anything else.");
  eq(supportText(d.units[0], "full"), null);
  eq(supportText(d.units[0], "first-words"), "I always start …");
  eq(supportText(d.units[0], "key-phrases"), "the user problem");
});

test("duration adds pauses to speaking time", () => {
  const d = parseScript("One two three four five six. [PAUSE 2]");
  const s = scriptSeconds(d, 120);
  ok(Math.abs(s - (3 + 2)) < 0.01, `got ${s}`);
});

done();
