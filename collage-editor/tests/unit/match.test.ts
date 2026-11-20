import { measure, solveMatch, statsOf, processRaster, DEFAULT_MATCH, type Raster } from "../../src/lib/match";
import { NEUTRAL, layerAdjust } from "../../src/lib/filters";
import type { Adjustments } from "../../src/lib/types";

let pass = 0, fail = 0;
const ok = (c: boolean, m: string, extra?: unknown) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + m + (c || extra === undefined ? "" : "  → " + JSON.stringify(extra))); };

// deterministic synthetic scene: sky gradient, a mid-tone ground and some vivid patches
function scene(gain: number, warm: number, flat: number, satMul: number): Raster {
  const w = 96, h = 64, data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = x / (w - 1), u = y / (h - 1);
    let r = 0.15 + 0.7 * t * (1 - u) + 0.1 * u, g = 0.2 + 0.55 * t * (1 - u) + 0.15 * u, b = 0.3 + 0.55 * (1 - t) * (1 - u) + 0.05 * u;
    if ((x + y) % 11 < 3) { r = 0.9; g = 0.25; b = 0.2; }
    if ((x * 3 + y) % 17 < 3) { r = 0.2; g = 0.7; b = 0.35; }
    const m = (r + g + b) / 3;
    r = m + (r - m) * satMul; g = m + (g - m) * satMul; b = m + (b - m) * satMul;
    r = 0.5 + (r - 0.5) * flat; g = 0.5 + (g - 0.5) * flat; b = 0.5 + (b - 0.5) * flat;
    r = r * gain * (1 + warm); b = b * gain * (1 - warm); g = g * gain;
    const o = (y * w + x) * 4;
    data[o] = Math.max(0, Math.min(255, r * 255)); data[o + 1] = Math.max(0, Math.min(255, g * 255)); data[o + 2] = Math.max(0, Math.min(255, b * 255)); data[o + 3] = 255;
  }
  return { data, w, h };
}
const dist = (a: ReturnType<typeof measure>, b: ReturnType<typeof measure>) =>
  Math.abs(a.p50 - b.p50) + Math.abs(a.std - b.std) + Math.abs(a.p5 - b.p5) + Math.abs(a.p95 - b.p95) + Math.abs(a.sat - b.sat) + Math.abs(a.tb - b.tb) * 2 + Math.abs(a.tint - b.tint) * 2;

const ref = scene(1.25, 0.12, 1.15, 1.3);          // bright, warm, punchy, saturated
const dark = scene(0.62, -0.1, 0.7, 0.55);         // dark, cool, flat, muted
const refS = measure(ref), darkS = measure(dark);
ok(refS.p50 > darkS.p50 + 0.12 && refS.tb < darkS.tb && refS.sat > darkS.sat, "the two scenes really differ (brightness, cast, saturation)", { refS, darkS });

const base = { ...NEUTRAL } as Adjustments;
const delta = solveMatch(dark, base, refS, base, DEFAULT_MATCH);
ok(Object.keys(delta).length >= 4, "a solve produces several adjustments", delta);
const matched = statsOf(dark, layerAdjust(base, delta, 1, "match"));
const before = dist(darkS, refS), after = dist(matched, refS);
ok(after < before * 0.45, "full match gets more than twice as close to the reference", { before, after });
ok(Math.abs(matched.p50 - refS.p50) < 0.05, "median brightness lands near the reference", { m: matched.p50, r: refS.p50 });
ok(Math.abs(matched.tb - refS.tb) < Math.abs(darkS.tb - refS.tb) * 0.4, "colour cast moves toward the reference", { m: matched.tb, r: refS.tb, d: darkS.tb });
ok(matched.sat > darkS.sat + 0.05, "saturation rises toward the reference", { m: matched.sat, d: darkS.sat });

// partial intensity sits between the two
const half = statsOf(dark, layerAdjust(base, delta, 0.5, "match"));
ok(dist(half, refS) < before && dist(half, refS) > after, "50% intensity lands between untouched and fully matched", { before, half: dist(half, refS), after });

// toggles are respected
const onlyTone = solveMatch(dark, base, refS, base, { tone: true, exposure: false, contrast: false, saturation: false, shadowsHighlights: false, grading: false });
ok(Object.keys(onlyTone).every((k) => k === "temperature" || k === "tint"), "colour-tone-only touches only temperature and tint", onlyTone);
const none = solveMatch(dark, base, refS, base, { tone: false, exposure: false, contrast: false, saturation: false, shadowsHighlights: false, grading: false });
ok(Object.keys(none).length === 0, "everything off → nothing applied", none);
const noSat = solveMatch(dark, base, refS, base, { ...DEFAULT_MATCH, saturation: false });
ok(noSat.saturation === undefined, "saturation off → no saturation change");

// a photo that already matches stays put
const self = solveMatch(ref, base, refS, base, DEFAULT_MATCH);
ok(Object.values(self).every((v) => typeof v !== "number" || Math.abs(v) < 3), "matching a photo to itself changes (almost) nothing", self);

// the reference's grading rides along when asked
const refAdj = { ...base, grade: { sh: [200, 40, 0], mid: [0, 0, 0], hi: [30, 30, 0], bal: 0 }, hsl: { orange: [10, 20, 0] } } as Adjustments;
const withGrade = solveMatch(dark, base, refS, refAdj, DEFAULT_MATCH);
ok(!!withGrade.grade && !!withGrade.hsl, "reference colour grading and HSL carry over", withGrade);
const noGrade = solveMatch(dark, base, refS, refAdj, { ...DEFAULT_MATCH, grading: false });
ok(!noGrade.grade && !noGrade.hsl, "…and stay behind when 'reference grading' is off");

// the target's own edits are respected: solving on top of an already-brightened photo needs less exposure
const brightened = { ...base, exposure: 40 } as Adjustments;
const d2 = solveMatch(dark, brightened, refS, base, DEFAULT_MATCH);
ok((d2.exposure ?? 0) < (delta.exposure ?? 0) - 5, "existing edits are accounted for", { d2: d2.exposure, d1: delta.exposure });

// texture is never matched: a vignette on the reference doesn't darken the result
const vig = { ...base, vignette: 80, grain: 50 } as Adjustments;
const rv = statsOf(ref, vig), rn = statsOf(ref, base);
ok(Math.abs(rv.p50 - rn.p50) < 0.001, "vignette and grain are ignored when measuring the reference");
// moderate differences produce moderate moves, never sliders pinned at their limits
const warmish = scene(1.0, 0.07, 1.0, 1.0), plain = scene(0.9, -0.02, 0.95, 0.9);
const mild = solveMatch(plain, base, measure(warmish), base, DEFAULT_MATCH);
ok(Object.values(mild).every((v) => typeof v !== "number" || Math.abs(v) < 40), "a mild difference gives mild adjustments", mild);
const extreme = solveMatch(dark, base, refS, base, DEFAULT_MATCH);
ok(Object.values(extreme).filter((v) => typeof v === "number" && Math.abs(v as number) >= 99).length <= 1, "even a big difference leaves most sliders off their limits", extreme);
void processRaster;
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
