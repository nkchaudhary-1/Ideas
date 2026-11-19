import type { MediaFill, Adjustments, FilterRef } from "./types";
import { NEUTRAL } from "./filters";
import { clamp } from "./util";

export const DEFAULT_FILTER: FilterRef = { id: "original", intensity: 100 };

export function newFill(assetId: string | null, kind: "image" | "video", duration = 0): MediaFill {
  return {
    assetId,
    kind,
    zoom: 1,
    fx: 0.5,
    fy: 0.5,
    flipX: false,
    flipY: false,
    rotation90: 0,
    adjustments: { ...NEUTRAL } as Adjustments,
    filter: { ...DEFAULT_FILTER },
    video: kind === "video" ? { trimStart: 0, trimEnd: null, muted: false, volume: 1, coverTime: 0, loop: true } : undefined,
    ...(duration ? {} : {}),
  };
}

export interface Dims { w: number; h: number }

export const rotatedDims = (src: Dims, r: 0 | 90 | 180 | 270): Dims => (r === 90 || r === 270 ? { w: src.h, h: src.w } : src);

export interface View { k: number; cx: number; cy: number; rw: number; rh: number; RW: number; RH: number }

/** Where in the (rotated) source the frame looks, and how magnified. */
export function viewOf(frame: Dims, src: Dims, fill: Pick<MediaFill, "zoom" | "fx" | "fy" | "rotation90">): View {
  const { w: RW, h: RH } = rotatedDims(src, fill.rotation90);
  const cover = Math.max(frame.w / RW, frame.h / RH);
  const k = cover * Math.max(1, fill.zoom);
  const rw = frame.w / k;
  const rh = frame.h / k;
  const cx = clamp(fill.fx * RW, rw / 2, RW - rw / 2);
  const cy = clamp(fill.fy * RH, rh / 2, RH - rh / 2);
  return { k, cx, cy, rw, rh, RW, RH };
}

/** Map source coords → rotated space matrix for ctx.transform */
export function rotationMatrix(r: 0 | 90 | 180 | 270, W: number, H: number): [number, number, number, number, number, number] {
  switch (r) {
    case 90: return [0, 1, -1, 0, H, 0];
    case 180: return [-1, 0, 0, -1, W, H];
    case 270: return [0, -1, 1, 0, 0, W];
    default: return [1, 0, 0, 1, 0, 0];
  }
}

/** Draw `source` (any resolution, representing the full original image) into a frame-local context. */
export function drawMedia(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceDims: Dims, // dims of the ORIGINAL media (coordinate system of fx/fy)
  drawnDims: Dims,  // pixel dims of `source` as supplied
  frame: Dims,
  fill: MediaFill,
) {
  const v = viewOf(frame, sourceDims, fill);
  ctx.save();
  ctx.translate(frame.w / 2, frame.h / 2);
  ctx.scale(fill.flipX ? -1 : 1, fill.flipY ? -1 : 1);
  ctx.scale(v.k, v.k);
  ctx.translate(-v.cx, -v.cy);
  const m = rotationMatrix(fill.rotation90, sourceDims.w, sourceDims.h);
  ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, drawnDims.w, drawnDims.h, 0, 0, sourceDims.w, sourceDims.h);
  ctx.restore();
}

/**
 * Re-frame after the frame itself changes size. `keepPixels` keeps the picture's on-screen size
 * (a crop: edges move over the picture) instead of scaling it with the frame.
 */
export function reframe(
  fill: MediaFill,
  src: Dims,
  oldFrame: Dims,
  newFrame: Dims,
  anchor: { x: -1 | 0 | 1; y: -1 | 0 | 1 },
  keepPixels: boolean,
): MediaFill {
  if (!keepPixels) return fill;
  const old = viewOf(oldFrame, src, fill);
  const { w: RW, h: RH } = rotatedDims(src, fill.rotation90);
  const p = old.k; // px per source px, preserved
  const nrw = newFrame.w / p;
  const nrh = newFrame.h / p;
  // keep the anchored edge fixed in the picture
  const left = old.cx - old.rw / 2;
  const top = old.cy - old.rh / 2;
  let nx = anchor.x < 0 ? left : anchor.x > 0 ? left + old.rw - nrw : old.cx - nrw / 2;
  let ny = anchor.y < 0 ? top : anchor.y > 0 ? top + old.rh - nrh : old.cy - nrh / 2;
  const ncover = Math.max(newFrame.w / RW, newFrame.h / RH);
  let zoom = p / ncover;
  if (zoom < 1) {
    // asked to show more than exists: fall back to exactly cover
    zoom = 1;
    return { ...fill, zoom, fx: clamp(fill.fx, 0, 1), fy: clamp(fill.fy, 0, 1) };
  }
  nx = clamp(nx, 0, RW - nrw);
  ny = clamp(ny, 0, RH - nrh);
  return { ...fill, zoom, fx: (nx + nrw / 2) / RW, fy: (ny + nrh / 2) / RH };
}

/** Pan the picture inside its frame by a drag of (dx, dy) frame pixels. */
export function panFill(fill: MediaFill, src: Dims, frame: Dims, dx: number, dy: number): MediaFill {
  const v = viewOf(frame, src, fill);
  const nx = v.cx - dx / v.k;
  const ny = v.cy - dy / v.k;
  return { ...fill, fx: clamp(nx, v.rw / 2, v.RW - v.rw / 2) / v.RW, fy: clamp(ny, v.rh / 2, v.RH - v.rh / 2) / v.RH };
}

export function zoomFill(fill: MediaFill, zoom: number): MediaFill {
  return { ...fill, zoom: clamp(zoom, 1, 8) };
}
