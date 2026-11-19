import type { Adjustments, FilterRef, MediaFill } from "./types";
import { clamp } from "./util";

/**
 * Non-destructive photo/video look pipeline.
 * Adjustments + a filter preset are *parameters* stored on the element; pixels are only produced at draw
 * time (and at export time, from the original). The same function colours photos and every video frame.
 */

export const NEUTRAL: Adjustments = {
  exposure: 0, brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0,
  highlights: 0, shadows: 0, hue: 0, sharpness: 0, blur: 0, grayscale: 0, sepia: 0,
  fade: 0, vignette: 0, grain: 0,
};

export const ADJUSTMENT_META: { key: keyof Adjustments; label: string; min: number; max: number; group: "light" | "color" | "detail" | "effect" }[] = [
  { key: "exposure", label: "Exposure", min: -100, max: 100, group: "light" },
  { key: "brightness", label: "Brightness", min: -100, max: 100, group: "light" },
  { key: "contrast", label: "Contrast", min: -100, max: 100, group: "light" },
  { key: "highlights", label: "Highlights", min: -100, max: 100, group: "light" },
  { key: "shadows", label: "Shadows", min: -100, max: 100, group: "light" },
  { key: "saturation", label: "Saturation", min: -100, max: 100, group: "color" },
  { key: "temperature", label: "Temperature", min: -100, max: 100, group: "color" },
  { key: "tint", label: "Tint", min: -100, max: 100, group: "color" },
  { key: "hue", label: "Hue", min: -180, max: 180, group: "color" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, group: "color" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, group: "color" },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, group: "detail" },
  { key: "blur", label: "Blur", min: 0, max: 100, group: "detail" },
  { key: "fade", label: "Fade", min: 0, max: 100, group: "effect" },
  { key: "vignette", label: "Vignette", min: 0, max: 100, group: "effect" },
  { key: "grain", label: "Grain", min: 0, max: 100, group: "effect" },
];

export interface FilterPreset { id: string; name: string; adj: Partial<Adjustments> }

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
  { id: "vivid", name: "Vivid", adj: { saturation: 44, contrast: 14, exposure: 4, highlights: -6 } },
  { id: "minimal", name: "Minimal", adj: { saturation: -34, contrast: -6, brightness: 6, fade: 10 } },
  { id: "editorial", name: "Editorial", adj: { contrast: 18, saturation: -16, temperature: -4, shadows: 10, highlights: -8, fade: 6 } },
];

export const presetById = (id: string) => FILTER_PRESETS.find((p) => p.id === id) ?? FILTER_PRESETS[0];

export function isNeutral(a: Adjustments): boolean {
  for (const k in NEUTRAL) if (a[k as keyof Adjustments] !== 0) return false;
  return true;
}

/** manual adjustments + preset × intensity → the numbers the pixel loop actually uses */
export function effectiveAdjustments(adj: Adjustments, filter: FilterRef): Adjustments {
  if (filter.id === "original" || filter.intensity <= 0) return adj;
  const p = presetById(filter.id).adj;
  const t = filter.intensity / 100;
  const out = { ...adj };
  for (const k in p) {
    const key = k as keyof Adjustments;
    const add = (p[key] ?? 0) * t;
    if (key === "grayscale" || key === "sepia") out[key] = clamp(Math.max(adj[key], add), 0, 100);
    else out[key] = adj[key] + add;
  }
  return out;
}

export const fillEffective = (f: MediaFill) => effectiveAdjustments(f.adjustments, f.filter);
export const fillIsNeutral = (f: MediaFill) => isNeutral(fillEffective(f));

export function adjustmentsKey(a: Adjustments): string {
  let s = "";
  for (const k in NEUTRAL) {
    const v = a[k as keyof Adjustments];
    if (v) s += `${k}:${Math.round(v * 10) / 10};`;
  }
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

export function applyAdjustments(ctx: CanvasRenderingContext2D, w: number, h: number, a: Adjustments, seed = 1) {
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
  const br = (a.brightness / 100) * 0.5;
  const c = a.contrast / 100;
  const cf = c >= 0 ? 1 + c * 1.1 : 1 + c;
  const sat = 1 + a.saturation / 100;
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
  const cx = w / 2, cy = h / 2;
  const maxD = Math.hypot(cx, cy);
  let rnd = (seed * 2654435761) >>> 0;

  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i += 4) {
      let r = (d[i] / 255) * rg;
      let g = (d[i + 1] / 255) * gg;
      let b = (d[i + 2] / 255) * bg;

      if (sh !== 0 || hl !== 0) {
        const l0 = clamp(0.2126 * r + 0.7152 * g + 0.0722 * b, 0, 1);
        const delta = sh * 0.3 * (1 - l0) * (1 - l0) + hl * 0.3 * l0 * l0;
        r += delta; g += delta; b += delta;
      }
      if (br !== 0) { r += br; g += br; b += br; }
      if (cf !== 1) { r = (r - 0.5) * cf + 0.5; g = (g - 0.5) * cf + 0.5; b = (b - 0.5) * cf + 0.5; }
      if (fade > 0) { r = fade + r * (1 - fade); g = fade + g * (1 - fade); b = fade + b * (1 - fade); }
      if (sat !== 1 || gray > 0 || sep > 0) {
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (sat !== 1) { r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
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
