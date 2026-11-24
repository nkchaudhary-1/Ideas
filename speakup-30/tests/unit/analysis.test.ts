import { test, eq, ok, done } from "./harness";
import { analyse, paceScoreFor } from "../../src/lib/analysis/analyse";
import { findFillers } from "../../src/lib/analysis/rules";
import { pickFollowUps } from "../../src/lib/analysis/followups";
import { compareAnalyses } from "../../src/lib/analysis/compare";
import { splitSentences } from "../../src/lib/analysis/text";

const GOOD = `The way I approach a new design problem is to start with the business context. First I try to understand what the team is trying to achieve and who the user is.
For example, on a listing page the problem might be that people leave after the second scroll. Because of that, I would look at the data and talk to a few shoppers before touching any screens.
Then I define what success looks like, explore two or three options, and test the strongest one with real users. I decided to keep the scope small so we could learn quickly.
Overall, that is how I move from a vague problem to a decision the team believes in.`;

test("filler context: 'like' as a verb or comparison is not counted", () => {
  const r = findFillers(["I would like to explain this.", "It looks like a grid.", "It was, like, really confusing."]);
  const like = r.findings.find((f) => f.label === "like")!;
  eq(like.total, 3);
  eq(like.counted, 1);
});

test("hesitation sounds are always counted", () => {
  const r = findFillers(["Um, I think we should, uh, start with research."]);
  eq(r.hesitations, 2);
});

test("'so' at the very start is allowed once, 'and so' is counted", () => {
  const r = findFillers(["So the idea was simple.", "We learned a lot, and so we changed the flow."]);
  const so = r.findings.find((f) => f.label === "so")!;
  eq(so.counted, 1);
  eq(so.okay, 1);
});

test("'I think' is free twice then counted", () => {
  const r = findFillers(["I think it works.", "I think we should ship.", "I think that is enough."]);
  const it = r.findings.find((f) => f.label === "I think")!;
  eq(it.counted, 1);
  eq(it.okay, 2);
});

test("'actually' mid-sentence once is fine, with a comma it is a filler", () => {
  const r = findFillers(["We actually tested it.", "Actually, we tested it twice."]);
  const a = r.findings.find((f) => f.label === "actually")!;
  eq(a.counted, 1);
});

test("a good answer scores and finds structure", () => {
  const a = analyse({ transcript: GOOD, durationSec: 55, kind: "challenge",
    keyPoints: [
      { id: "ctx", label: "Business context", terms: ["business context", "goal"] },
      { id: "users", label: "User problem", terms: ["user", "shopper"] },
      { id: "res", label: "Research", terms: ["research", "data", "talk to"] },
      { id: "succ", label: "Success", terms: ["success"] },
      { id: "test", label: "Test", terms: ["test"] },
    ] });
  ok(a.scored);
  ok(a.scores.structure.value! >= 7, `structure ${a.scores.structure.value}`);
  ok(a.scores.relevance.value! >= 8, `relevance ${a.scores.relevance.value}`);
  ok(a.scores.fillers.value! >= 9);
  ok(a.metrics.wpm! > 100 && a.metrics.wpm! < 200);
  ok(a.wentWell.length > 0);
});

test("pace is null without a duration and never invented", () => {
  const a = analyse({ transcript: GOOD });
  eq(a.scores.pace.value, null);
  eq(a.metrics.wpm, null);
});

test("short transcripts are not scored", () => {
  const a = analyse({ transcript: "I like design." , durationSec: 4 });
  eq(a.scored, false);
  eq(a.scores.readiness.value, null);
  eq(a.scores.clarity.value, null);
});

test("pace score shape", () => {
  eq(paceScoreFor(130), 10);
  ok(paceScoreFor(90) < 8);
  ok(paceScoreFor(200) < 6);
});

test("real silence data drives the fluency score", () => {
  const base = analyse({ transcript: GOOD, durationSec: 60 });
  const gappy = analyse({ transcript: GOOD, durationSec: 60, vad: { speakingSec: 40, leadSilenceSec: 1, tailSilenceSec: 1, pauses: 8, longPauses: 6, longestPauseSec: 4 } });
  ok(gappy.scores.fluency.value! < base.scores.fluency.value!);
  eq(gappy.metrics.longPauses, 6);
  ok(gappy.metrics.articulationWpm! > gappy.metrics.wpm!);
});

test("hedges and apologies show up in phrasing", () => {
  const t = "Sorry, my English is not great. I kind of think we could maybe try a redesign, I guess, if that makes sense. It is probably fine, probably.";
  const a = analyse({ transcript: t, durationSec: 20 });
  ok(a.hedges.some((h) => h.kind === "apology"));
  ok(a.scores.phrasing.value! <= 6, `phrasing ${a.scores.phrasing.value}`);
});

test("vocabulary suggestions only for unnatural phrasing", () => {
  const a = analyse({ transcript: "I will revert back to the team about this. I have an experience of eight years and I utilise research a lot to cope up with change.", durationSec: 12 });
  const from = a.vocabulary.map((v) => v.from.toLowerCase());
  ok(from.includes("revert back"));
  ok(from.some((f) => f.startsWith("i have an experience")));
  ok(from.includes("utilise"));
});

test("long sentences are flagged and a tightened sentence is offered", () => {
  const long = "So basically what happened was that we had this very long discussion with the stakeholders about the checkout flow and then we kind of decided to change the whole thing and it was a lot of work for the team because we had to rebuild the components and also update the documentation for everyone.";
  const a = analyse({ transcript: long + "\nThat is what we did, you know, in the end. It worked well for everyone involved.", durationSec: 30 });
  ok(a.sentences.some((s) => s.issue === "long"));
  ok(a.better, "expects a better sentence");
  ok(!/basically/i.test(a.better!.better));
  ok(a.better!.changes.length > 0);
});

test("unpunctuated transcripts do not produce fake sentence findings", () => {
  const blob = Array(60).fill("we looked at the data and talked to users").join(" ");
  const s = splitSentences(blob);
  eq(s.reliable, false);
  const a = analyse({ transcript: blob, durationSec: 60 });
  eq(a.sentences.length, 0);
  ok(a.limitations.some((l) => /punctuation/.test(l)));
});

test("follow-ups come from the gaps in the answer and quote the decision", () => {
  const f = pickFollowUps("We decided to simplify the filters on the listing page and the team shipped it in a sprint.", 2);
  eq(f.length, 2);
  ok(f[0].question.includes("simplify the filters"), f[0].question);
  ok(f.every((x) => x.reason.length > 0));
  const g = pickFollowUps("anything", 3, ["why", "alternatives"]);
  ok(g.every((x) => x.id !== "why" && x.id !== "alternatives"));
});

test("compare shows direction", () => {
  const a = analyse({ transcript: "Um, so basically, um, I think, you know, we, um, did research, like, maybe. Actually, basically, it was, uh, fine.", durationSec: 25 });
  const b = analyse({ transcript: GOOD, durationSec: 55 });
  const rows = compareAnalyses(a, b);
  ok(rows.find((r) => r.label === "Filler words per 100")!.verdict === "better");
});

done();
