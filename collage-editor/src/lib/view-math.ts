import type { Rect } from "./types";
import { clamp } from "./util";

export interface View { scale: number; x: number; y: number }
export interface Size { w: number; h: number }

export const MIN_SCALE = 0.03;
export const MAX_SCALE = 8;

export function fitView(size: Size, doc: Size, pad = 72): View {
  const s = clamp(Math.min((size.w - pad * 2) / doc.w, (size.h - pad * 2) / doc.h), MIN_SCALE, 4);
  return { scale: s, x: (size.w - doc.w * s) / 2, y: (size.h - doc.h * s) / 2 };
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
