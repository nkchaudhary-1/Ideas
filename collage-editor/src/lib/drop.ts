import type { Element, Slide } from "./types";
import type { Template } from "./templates";
import { SEGMENT, panoramaCount } from "./formats";
import { useStore, getSlide, firstEmptySegment } from "./store";
import { inkFor } from "./presets";

/**
 * What is being dragged from a panel onto the canvas. A drag only carries text between its start and its drop, so the thing itself waits
 * here: a whole template, or a function that builds elements for the area they will land in.
 */
export type DragItem =
  | { kind: "template"; template: Template }
  | { kind: "elements"; build: (w: number, h: number, ink: string) => Element[]; /** runs after they are added, with the new elements */ after?: (els: Element[]) => void };

let current: DragItem | null = null;
export const draggedItem = () => current;
export const endDrag = () => { current = null; };
export function startDrag(e: { dataTransfer: DataTransfer }, item: DragItem) {
  current = item;
  e.dataTransfer.setData("application/x-item", item.kind);
  e.dataTransfer.effectAllowed = "copy";
}

/** which slide of a panorama a point on the canvas is over (0-based), or null when the canvas is a single slide */
export function segmentAt(slide: Slide, x: number): number | null {
  const n = panoramaCount(slide.width);
  return n >= 2 ? Math.max(0, Math.min(n - 1, Math.floor(x / SEGMENT))) : null;
}

export interface Area { x: number; y: number; w: number; h: number }
/** the room an added item has: one slide of a panorama, or the whole canvas */
export function areaOf(slide: Slide, segment: number | null): Area {
  const n = panoramaCount(slide.width);
  if (segment === null || n < 2) return { x: 0, y: 0, w: slide.width, h: slide.height };
  const i = Math.max(0, Math.min(n - 1, segment));
  return { x: i * SEGMENT, y: 0, w: SEGMENT, h: slide.height };
}

/** shift elements built for a slide-sized area to where that area really is on the canvas */
export function moveToArea(els: Element[], area: Area): Element[] {
  els.forEach((e) => { e.x += area.x; e.y += area.y; });
  return els;
}

/** centre a group of elements on a point (a drop), keeping it inside the area when it fits */
export function centreOn(els: Element[], cx: number, cy: number, area: Area): Element[] {
  if (!els.length) return els;
  const x0 = Math.min(...els.map((e) => e.x)), y0 = Math.min(...els.map((e) => e.y));
  const x1 = Math.max(...els.map((e) => e.x + e.width)), y1 = Math.max(...els.map((e) => e.y + e.height));
  const w = x1 - x0, h = y1 - y0;
  const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
  const tx = clamp(cx - w / 2, area.x, area.x + area.w - w), ty = clamp(cy - h / 2, area.y, area.y + area.h - h);
  els.forEach((e) => { e.x += tx - x0; e.y += ty - y0; });
  return els;
}

export type ElementsItem = Extract<DragItem, { kind: "elements" }>;

/** the slide of a panorama a click should add to: the one you pinned, else the next empty one, else the first (null on a single slide) */
export function clickSegment(slide: Slide): number | null {
  if (panoramaCount(slide.width) < 2) return null;
  return useStore.getState().ui.pinSegment ?? firstEmptySegment(slide) ?? 0;
}

/**
 * Add built elements to the active slide. A drop passes the point it landed on (the group is centred there, inside the slide under it);
 * a click passes nothing and gets the builder's own position, inside the pinned or next empty slide of a panorama.
 */
export function placeElements(item: ElementsItem, opts: { segment?: number | null; at?: { x: number; y: number } } = {}) {
  const st = useStore.getState();
  const sl = getSlide(st.project);
  const area = areaOf(sl, opts.segment !== undefined ? opts.segment : clickSegment(sl));
  const built = item.build(area.w, area.h, inkFor(sl));
  const els = opts.at ? centreOn(built, opts.at.x, opts.at.y, area) : moveToArea(built, area);
  if (els.length === 1) st.addElement(els[0]);
  else {
    st.commit((p) => { p.slides.find((x) => x.id === p.activeSlideId)!.elements.push(...(els as never[])); });
    st.select(els.map((e) => e.id));
  }
  item.after?.(els);
}
