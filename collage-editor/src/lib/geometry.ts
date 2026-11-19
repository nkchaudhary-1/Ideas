import type { Element, Rect } from "./types";

/** Axis-aligned bounds of an element (rotation is about its centre). Coordinates are in the parent's space. */
export function boundsOf(el: Pick<Element, "x" | "y" | "width" | "height" | "rotation">): Rect {
  const { x, y, width: w, height: h, rotation } = el;
  if (!rotation) return { x, y, w, h };
  const cx = x + w / 2, cy = y + h / 2;
  const r = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(r)), sin = Math.abs(Math.sin(r));
  const bw = w * cos + h * sin;
  const bh = w * sin + h * cos;
  return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
}

export function unionRects(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  const x1 = Math.min(...rects.map((r) => r.x));
  const y1 = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.w));
  const y2 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export const rectsIntersect = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function pointInRect(px: number, py: number, r: Rect) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function normRect(x1: number, y1: number, x2: number, y2: number): Rect {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

/** find an element anywhere in a tree, returning where it lives */
export function findInTree(list: Element[], id: string): { el: Element; list: Element[]; index: number; parent: Element | null } | null {
  for (let i = 0; i < list.length; i++) {
    const el = list[i];
    if (el.id === id) return { el, list, index: i, parent: null };
    if (el.type === "group") {
      const r = findInTree(el.children, id);
      if (r) return { ...r, parent: r.parent ?? el };
    }
  }
  return null;
}

export function flatten(list: Element[]): Element[] {
  return list.flatMap((e) => (e.type === "group" ? [e, ...flatten(e.children)] : [e]));
}

/** rotate a point about a centre */
export function rotatePoint(px: number, py: number, cx: number, cy: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  const dx = px - cx, dy = py - cy;
  return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) };
}
