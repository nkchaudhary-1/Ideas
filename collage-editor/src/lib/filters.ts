import type { AdjustDelta, Adjustments, Curves, CurvePts, FilterRef, Grade, HslKey, MediaFill, ToneKey, Tri, Wheel } from "./types";
import { clamp } from "./util";

/**
 * Non-destructive photo/video look pipeline.
 * Adjustments + a filter preset (+ an optional "match look" layer) are *parameters* stored on the element; pixels are
 * only produced at draw time (and at export time, from the original). The same function colours photos and every
 * video frame.
 */

export const NEUTRAL: Adjustments = {
  exposure: 0, brightness: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  saturation: 0, vibrance: 0, temperature: 0, tint: 0, hue: 0,
  sharpness: 0, blur: 0, grayscale: 0, sepia: 0, fade: 0, vignette: 0, grain: 0,
};
const TONE_KEYS = Object.keys(NEUTRAL) as ToneKey[];

export const ADJUSTMENT_META: { key: ToneKey; label: string; min: number; max: number; group: "light" | "color" | "detail" | "effect" }[] = [
  { key: "exposure", label: "Exposure", min: -100, max: 100, group: "light" },
  { key: "brightness", label: "Brightness", min: -100, max: 100, group: "light" },
  { key: "contrast", label: "Contrast", min: -100, max: 100, group: "light" },
  { key: "highlights", label: "Highlights", min: -100, max: 100, group: "light" },
  { key: "shadows", label: "Shadows", min: -100, max: 100, group: "light" },
  { key: "whites", label: "Whites", min: -100, max: 100, group: "light" },
  { key: "blacks", label: "Blacks", min: -100, max: 100, group: "light" },
  { key: "temperature", label: "Temperature", min: -100, max: 100, group: "color" },
  { key: "tint", label: "Tint", min: -100, max: 100, group: "color" },
  { key: "saturation", label: "Saturation", min: -100, max: 100, group: "color" },
  { key: "vibrance", label: "Vibrance", min: -100, max: 100, group: "color" },
  { key: "hue", label: "Hue", min: -180, max: 180, group: "color" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, group: "color" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, group: "color" },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, group: "detail" },
  { key: "blur", label: "Blur", min: 0, max: 100, group: "detail" },
  { key: "fade", label: "Fade", min: 0, max: 100, group: "effect" },
  { key: "grain", label: "Grain", min: 0, max: 100, group: "effect" },
  { key: "vignette", label: "Vignette", min: 0, max: 100, group: "effect" },
];

/** the eight HSL colour bands (centre hue in degrees) */
export const HSL_BANDS: { key: HslKey; label: string; hue: number; swatch: string }[] = [
  { key: "red", label: "Red", hue: 0, swatch: "#e5483f" },
  { key: "orange", label: "Orange", hue: 30, swatch: "#f08a2c" },
  { key: "yellow", label: "Yellow", hue: 60, swatch: "#ecc938" },
  { key: "green", label: "Green", hue: 120, swatch: "#4cb35a" },
  { key: "aqua", label: "Aqua", hue: 180, swatch: "#36bfc4" },
  { key: "blue", label: "Blue", hue: 230, swatch: "#3f6fe0" },
  { key: "purple", label: "Purple", hue: 275, swatch: "#8a54d6" },
  { key: "magenta", label: "Magenta", hue: 320, swatch: "#d44fa0" },
];

export const NEUTRAL_WHEEL: Wheel = [0, 0, 0];
export const NEUTRAL_GRADE: Grade = { sh: [...NEUTRAL_WHEEL], mid: [...NEUTRAL_WHEEL], hi: [...NEUTRAL_WHEEL], bal: 0 };
export const IDENTITY_CURVE: CurvePts = [[0, 0], [255, 255]];

export interface FilterPreset { id: string; name: string; adj: AdjustDelta }

/** Real parameter sets, applied at the chosen intensity on top of the manual adjustments. */
export const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", name: "Original", adj: {} },
  { id: "natural", name: "Natural", adj: { contrast: 8, saturation: 7, shadows: 14, highlights: -10, exposure: 3 } },
  { id: "warm", name: "Warm", adj: { temperature: 30, tint: 5, saturation: 8, brightness: 2 } },
  { id: "cool", name: "Cool", adj: { temperature: -30, tint: -5, saturation: 4, contrast: 4 } },
  { id: "vintage", name: "Vintage", adj: { temperature: 16, saturation: -20, contrast: -8, fade: 32, sepia: 20, vignette: 24, grain: 14 } },
  { id: "film", name: "Film", adj: { contrast: 14, saturation: -8, fade: 18, temperature: 6, grain: 24, highlights: -14, shadows: 16 } },
  { id: "cinematic", name: "Cinematic", adj: { contrast: 24, saturation: -8, temperature: -12, tint: 8, vignette: 32, fade: 10, shadows: -8 } },
  { id: "moody", name: "Moody", adj: { exposure: -16, contrast: 20, saturation: -18, temperature: -8, shadows: -14, vignette: 34 } },
  { id: "bw", name: "Black & White", adj: { grayscale: 100, contrast: 14, fade: 4 } },
  { id: "contrast", name: "High Contrast", adj: { contrast: 44, saturation: 12, shadows: -16, highlights: 8 } },
  { id: "soft", name: "Soft", adj: { contrast: -14, brightness: 6, fade: 14, saturation: -4, highlights: -12 } },
  { id: "faded", name: "Faded", adj: { fade: 44, contrast: -16, saturation: -14, brightness: 4 } },
  { id: "retro", name: "Retro", adj: { temperature: 24, saturation: -12, sepia: 28, fade: 28, contrast: 6, vignette: 18, grain: 18 } },
  { id: "vivid", name: "Vivid", adj: { saturation: 44, vibrance: 20, contrast: 14, exposure: 4, highlights: -6 } },
  { id: "minimal", name: "Minimal", adj: { saturation: -34, contrast: -6, brightness: 6, fade: 10 } },
  { id: "editorial", name: "Editorial", adj: { contrast: 18, saturation: -16, temperature: -4, shadows: 10, highlights: -8, fade: 6 } },
  // presets that use the colour-grading wheels
  { id: "teal-orange", name: "Teal & Orange", adj: { contrast: 16, vibrance: 14, grade: { sh: [195, 46, -4], mid: [28, 12, 0], hi: [34, 52, 2], bal: 0 } } },
  { id: "golden", name: "Golden Hour", adj: { temperature: 22, exposure: 4, highlights: -12, shadows: 12, vibrance: 12, grade: { sh: [18, 16, 0], mid: [36, 14, 0], hi: [42, 38, 3], bal: 6 } } },
  { id: "night", name: "Night Blue", adj: { exposure: -10, contrast: 18, saturation: -8, blacks: -10, grade: { sh: [226, 44, -6], mid: [220, 14, 0], hi: [200, 18, 0], bal: -10 } } },
  { id: "matte", name: "Matte", adj: { blacks: 38, contrast: -8, fade: 14, saturation: -10, grade: { sh: [210, 14, 0], mid: [0, 0, 0], hi: [38, 12, 0], bal: 0 } } },
];

export const presetById = (id: string) => FILTER_PRESETS.find((p) => p.id === id) ?? FILTER_PRESETS[0];

// ───────────────────────── curves ─────────────────────────

export function curveActive(p: CurvePts | undefined): boolean {
  if (!p || p.length < 2) return false;
  if (p.length === 2 && p[0][0] === 0 && p[0][1] === 0 && p[1][0] === 255 && p[1][1] === 255) return false;
  return true;
}
export const curvesActive = (c: Curves | undefined) => !!c && (curveActive(c.m) || curveActive(c.r) || curveActive(c.g) || curveActive(c.b));

/** monotone cubic through the control points → 256 output values in 0..1 (no overshoot, so curves never invert) */
export function buildLut(pts: CurvePts): Float32Array {
  const p = [...pts].sort((a, b) => a[0] - b[0]);
  if (p[0][0] > 0) p.unshift([0, p[0][1]]);
  if (p[p.length - 1][0] < 255) p.push([255, p[p.length - 1][1]]);
  const n = p.length;
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const dx: number[] = [], sl: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = Math.max(1e-6, xs[i + 1] - xs[i]); sl[i] = (ys[i + 1] - ys[i]) / dx[i]; }
  const t: number[] = new Array(n);
  t[0] = sl[0]; t[n - 1] = sl[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (sl[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / sl[i], b = t[i + 1] / sl[i];
    const s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); t[i] = tau * a * sl[i]; t[i + 1] = tau * b * sl[i]; }
  }
  const out = new Float32Array(256);
  let seg = 0;
  for (let x = 0; x < 256; x++) {
    while (seg < n - 2 && x > xs[seg + 1]) seg++;
    const h = dx[seg], u = (x - xs[seg]) / h;
    const u2 = u * u, u3 = u2 * u;
    const y = (2 * u3 - 3 * u2 + 1) * ys[seg] + (u3 - 2 * u2 + u) * h * t[seg] + (-2 * u3 + 3 * u2) * ys[seg + 1] + (u3 - u2) * h * t[seg + 1];
    out[x] = clamp(y, 0, 255) / 255;
  }
  return out;
}

/** evaluate a curve at x (0..255) */
export function curveAt(pts: CurvePts | undefined, x: number): number {
  if (!curveActive(pts)) return x;
  return buildLut(pts!)[clamp(Math.round(x), 0, 255)] * 255;
}

/** `base` followed by `add` blended in at strength k, resampled to a control-point list */
function composeCurve(base: CurvePts | undefined, add: CurvePts | undefined, k: number): CurvePts | undefined {
  if (!curveActive(add)) return base;
  const xs = [0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 255];
  return xs.map((x) => {
    const mid = x + (curveAt(add, x) - x) * k;
    return [x, Math.round(clamp(curveAt(base, mid), 0, 255) * 10) / 10] as [number, number];
  });
}

// ───────────────────────── layering ─────────────────────────

const wheelVec = (w: Wheel) => { const a = (w[0] * Math.PI) / 180; return [Math.cos(a) * w[1], Math.sin(a) * w[1]]; };
function addWheel(a: Wheel, b: Wheel, k: number): Wheel {
  const va = wheelVec(a), vb = wheelVec(b);
  const x = va[0] + vb[0] * k, y = va[1] + vb[1] * k;
  const s = Math.hypot(x, y);
  return [s > 0.01 ? (Math.atan2(y, x) * 180 / Math.PI + 360) % 360 : a[0], Math.min(100, s), a[2] + b[2] * k];
}
export function gradeActive(g: Grade | undefined): boolean {
  return !!g && [g.sh, g.mid, g.hi].some((w) => w[1] !== 0 || w[2] !== 0);
}
const hslActive = (h: Adjustments["hsl"]) => !!h && Object.values(h).some((t) => t && (t[0] || t[1] || t[2]));

/**
 * base + delta × k. Numbers add, HSL bands add, grading wheels add as colour vectors, curves compose.
 * "preset" keeps the long-standing rule that grayscale/sepia take the larger of the two instead of adding.
 */
export function layerAdjust(base: Adjustments, d: AdjustDelta, k: number, mode: "preset" | "match" = "preset"): Adjustments {
  if (k <= 0) return base;
  const out: Adjustments = { ...base };
  for (const key of TONE_KEYS) {
    const dv = d[key];
    if (dv === undefined) continue;
    const b = base[key] ?? 0;
    out[key] = mode === "preset" && (key === "grayscale" || key === "sepia") ? clamp(Math.max(b, dv * k), 0, 100) : b + dv * k;
  }
  if (d.hsl) {
    const hsl: NonNullable<Adjustments["hsl"]> = { ...(base.hsl ?? {}) };
    for (const key of Object.keys(d.hsl) as HslKey[]) {
      const t = d.hsl[key];
      if (!t) continue;
      const b: Tri = hsl[key] ?? [0, 0, 0];
      hsl[key] = [b[0] + t[0] * k, b[1] + t[1] * k, b[2] + t[2] * k];
    }
    out.hsl = hsl;
  }
  if (d.grade) {
    const g0 = base.grade ?? NEUTRAL_GRADE;
    out.grade = { sh: addWheel(g0.sh, d.grade.sh, k), mid: addWheel(g0.mid, d.grade.mid, k), hi: addWheel(g0.hi, d.grade.hi, k), bal: g0.bal + d.grade.bal * k };
  }
  if (d.curves) {
    const c = base.curves ?? {};
    out.curves = { m: composeCurve(c.m, d.curves.m, k), r: composeCurve(c.r, d.curves.r, k), g: composeCurve(c.g, d.curves.g, k), b: composeCurve(c.b, d.curves.b, k) };
  }
  return out;
}

export function isNeutral(a: Adjustments): boolean {
  for (const k of TONE_KEYS) if ((a[k] ?? 0) !== 0) return false;
  return !hslActive(a.hsl) && !gradeActive(a.grade) && !curvesActive(a.curves);
}

/** manual adjustments + preset × intensity → the numbers the pixel loop actually uses */
export function effectiveAdjustments(adj: Adjustments, filter: FilterRef): Adjustments {
  const base = { ...NEUTRAL, ...adj };
  if (filter.id === "original" || filter.intensity <= 0) return base;
  return layerAdjust(base, presetById(filter.id).adj, filter.intensity / 100, "preset");
}

/** manual + filter + match layer */
export function fillEffective(f: MediaFill): Adjustments {
  const withFilter = effectiveAdjustments(f.adjustments, f.filter);
  return f.match && f.match.intensity > 0 ? layerAdjust(withFilter, f.match.adj, f.match.intensity / 100, "match") : withFilter;
}
export const fillIsNeutral = (f: MediaFill) => isNeutral(fillEffective(f));

export function adjustmentsKey(a: Adjustments): string {
  let s = "";
  for (const k of TONE_KEYS) {
    const v = a[k];
    if (v) s += `${k}:${Math.round(v * 10) / 10};`;
  }
  if (hslActive(a.hsl)) s += `hsl:${JSON.stringify(a.hsl, (_k, v) => (typeof v === "number" ? Math.round(v * 10) / 10 : v))};`;
  if (gradeActive(a.grade)) s += `grade:${JSON.stringify(a.grade, (_k, v) => (typeof v === "number" ? Math.round(v * 10) / 10 : v))};`;
  if (curvesActive(a.curves)) s += `curves:${JSON.stringify(a.curves)};`;
  return s;
}

// ───────────────────────── pixel pass ─────────────────────────

function boxBlurPass(src: Uint8ClampedArray, dst: Uint8ClampedArray, w: number, h: number, r: number, horizontal: boolean) {
  const len = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const stride = horizontal ? 4 : w * 4;
  const lineStride = horizontal ? w * 4 : 4;
  const win = r * 2 + 1;
  for (let l = 0; l < lines; l++) {
    const base = l * lineStride;
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += src[base + clamp(i, 0, len - 1) * stride + c];
      for (let i = 0; i < len; i++) {
        dst[base + i * stride + c] = sum / win;
        const add = src[base + Math.min(len - 1, i + r + 1) * stride + c];
        const sub = src[base + Math.max(0, i - r) * stride + c];
        sum += add - sub;
      }
    }
  }
}

