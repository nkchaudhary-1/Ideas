import type { Draft } from "immer";
import type { Element } from "./types";

/** scale an element (and its children) by sx / sy; type and radii follow the smaller factor unless told otherwise */
export function scaleElement(e: Draft<Element>, sx: number, sy: number, tsx = Math.min(sx, sy)) {
  e.x *= sx; e.y *= sy; e.width *= sx; e.height *= sy;
  if (e.type === "text") { e.fontSize *= tsx; e.letterSpacing *= tsx; e.padding *= tsx; }
  if (e.type === "shape") { e.radius *= tsx; if (e.stroke) e.stroke.width *= tsx; }
  if (e.type === "grid") { e.margin *= tsx; e.gutter *= tsx; e.radius *= tsx; }
  if (e.type === "image" || e.type === "video") { e.radius *= tsx; if (e.stroke) e.stroke.width *= tsx; }
  if (e.type === "group") e.children.forEach((c) => scaleElement(c, sx, sy, tsx));
}
