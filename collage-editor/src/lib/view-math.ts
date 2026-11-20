import type { Rect } from "./types";
import { clamp } from "./util";

export interface View { scale: number; x: number; y: number }
export interface Size { w: number; h: number }

export const MIN_SCALE = 0.03;
export const MAX_SCALE = 8;

/** Fit the artboard in the stage, leaving room for the floating pills (top, bottom) and the panorama handles (sides). */
export function fitView(size: Size, doc: Size, pad: number | { x: number; top: number; bottom: number } = { x: 96, top: 132, bottom: 112 }): View {
  const p = typeof pad === "number" ? { x: pad, top: pad, bottom: pad } : pad;
  const availW = Math.max(120, size.w - p.x * 2), availH = Math.max(120, size.h - p.top - p.bottom);
  const s = clamp(Math.min(availW / doc.w, availH / doc.h), MIN_SCALE, 4);
  return { scale: s, x: (size.w - doc.w * s) / 2, y: p.top + (availH - doc.h * s) / 2 };
}

/** zoom by `factor` keeping the screen point (cx, cy) fixed */
export function zoomAround(v: View, factor: number, cx: number, cy: number): View {
  const s = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
  const k = s / v.scale;
  return { scale: s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
}

export function viewForRect(size: Size, r: Rect, pad = 100): View {
  const s = clamp(Math.min((size.w - pad * 2) / Math.max(1, r.w), (size.h - pad * 2) / Math.max(1, r.h)), MIN_SCALE, 4);
  return { scale: s, x: size.w / 2 - (r.x + r.w / 2) * s, y: size.h / 2 - (r.y + r.h / 2) * s };
}

export const toDoc = (v: View, sx: number, sy: number) => ({ x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale });
