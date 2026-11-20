import { applyAdjustments, layerAdjust, NEUTRAL } from "./filters";
import type { AdjustDelta, Adjustments, Asset } from "./types";

/**
 * Match Look: measure how a reference photo looks (brightness, contrast spread, colour cast, saturation) and
 * solve a small set of adjustments that move another photo toward it. The solve runs through the real pixel
 * pipeline on tiny thumbnails, so what it finds is what the canvas and the export will show.
 */

export interface Raster { data: Uint8ClampedArray; w: number; h: number }
export interface LookStats { mean: number; std: number; p5: number; p50: number; p95: number; sat: number; tb: number; tint: number }
export interface MatchOpts { tone: boolean; exposure: boolean; contrast: boolean; saturation: boolean; shadowsHighlights: boolean; grading: boolean }
export const DEFAULT_MATCH: MatchOpts = { tone: true, exposure: true, contrast: true, saturation: true, shadowsHighlights: true, grading: true };

/** blur, sharpness, grain and vignette describe texture, not colour: never match them */
const flat = (a: Adjustments): Adjustments => ({ ...NEUTRAL, ...a, blur: 0, sharpness: 0, grain: 0, vignette: 0 });

/** run the real pixel loop on a copy of `src` (works with a plain pixel buffer, no canvas needed) */
export function processRaster(src: Raster, adj: Adjustments): Raster {
  const data = new Uint8ClampedArray(src.data);
  const ctx = { getImageData: () => ({ data, width: src.w, height: src.h }), putImageData: () => {} } as unknown as CanvasRenderingContext2D;
  applyAdjustments(ctx, src.w, src.h, adj, 1);
  return { data, w: src.w, h: src.h };
}

export function measure(img: Raster): LookStats {
  const { data, w, h } = img;
  const n = w * h;
  const hist = new Uint32Array(256);
  let sum = 0, sumSq = 0, satSum = 0, satN = 0, mr = 0, mg = 0, mb = 0, mn = 0, ar = 0, ag = 0, ab = 0, an = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (data[o + 3] < 8) continue; // transparent pixels carry no look
    const R = data[o], G = data[o + 1], B = data[o + 2];
    const l = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
    hist[Math.min(255, Math.round(l * 255))]++;
    sum += l; sumSq += l * l;
    const mx = Math.max(R, G, B), mnc = Math.min(R, G, B);
    if (l > 0.06 && l < 0.94 && mx > 0) { satSum += (mx - mnc) / mx; satN++; }
    ar += R; ag += G; ab += B; an++;
    if (l > 0.25 && l < 0.75) { mr += R; mg += G; mb += B; mn++; } // the cast shows best in the mid-tones, away from clipping
  }
  const total = Math.max(1, hist.reduce((s, v) => s + v, 0));
  const pct = (p: number) => { let c = 0; for (let i = 0; i < 256; i++) { c += hist[i]; if (c >= total * p) return i / 255; } return 1; };
  const mean = sum / total;
  const useMid = mn > total * 0.05;
  const [r, g, b] = useMid ? [mr / mn, mg / mn, mb / mn] : [ar / Math.max(1, an), ag / Math.max(1, an), ab / Math.max(1, an)];
  return { mean, std: Math.sqrt(Math.max(0, sumSq / total - mean * mean)), p5: pct(0.05), p50: pct(0.5), p95: pct(0.95), sat: satN ? satSum / satN : 0, tb: (b - r) / 255, tint: (g - (r + b) / 2) / 255 };
}

export const statsOf = (r: Raster, adj: Adjustments): LookStats => measure(processRaster(r, flat(adj)));

type Param = "exposure" | "highlights" | "shadows" | "contrast" | "saturation" | "temperature" | "tint";
type StatKey = keyof LookStats;
/** `scale` is how far a slider may reasonably go: the penalty for pushing past it grows quickly */
const PARAMS: { key: Param; opt: keyof MatchOpts; scale: number }[] = [
  { key: "exposure", opt: "exposure", scale: 45 },
  { key: "highlights", opt: "shadowsHighlights", scale: 55 },
  { key: "shadows", opt: "shadowsHighlights", scale: 55 },
  { key: "contrast", opt: "contrast", scale: 45 },
  { key: "saturation", opt: "saturation", scale: 55 },
  { key: "temperature", opt: "tone", scale: 45 },
  { key: "tint", opt: "tone", scale: 35 },
];
/** which measurements a setting is allowed to chase */
const STATS: { key: StatKey; owners: (keyof MatchOpts)[]; w: number }[] = [
  { key: "p50", owners: ["exposure"], w: 1 },
  { key: "p5", owners: ["shadowsHighlights", "contrast"], w: 1 },
  { key: "p95", owners: ["shadowsHighlights", "contrast"], w: 1 },
  { key: "std", owners: ["contrast"], w: 1 },
  { key: "sat", owners: ["saturation"], w: 1.2 },
  { key: "tb", owners: ["tone"], w: 2 },
  { key: "tint", owners: ["tone"], w: 2 },
];
/** two photos never share one histogram, so aim for most of the way and leave the rest to the intensity slider */
const AIM = 0.85;
const RIDGE = 0.035;