/** ~gaussian blur using three box passes in each direction */
function blurImageData(img: ImageData, radius: number): Uint8ClampedArray {
  const { width: w, height: h } = img;
  let a = new Uint8ClampedArray(img.data);
  let b = new Uint8ClampedArray(img.data.length);
  const r = Math.max(1, Math.round(radius / 1.7));
  for (let i = 0; i < 3; i++) {
    boxBlurPass(a, b, w, h, r, true);
    boxBlurPass(b, a, w, h, r, false);
  }
  return a;
}

const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/** the chroma direction of a hue (zero-mean RGB), used to tint a tonal range */
function hueVec(h: number, s: number): [number, number, number] {
  const f = (n: number) => { const k = (n + h / 60) % 6; return 1 - Math.max(0, Math.min(k, 4 - k, 1)); };
  const r = f(5), g = f(3), b = f(1), m = (r + g + b) / 3;
  const k = (s / 100) * 0.5;
  return [(r - m) * k, (g - m) * k, (b - m) * k];
}
const HSL_WIDTH = 45;
const _hsl = new Float64Array(3);
function hslToRgb(h: number, s: number, l: number, out: Float64Array) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; } else if (hp < 2) { r = x; g = c; } else if (hp < 3) { g = c; b = x; } else if (hp < 4) { g = x; b = c; } else if (hp < 5) { r = x; b = c; } else { r = c; b = x; }
  const m = l - c / 2;
  out[0] = r + m; out[1] = g + m; out[2] = b + m;
}

