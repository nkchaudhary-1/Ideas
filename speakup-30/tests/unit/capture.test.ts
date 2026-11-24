import { test, eq, ok, done } from "./harness";
import { SilenceMeter } from "../../src/lib/speech/capture";

// Drive the silence meter with a synthetic signal: loud = speech, quiet = silence. 50ms frames.
function run(pattern: [number, number][]) {
  const m = new SilenceMeter();
  let t = 0;
  for (const [level, seconds] of pattern) {
    for (let i = 0; i < Math.round(seconds * 20); i++) {
      m.push(level + (i % 2) * level * 0.1, t);
      t += 50;
    }
  }
  return m.finish(t);
}
const SPEECH = 0.12;
const QUIET = 0.002;

test("measures speaking time and the silence at both ends", () => {
  const v = run([[QUIET, 1.5], [SPEECH, 4], [QUIET, 2]]);
  ok(Math.abs(v.speakingSec - 4) < 0.6, `speaking ${v.speakingSec}`);
  ok(Math.abs(v.leadSilenceSec - 1.5) < 0.3, `lead ${v.leadSilenceSec}`);
  ok(Math.abs(v.tailSilenceSec - 2) < 0.7, `tail ${v.tailSilenceSec}`);
  eq(v.pauses, 0);
});

test("counts pauses between speech, and long pauses separately", () => {
  const v = run([[QUIET, 0.5], [SPEECH, 2], [QUIET, 1.3], [SPEECH, 2], [QUIET, 2.6], [SPEECH, 2], [QUIET, 0.4], [SPEECH, 1], [QUIET, 1]]);
  eq(v.pauses, 2, "pauses of 1s or more");
  eq(v.longPauses, 1, "pauses of 2s or more");
  ok(v.longestPauseSec >= 2.4 && v.longestPauseSec <= 3.1, `longest ${v.longestPauseSec}`);
});

test("short clicks and noise bursts are not speech", () => {
  const v = run([[QUIET, 1], [SPEECH, 0.1], [QUIET, 2], [SPEECH, 3], [QUIET, 1]]);
  ok(v.speakingSec > 2.5 && v.speakingSec < 3.6, `speaking ${v.speakingSec}`);
  eq(v.pauses, 0, "the blip does not split speech");
});

test("a recording with no speech reports all silence", () => {
  const v = run([[QUIET, 5]]);
  eq(v.speakingSec, 0);
  ok(v.leadSilenceSec >= 4.9);
});

test("a steady noisy room is learned as the floor, not as speech", () => {
  const v = run([[0.02, 6], [0.2, 3], [0.02, 3]]);
  ok(v.speakingSec > 2 && v.speakingSec < 4.5, `speaking ${v.speakingSec}`);
});

done();
