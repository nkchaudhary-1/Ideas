import type { Draft } from "immer";
import type { Element, MediaEl, Rect, Slide } from "./types";
import { getAsset } from "./media";
import { reframe } from "./media-math";
import { scaleElement } from "./scale-element";
import { layoutGrid } from "./grid-engine";

export type Anchor = "top-left" | "top-center" | "top-right" | "middle-left" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right" | "rotater" | null;

const sign = (a: Anchor) => ({
  x: (a?.includes("left") ? 1 : a?.includes("right") ? -1 : 0) as -1 | 0 | 1,
  y: (a?.startsWith("top") ? 1 : a?.startsWith("bottom") ? -1 : 0) as -1 | 0 | 1,
});

/**
 * Apply a finished Konva transform (scale factors about the element's centre, plus new centre and rotation)
 * to a draft element. Each element type decides what "resize" means: text reflows or scales its type,
 * pictures scale or crop, groups bake the scale into their children.
 */
export function applyTransform(e: Draft<Element>, t: { cx: number; cy: number; sx: number; sy: number; rotation: number; anchor: Anchor }) {
  const { sx, sy, anchor } = t;
  const uniform = Math.abs(sx - sy) < 0.002;
  let w = e.width * sx;
  let h = e.height * sy;

  if (e.type === "text") {
    if (uniform && Math.abs(sx - 1) > 0.002) {
      e.fontSize = Math.max(4, e.fontSize * sx);
      e.letterSpacing *= sx;
      e.padding *= sx;
      if (!e.autoHeight) h = e.height * sx;
    } else {
      h = e.autoHeight ? e.height : h;
    }
    w = Math.max(20, w);
  } else if (e.type === "image" || e.type === "video") {
    const m = e as Draft<MediaEl>;
    if (m.fill?.assetId && !uniform) {
      const a = getAsset(m.fill.assetId);
      if (a) {
        const src = { w: m.fill.kind === "video" ? a.width : a.width, h: a.height };
        m.fill = reframe(m.fill, src, { w: e.width, h: e.height }, { w, h }, sign(anchor), true) as typeof m.fill;
      }
    }
    if (uniform) m.radius *= sx;
  } else if (e.type === "group") {
    const g = e;
    g.children.forEach((c) => scaleElement(c, sx, sy));
  } else if (e.type === "shape") {
    if (e.kind === "line" || e.kind === "arrow") h = e.height;
    e.radius *= uniform ? sx : 1;
  }
  e.width = Math.max(1, w);
  e.height = Math.max(1, h);
  e.x = t.cx - e.width / 2;
  e.y = t.cy - e.height / 2;
  e.rotation = t.rotation;
}

/** is a document point inside the element's (rotated) box? */
export function pointInElement(e: Pick<Element, "x" | "y" | "width" | "height" | "rotation">, px: number, py: number): { lx: number; ly: number } | null {
  const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
  const r = (-e.rotation * Math.PI) / 180;
  const dx = px - cx, dy = py - cy;
  const lx = dx * Math.cos(r) - dy * Math.sin(r) + e.width / 2;
  const ly = dx * Math.sin(r) + dy * Math.cos(r) + e.height / 2;
  return lx >= 0 && ly >= 0 && lx <= e.width && ly <= e.height ? { lx, ly } : null;
}

export type Hit = { el: Element; cellId?: string; rect?: Rect; lx: number; ly: number };

/** top-most visible, unlocked element under a document point (and grid cell if any) */
export function hitTest(slide: Slide, px: number, py: number): Hit | null {
  for (let i = slide.elements.length - 1; i >= 0; i--) {
    const el = slide.elements[i];
    if (!el.visible || el.locked) continue;
    const p = pointInElement(el, px, py);
    if (!p) continue;
    if (el.type === "grid") {
      const { cells } = layoutGrid(el);
      const c = cells.find((c) => p.lx >= c.rect.x && p.lx <= c.rect.x + c.rect.w && p.ly >= c.rect.y && p.ly <= c.rect.y + c.rect.h);
      return { el, cellId: c?.id, rect: c?.rect, lx: p.lx, ly: p.ly };
    }
    return { el, ...p };
  }
  return null;
}