export function applyAdjustments(ctx: CanvasRenderingContext2D, w: number, h: number, input: Adjustments, seed = 1) {
  const a: Adjustments = { ...NEUTRAL, ...input };
  if (isNeutral(a)) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const ex = Math.pow(2, (a.exposure / 100) * 2);
  const t = a.temperature / 100;
  const ti = a.tint / 100;
  const rg = ex * (1 + t * 0.28 + ti * 0.06);
  const gg = ex * (1 - ti * 0.22);
  const bg = ex * (1 - t * 0.32 + ti * 0.06);
  const hl = a.highlights / 100;
  const sh = a.shadows / 100;
  const wh = a.whites / 100;
  const bk = a.blacks / 100;
  const br = (a.brightness / 100) * 0.5;
  const c = a.contrast / 100;
  const cf = c >= 0 ? 1 + c * 1.1 : 1 + c;
  const sat = 1 + a.saturation / 100;
  const vib = a.vibrance / 100;
  const fade = (a.fade / 100) * 0.18;
  const gray = a.grayscale / 100;
  const sep = a.sepia / 100;
  const vig = a.vignette / 100;
  const grain = (a.grain / 100) * 0.09;
  const rad = (a.hue * Math.PI) / 180;
  const hueOn = a.hue !== 0;
  const cosH = Math.cos(rad);
  const sinH = Math.sin(rad);
  // hue rotation (preserves luminance), standard matrix
  const m00 = 0.213 + cosH * 0.787 - sinH * 0.213, m01 = 0.715 - cosH * 0.715 - sinH * 0.715, m02 = 0.072 - cosH * 0.072 + sinH * 0.928;
  const m10 = 0.213 - cosH * 0.213 + sinH * 0.143, m11 = 0.715 + cosH * 0.285 + sinH * 0.14, m12 = 0.072 - cosH * 0.072 - sinH * 0.283;
  const m20 = 0.213 - cosH * 0.213 - sinH * 0.787, m21 = 0.715 - cosH * 0.715 + sinH * 0.715, m22 = 0.072 + cosH * 0.928 + sinH * 0.072;

  // RGB curves: one lookup per channel (channel curve, then the master curve)
  let lutR: Float32Array | null = null, lutG: Float32Array | null = null, lutB: Float32Array | null = null;
  if (curvesActive(a.curves)) {
    const cv = a.curves!;
    const M = curveActive(cv.m) ? buildLut(cv.m!) : null;
    const mk = (pts: CurvePts | undefined) => {
      const own = curveActive(pts) ? buildLut(pts!) : null;
      const o = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const v = own ? own[i] : i / 255; o[i] = M ? M[Math.round(clamp(v, 0, 1) * 255)] : v; }
      return o;
    };
    lutR = mk(cv.r); lutG = mk(cv.g); lutB = mk(cv.b);
  }
  // HSL bands that actually do something
  const bands = hslActive(a.hsl) ? HSL_BANDS.map((b) => ({ c: b.hue, v: (a.hsl![b.key] ?? [0, 0, 0]) as Tri })).filter((b) => b.v[0] || b.v[1] || b.v[2]) : [];
  // colour grading wheels → a tint vector and a luminance offset per tonal range
  const grading = gradeActive(a.grade);
  const gv = grading ? [hueVec(a.grade!.sh[0], a.grade!.sh[1]), hueVec(a.grade!.mid[0], a.grade!.mid[1]), hueVec(a.grade!.hi[0], a.grade!.hi[1])] : null;
  const gl = grading ? [a.grade!.sh[2] / 100 * 0.2, a.grade!.mid[2] / 100 * 0.2, a.grade!.hi[2] / 100 * 0.2] : null;
  const gbal = grading ? (a.grade!.bal / 100) * 0.25 : 0;

  const cx = w / 2, cy = h / 2;
  const maxD = Math.hypot(cx, cy);
  let rnd = (seed * 2654435761) >>> 0;

  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i += 4) {
      let r = (d[i] / 255) * rg;
      let g = (d[i + 1] / 255) * gg;
      let b = (d[i + 2] / 255) * bg;

      if (sh !== 0 || hl !== 0 || wh !== 0 || bk !== 0) {
        const l0 = clamp(0.2126 * r + 0.7152 * g + 0.0722 * b, 0, 1);
        const inv = 1 - l0;
        const delta = sh * 0.3 * inv * inv + hl * 0.3 * l0 * l0 + wh * 0.28 * l0 * l0 * l0 + bk * 0.28 * inv * inv * inv;
        r += delta; g += delta; b += delta;
      }
      if (br !== 0) { r += br; g += br; b += br; }
      if (cf !== 1) { r = (r - 0.5) * cf + 0.5; g = (g - 0.5) * cf + 0.5; b = (b - 0.5) * cf + 0.5; }
      if (fade > 0) { r = fade + r * (1 - fade); g = fade + g * (1 - fade); b = fade + b * (1 - fade); }
      if (lutR) {
        r = lutR[(clamp(r, 0, 1) * 255 + 0.5) | 0];
        g = lutG![(clamp(g, 0, 1) * 255 + 0.5) | 0];
        b = lutB![(clamp(b, 0, 1) * 255 + 0.5) | 0];
      }
      if (sat !== 1 || gray > 0 || sep > 0 || vib !== 0) {
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (sat !== 1) { r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
        if (vib !== 0) {
          // vibrance: lift muted colours more than vivid ones, and go easy on skin tones
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          const skin = r > g && g > b && r - b > 0.05 ? 0.55 : 1;
          const f = 1 + vib * (1 - clamp(mx - mn, 0, 1)) * skin;
          const l2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          r = l2 + (r - l2) * f; g = l2 + (g - l2) * f; b = l2 + (b - l2) * f;
        }
        if (gray > 0) { r += (l - r) * gray; g += (l - g) * gray; b += (l - b) * gray; }
        if (sep > 0) {
          const sr = r * 0.393 + g * 0.769 + b * 0.189;
          const sg = r * 0.349 + g * 0.686 + b * 0.168;
          const sb = r * 0.272 + g * 0.534 + b * 0.131;
          r += (sr - r) * sep; g += (sg - g) * sep; b += (sb - b) * sep;
        }
      }
      if (hueOn) {
        const nr = r * m00 + g * m01 + b * m02;
        const ng = r * m10 + g * m11 + b * m12;
        const nb = r * m20 + g * m21 + b * m22;
        r = nr; g = ng; b = nb;
      }
      if (bands.length) {
        r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn;
        if (dl > 0.02) {
          let hue = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4;
          hue *= 60;
          if (hue < 0) hue += 360;
          const lum = (mx + mn) / 2;
          const den = 1 - Math.abs(2 * lum - 1);
          const s0 = den > 1e-6 ? dl / den : 0;
          let dh = 0, ds = 0, dlm = 0;
          for (let k = 0; k < bands.length; k++) {
            let dist = Math.abs(hue - bands[k].c);
            if (dist > 180) dist = 360 - dist;
            if (dist < HSL_WIDTH) {
              const wgt = 0.5 * (1 + Math.cos((Math.PI * dist) / HSL_WIDTH));
              dh += wgt * bands[k].v[0]; ds += wgt * bands[k].v[1]; dlm += wgt * bands[k].v[2];
            }
          }
          if (dh !== 0 || ds !== 0 || dlm !== 0) {
            const sw = Math.min(1, s0 * 4);
            hslToRgb(hue + dh * 0.3 * sw, clamp(s0 * (1 + (ds / 100) * sw), 0, 1), clamp(lum + (dlm / 100) * 0.25 * sw, 0, 1), _hsl);
            r = _hsl[0]; g = _hsl[1]; b = _hsl[2];
          }
        }
      }
      if (gv) {
        const lb = clamp(0.2126 * r + 0.7152 * g + 0.0722 * b - gbal, 0, 1);
        const ws = 1 - smooth(0.05, 0.6, lb);
        const wh2 = smooth(0.4, 0.95, lb);
        const wm = Math.max(0, 1 - ws - wh2);
        const lo = ws * gl![0] + wm * gl![1] + wh2 * gl![2];
        r += ws * gv[0][0] + wm * gv[1][0] + wh2 * gv[2][0] + lo;
        g += ws * gv[0][1] + wm * gv[1][1] + wh2 * gv[2][1] + lo;
        b += ws * gv[0][2] + wm * gv[1][2] + wh2 * gv[2][2] + lo;
      }
      if (vig > 0) {
        const dist = Math.hypot(x - cx, y - cy) / maxD;
        const f = 1 - vig * 0.85 * Math.max(0, dist - 0.3) * 1.43 * dist;
        r *= f; g *= f; b *= f;
      }
      if (grain > 0) {
        rnd ^= rnd << 13; rnd >>>= 0; rnd ^= rnd >>> 17; rnd ^= rnd << 5; rnd >>>= 0;
        const n = ((rnd & 1023) / 1023 - 0.5) * grain;
        r += n; g += n; b += n;
      }
      d[i] = r * 255;
      d[i + 1] = g * 255;
      d[i + 2] = b * 255;
    }
  }

  if (a.blur > 0) {
    const radius = Math.max(1, (a.blur / 100) * Math.max(w, h) * 0.03);
    const blurred = blurImageData(img, radius);
    d.set(blurred);
  } else if (a.sharpness > 0) {
    const radius = Math.max(1, Math.max(w, h) / 900);
    const blurred = blurImageData(img, radius * 1.6);
    const amt = (a.sharpness / 100) * 1.6;
    for (let i = 0; i < d.length; i += 4) {
      d[i] += (d[i] - blurred[i]) * amt;
      d[i + 1] += (d[i + 1] - blurred[i + 1]) * amt;
      d[i + 2] += (d[i + 2] - blurred[i + 2]) * amt;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export type Drawable = CanvasImageSource & { width?: number; height?: number };

/** Draw `src` at (maxDim-capped) size into a fresh canvas and colour it. */
export function renderAdjusted(src: CanvasImageSource, sw: number, sh: number, a: Adjustments, maxDim: number, seed = 1): HTMLCanvasElement {
  const k = Math.min(1, maxDim / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * k));
  const h = Math.max(1, Math.round(sh * k));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  applyAdjustments(ctx, w, h, a, seed);
  return cv;
}
