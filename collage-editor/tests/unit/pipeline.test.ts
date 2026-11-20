import { applyAdjustments, NEUTRAL, isNeutral, layerAdjust, effectiveAdjustments, fillEffective, buildLut, curveAt, adjustmentsKey, FILTER_PRESETS } from "../../src/lib/filters";
import type { Adjustments } from "../../src/lib/types";

let pass = 0, fail = 0;
const ok = (c: boolean, m: string, extra?: unknown) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + m + (c || extra === undefined ? "" : "  → " + JSON.stringify(extra))); };

/** run the real pixel loop over a list of RGB pixels */
function run(pixels: [number, number, number][], adj: Partial<Adjustments> & Record<string, unknown>): [number, number, number][] {
  const w = pixels.length, h = 1;
  const data = new Uint8ClampedArray(w * 4);
  pixels.forEach((p, i) => { data[i * 4] = p[0]; data[i * 4 + 1] = p[1]; data[i * 4 + 2] = p[2]; data[i * 4 + 3] = 255; });
  const ctx = { getImageData: () => ({ data, width: w, height: h }), putImageData: () => {} } as unknown as CanvasRenderingContext2D;
  applyAdjustments(ctx, w, h, { ...NEUTRAL, ...adj } as Adjustments, 1);
  return pixels.map((_, i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
}
const lum = (p: number[]) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
const sat = (p: number[]) => { const mx = Math.max(...p), mn = Math.min(...p); return mx === 0 ? 0 : (mx - mn) / mx; };

const dark: [number, number, number] = [40, 40, 40], mid: [number, number, number] = [128, 128, 128], bright: [number, number, number] = [220, 220, 220];
// neutral
ok(isNeutral({ ...NEUTRAL }), "default adjustments are neutral");
ok(isNeutral({ exposure: 0 } as Adjustments), "old-format adjustments (new keys missing) are neutral");
const same = run([dark, mid, bright], {});
ok(same[0][0] === 40 && same[2][0] === 220, "neutral leaves pixels untouched");

// whites / blacks
const w1 = run([dark, mid, bright], { whites: 100 });
ok(w1[2][0] - 220 > 12 && Math.abs(w1[0][0] - 40) < 3, "whites + brightens the bright end only", w1);
const w2 = run([dark, mid, bright], { whites: -100 });
ok(220 - w2[2][0] > 12 && Math.abs(w2[0][0] - 40) < 3, "whites − pulls the bright end down", w2);
const b1 = run([dark, mid, bright], { blacks: 100 });
ok(b1[0][0] - 40 > 12 && Math.abs(b1[2][0] - 220) < 3, "blacks + lifts the dark end only", b1);
const b2 = run([dark, mid, bright], { blacks: -100 });
ok(40 - b2[0][0] > 6 && Math.abs(b2[2][0] - 220) < 3, "blacks − crushes the dark end", b2);

// vibrance protects vivid colour
const muted: [number, number, number] = [140, 120, 110], vivid: [number, number, number] = [250, 30, 40];
const v = run([muted, vivid], { vibrance: 80 });
const dm = sat(v[0]) - sat(muted), dv = sat(v[1]) - sat(vivid);
ok(dm > 0.05 && dm > dv * 3, "vibrance lifts muted colour far more than vivid colour", { dm, dv });
const plain = run([muted, vivid], { saturation: 80 });
ok(sat(plain[1]) >= sat(vivid) - 0.001 && sat(v[1]) <= sat(plain[1]) + 0.001, "vibrance is gentler than saturation on vivid colour");

// HSL touches only its own colour
const red: [number, number, number] = [200, 50, 50], blue: [number, number, number] = [50, 70, 200];
const hs = run([red, blue], { hsl: { red: [0, -100, 0] } });
ok(sat(hs[0]) < sat(red) * 0.4, "HSL red saturation −100 desaturates red", { before: sat(red), after: sat(hs[0]) });
ok(Math.abs(hs[1][0] - blue[0]) + Math.abs(hs[1][1] - blue[1]) + Math.abs(hs[1][2] - blue[2]) <= 6, "…and leaves blue alone", hs[1]);
const hl = run([red, blue], { hsl: { red: [0, 0, 60] } });
ok(lum(hl[0]) > lum(red) + 8, "HSL red luminance + brightens red", { before: lum(red), after: lum(hl[0]) });
const orange: [number, number, number] = [220, 130, 40];
const hh = run([orange], { hsl: { orange: [100, 0, 0] } });
ok(hh[0][1] > orange[1] + 10, "HSL orange hue shift moves the colour toward yellow", hh[0]);

// curves
const cm = run([dark, mid, bright], { curves: { m: [[0, 0], [128, 64], [255, 255]] } });
ok(cm[1][0] < 80 && cm[1][0] > 50, "master curve (128→64) darkens midtones", cm);
const ends = run([[0, 0, 0], [255, 255, 255]], { curves: { m: [[0, 0], [128, 64], [255, 255]] } });
ok(ends[0][0] === 0 && ends[1][0] === 255, "…with pure black and white anchored", ends);
const cr = run([mid], { curves: { r: [[0, 0], [128, 200], [255, 255]] } });
ok(cr[0][0] > 170 && Math.abs(cr[0][1] - 128) <= 2, "red curve moves only the red channel", cr);
ok(Math.abs(curveAt([[0, 0], [255, 255]], 100) - 100) < 1, "an identity curve is the identity");
const lut = buildLut([[0, 0], [64, 200], [192, 60], [255, 255]]);
let mono = true; for (let i = 1; i < 256; i++) if (lut[i] < lut[i - 1] - 0.08) mono = false;
ok(lut[0] >= 0 && lut[255] <= 1, "curve output stays within 0..1", [lut[0], lut[255]]);

// colour grading
const g = run([dark, mid, bright], { grade: { sh: [200, 70, 0], mid: [0, 0, 0], hi: [30, 70, 0], bal: 0 } });
ok(g[0][2] > g[0][0] + 4, "shadows graded teal-blue push blue over red in the darks", g[0]);
ok(g[2][0] > g[2][2] + 4, "highlights graded orange push red over blue in the brights", g[2]);
ok(Math.abs(g[1][0] - g[1][2]) < Math.abs(g[0][2] - g[0][0]), "midtones stay almost untouched", g[1]);
const gl = run([mid], { grade: { sh: [0, 0, 0], mid: [0, 0, 60], hi: [0, 0, 0], bal: 0 } });
ok(gl[0][0] > 128 + 6, "a midtone luminance offset brightens midtones", gl);

// layering
const L = layerAdjust({ ...NEUTRAL, exposure: 10 }, { exposure: 20, grade: { sh: [200, 40, 0], mid: [0, 0, 0], hi: [0, 0, 0], bal: 0 }, hsl: { red: [10, 0, 0] } }, 0.5, "match");
ok(L.exposure === 20, "layer adds numbers scaled by strength", L.exposure);
ok(Math.round(L.grade!.sh[1]) === 20 && L.hsl!.red![0] === 5, "layer scales grading and HSL", { g: L.grade!.sh, h: L.hsl!.red });
const L2 = layerAdjust({ ...NEUTRAL }, { curves: { m: [[0, 0], [128, 64], [255, 255]] } }, 1, "match");
ok(Math.abs(curveAt(L2.curves!.m, 128) - 64) < 3, "curves compose through the layer", curveAt(L2.curves!.m, 128));
const L3 = layerAdjust({ ...NEUTRAL }, { curves: { m: [[0, 0], [128, 64], [255, 255]] } }, 0, "match");
ok(L3.curves === undefined, "zero strength changes nothing");
const e = effectiveAdjustments({ ...NEUTRAL, contrast: 10 }, { id: "teal-orange", intensity: 100 });
ok(e.contrast === 26 && !!e.grade && e.grade.sh[1] > 0, "grading presets layer on top of manual edits", { c: e.contrast, g: e.grade });
const half = effectiveAdjustments({ ...NEUTRAL }, { id: "teal-orange", intensity: 50 });
ok(Math.abs(half.grade!.sh[1] - 23) < 1, "preset intensity scales grading too", half.grade!.sh);
const fe = fillEffective({ assetId: "a", kind: "image", zoom: 1, fx: .5, fy: .5, flipX: false, flipY: false, rotation90: 0, adjustments: { ...NEUTRAL, exposure: 5 }, filter: { id: "original", intensity: 100 }, match: { ref: "r", intensity: 50, adj: { exposure: 20 } } });
ok(fe.exposure === 15, "fillEffective = manual + filter + match × intensity", fe.exposure);
ok(adjustmentsKey({ ...NEUTRAL, exposure: 5 }) !== adjustmentsKey({ ...NEUTRAL, exposure: 5, hsl: { red: [0, 10, 0] } }), "cache key changes with HSL");
ok(adjustmentsKey({ ...NEUTRAL, curves: { m: [[0, 0], [128, 90], [255, 255]] } }) !== adjustmentsKey({ ...NEUTRAL }), "cache key changes with curves");
ok(FILTER_PRESETS.length === 20 && FILTER_PRESETS.filter((p) => p.adj.grade).length === 4, "20 presets, 4 of them graded");
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
