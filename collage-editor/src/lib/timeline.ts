import type { MediaFill, Slide } from "./types";
import { flatten } from "./geometry";
import { cellsOf } from "./grid-engine";
import { effectiveTrim, getAsset } from "./media";

/** every media fill on a slide: frames, video frames, grid cells and an image background */
export function slideFills(slide: Slide): MediaFill[] {
  const out: MediaFill[] = [];
  if (slide.background.type === "image") out.push(slide.background.fill);
  for (const e of flatten(slide.elements)) {
    if ((e.type === "image" || e.type === "video") && e.fill) out.push(e.fill);
    if (e.type === "grid") for (const c of cellsOf(e.tree)) if (c.fill) out.push(c.fill);
  }
  return out;
}

export const slideVideoFills = (slide: Slide) => slideFills(slide).filter((f) => f.kind === "video" && f.assetId && getAsset(f.assetId));
export const slideHasVideo = (slide: Slide) => slideVideoFills(slide).length > 0;

/** length of the longest trimmed clip on the slide, 0 for a still slide */
export function clipLength(slide: Slide): number {
  return slideVideoFills(slide).reduce((m, f) => Math.max(m, effectiveTrim(f, getAsset(f.assetId)!.duration ?? 0).length), 0);
}

/** how long a slide plays: an explicit duration, else its longest clip, else a still-slide default */
export function slideDuration(slide: Slide, stillDefault = 3): number {
  if (slide.duration && slide.duration > 0) return slide.duration;
  const c = clipLength(slide);
  return c > 0 ? c : stillDefault;
}