/** solve A x = b for a small dense system (Gaussian elimination with partial pivoting) */
function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-9;
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let v = M[r][n]; for (let k = r + 1; k < n; k++) v -= M[r][k] * x[k]; x[r] = v / (M[r][r] || 1e-9); }
  return x;
}

/**
 * Find the adjustments (relative to the photo's own edits) that bring `target` toward `ref`.
 * It is a damped least-squares fit with a penalty on large moves, so it makes the smallest changes that get close
 * instead of pinning sliders at their limits. `refAdj` is the reference's full effective look: its colour
 * grading, HSL mix and curves can ride along.
 */
export function solveMatch(target: Raster, targetBase: Adjustments, ref: LookStats, refAdj: Adjustments, opts: MatchOpts): AdjustDelta {
  const delta: AdjustDelta = {};
  if (opts.grading) {
    if (refAdj.hsl) delta.hsl = structuredClone(refAdj.hsl);
    if (refAdj.grade) delta.grade = structuredClone(refAdj.grade);
    if (refAdj.curves) delta.curves = structuredClone(refAdj.curves);
  }
  const active = PARAMS.filter((p) => opts[p.opt]);
  const stats = STATS.filter((s) => s.owners.some((o) => opts[o]));
  const n = active.length;
  if (!n || !stats.length) return delta;

  const base = flat(targetBase);
  const measureAt = (theta: number[]): number[] => {
    const d: AdjustDelta = { ...delta };
    active.forEach((p, i) => { d[p.key] = theta[i]; });
    const s = statsOf(target, layerAdjust(base, d, 1, "match"));
    return stats.map((st) => s[st.key]);
  };
  let theta = new Array(n).fill(0);
  const s0 = measureAt(theta);
  const goal = stats.map((st, i) => s0[i] + AIM * (ref[st.key] - s0[i]));
  const W = stats.map((st) => st.w * st.w);
  const L = active.map((p) => RIDGE / (p.scale * p.scale)); // penalty L·θ²: moving a slider by its `scale` costs RIDGE

  for (let iter = 0; iter < 6; iter++) {
    const f0 = measureAt(theta);
    const r = goal.map((g, i) => g - f0[i]);
    // Jacobian by finite differences through the real pipeline
    const J: number[][] = stats.map(() => new Array(n).fill(0));
    for (let j = 0; j < n; j++) {
      const t = [...theta]; t[j] += 8;
      const f1 = measureAt(t);
      for (let i = 0; i < stats.length; i++) J[i][j] = (f1[i] - f0[i]) / 8;
    }
    const A: number[][] = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => stats.reduce((sum, _s, i) => sum + W[i] * J[i][a] * J[i][b], 0) + (a === b ? L[a] : 0)));
    const rhs = Array.from({ length: n }, (_, a) => stats.reduce((sum, _s, i) => sum + W[i] * J[i][a] * r[i], 0) - L[a] * theta[a]);
    const step = solveLinear(A, rhs).map((v) => Math.max(-30, Math.min(30, v)) * 0.85);
    theta = theta.map((v, i) => Math.max(-100, Math.min(100, v + step[i])));
    if (Math.max(...step.map(Math.abs)) < 0.3) break;
  }
  active.forEach((p, i) => { if (Math.abs(theta[i]) >= 0.5) delta[p.key] = Math.round(theta[i] * 10) / 10; });
  return delta;
}

// ───────────────────────── thumbnails → pixels (browser only) ─────────────────────────

const rasters = new Map<string, Promise<Raster | null>>();
/** a small copy of the asset's thumbnail (long edge ≈ 96 px) to measure and solve on */
export function rasterOf(asset: Asset, long = 96): Promise<Raster | null> {
  const hit = rasters.get(asset.id);
  if (hit) return hit;
  const p = new Promise<Raster | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, long / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(8, Math.round(img.naturalWidth * k)), h = Math.max(8, Math.round(img.naturalHeight * k));
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h);
      resolve({ data: d.data, w, h });
    };
    img.onerror = () => resolve(null);
    img.src = asset.thumb;
  });
  rasters.set(asset.id, p);
  return p;
}
