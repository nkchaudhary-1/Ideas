import type { Draft } from "immer";
import type { Adjustments, Asset, FilterRef, Id, MediaEl, MediaFill, Project, Slide, ToneKey } from "./types";
import { useStore } from "./store";
import { makeMedia, makeSlide } from "./factory";
import { DEFAULT_FILTER, newFill } from "./media-math";
import { getAsset } from "./media";
import { effectiveAdjustments, fillEffective, NEUTRAL } from "./filters";
import { rasterOf, solveMatch, statsOf, type MatchOpts } from "./match";

/**
 * "Edit photos & videos" mode. Every photo or video is its own slide, sized to the picture, holding one
 * full-bleed frame. That keeps the whole pipeline (crop, adjustments, preview, export) identical to the collage
 * editor: the edit card simply targets the active slide, or every selected slide for batch edits.
 */

const st = () => useStore.getState();

/** long-edge caps. Photos stay below 2160 so they are never mistaken for a 1080-wide panorama. */
export const EDIT_CAP = { image: 2048, video: 1920 } as const;
export const stem = (n: string) => n.replace(/\.[^.]+$/, "");

/** slide size for a crop `ratio` (null = the picture's own proportions) of a source, at native pixels up to the cap */
export function editSize(src: { w: number; h: number }, kind: "image" | "video", ratio: number | null): { w: number; h: number } {
  const sAr = src.w / src.h;
  const ar = ratio ?? sAr;
  let w = ar >= sAr ? src.w : src.h * ar;
  let h = w / ar;
  const k = Math.min(1, EDIT_CAP[kind] / Math.max(w, h));
  w *= k; h *= k;
  return { w: Math.max(2, Math.round(w / 2) * 2), h: Math.max(2, Math.round(h / 2) * 2) };
}

export function makeEditSlide(asset: Asset): Slide {
  const { w, h } = editSize({ w: asset.width, h: asset.height }, asset.kind, null);
  const slide = makeSlide(w, h, stem(asset.name), { type: "solid", color: "#111111" });
  slide.elements = [makeMedia(asset.kind, w, h, newFill(asset.id, asset.kind), { name: stem(asset.name), locked: true }, 0, 0)];
  return slide;
}

export const mediaOf = (s: Slide): MediaEl | undefined => s.elements.find((e) => (e.type === "image" || e.type === "video") && e.fill) as MediaEl | undefined;
export const isEmptyEdit = (s: Slide) => !mediaOf(s);

export const emptyEditSlide = (): Slide => makeSlide(1080, 1350, "Slide 1", { type: "solid", color: "#111111" });

/** start a new edit project from library assets (no assets = an empty editor that asks for some) */
export function startEdit(assets: Asset[]) {
  if (!assets.length) { st().newEditProject([emptyEditSlide()], "Untitled edit"); return; }
  st().newEditProject(assets.map(makeEditSlide), assets.length === 1 ? stem(assets[0].name) : "Untitled edit");
}

/** add assets to the open edit project (or start one when another kind of project is open) */
export function addAssetsToEdit(assets: Asset[]) {
  if (!assets.length) return;
  if (st().project.kind !== "edit") { startEdit(assets); return; }
  st().addEditSlides(assets.map(makeEditSlide));
  st().toast(`${assets.length} added to the editor`, "ok");
}

// ───────────────────────── crop & transform ─────────────────────────

const rotatedSource = (asset: Asset, rot: number) => (rot === 90 || rot === 270 ? { w: asset.height, h: asset.width } : { w: asset.width, h: asset.height });

/** re-cut the slide to a crop ratio (null = original), centred, at native size */
export function resizeToAspect(slide: Draft<Slide>, el: Draft<MediaEl>, asset: Asset, ratio: number | null) {
  const f = el.fill!;
  const { w, h } = editSize(rotatedSource(asset, f.rotation90), f.kind, ratio);
  slide.width = w; slide.height = h;
  el.x = 0; el.y = 0; el.width = w; el.height = h;
  f.zoom = 1; f.fx = 0.5; f.fy = 0.5;
}

/** the crop ratio a slide currently has, as w/h */
export const slideRatio = (s: Slide) => s.width / s.height;

export function setAspect(slideIds: Id[], ratio: number | null) {
  st().commit((p) => {
    for (const s of p.slides) {
      if (!slideIds.includes(s.id)) continue;
      const el = mediaOf(s as Slide) as Draft<MediaEl> | undefined;
      const a = el?.fill && getAsset(el.fill.assetId);
      if (el && a) resizeToAspect(s, el, a, ratio);
    }
    syncFormat(p);
  });
  st().requestFit();
}

export function rotateBy(slideIds: Id[], dir: 90 | -90) {
  st().commit((p) => {
    for (const s of p.slides) {
      if (!slideIds.includes(s.id)) continue;
      const el = mediaOf(s as Slide) as Draft<MediaEl> | undefined;
      const f = el?.fill;
      const a = f && getAsset(f.assetId);
      if (!el || !f || !a) continue;
      const ratio = s.width / s.height;
      f.rotation90 = ((f.rotation90 + (dir === 90 ? 90 : 270)) % 360) as 0 | 90 | 180 | 270;
      const [fx, fy] = dir === 90 ? [1 - f.fy, f.fx] : [f.fy, 1 - f.fx];
      resizeToAspect(s, el, a, 1 / ratio);
      f.zoom = Math.max(1, f.zoom); f.fx = fx; f.fy = fy;
    }
    syncFormat(p);
  });
  st().requestFit();
}

/** undo every crop, rotation and flip: back to the picture's own proportions */
export function resetGeometry(slideIds: Id[]) {
  st().commit((p) => {
    for (const s of p.slides) {
      if (!slideIds.includes(s.id)) continue;
      const el = mediaOf(s as Slide) as Draft<MediaEl> | undefined;
      const f = el?.fill;
      const a = f && getAsset(f.assetId);
      if (!el || !f || !a) continue;
      f.flipX = false; f.flipY = false; f.rotation90 = 0;
      resizeToAspect(s, el, a, null);
    }
    syncFormat(p);
  });
  st().requestFit();
}

/** project.format follows the first slide so video probing and the size label stay sensible */
function syncFormat(p: Draft<Project>) {
  const s = p.slides[0];
  if (p.kind === "edit" && s) p.format = { id: "custom", label: "Original", ratio: "Original", width: s.width, height: s.height };
}

// ───────────────────────── selection ─────────────────────────

export const slideKind = (s: Slide) => mediaOf(s)?.fill?.kind ?? null;

export function selectSlides(ids: Id[], active?: Id) {
  const p = st().project;
  const valid = ids.filter((i) => p.slides.some((s) => s.id === i));
  const act = active && valid.includes(active) ? active : valid.includes(p.activeSlideId) ? p.activeSlideId : valid[0];
  if (act) st().setActiveSlide(act);
  st().setUI({ mediaSel: valid });
}

export function selectWhere(what: "all" | "image" | "video" | "none") {
  const slides = st().project.slides.filter((s) => !isEmptyEdit(s));
  if (what === "none") { st().setUI({ mediaSel: [st().project.activeSlideId] }); return; }
  const ids = slides.filter((s) => what === "all" || slideKind(s) === what).map((s) => s.id);
  if (!ids.length) { st().toast(what === "video" ? "There are no videos here" : "There are no photos here", "info"); return; }
  selectSlides(ids);
}

// ───────────────────────── reset ─────────────────────────

export function resetEdits(slideIds: Id[]) {
  st().commit((p) => {
    for (const s of p.slides) {
      if (!slideIds.includes(s.id)) continue;
      const f = mediaOf(s as Slide)?.fill as Draft<MediaFill> | undefined;
      if (!f) continue;
      f.adjustments = { ...NEUTRAL } as Adjustments;
      f.filter = { ...DEFAULT_FILTER } as FilterRef;
      delete f.match;
    }
  });
}

// ───────────────────────── copy / paste edit settings ─────────────────────────

export type CopyId =
  | "exposure" | "brightness" | "contrast" | "highlights" | "shadows" | "whites" | "blacks"
  | "temperature" | "tint" | "saturation" | "vibrance" | "hue" | "hsl" | "curves" | "grade"
  | "filter" | "effects" | "sharpness" | "grain" | "vignette" | "transform";

export const COPY_ITEMS: { id: CopyId; label: string; group: "Light" | "Colour" | "Look & detail" | "Geometry" }[] = [
  { id: "exposure", label: "Exposure", group: "Light" },
  { id: "brightness", label: "Brightness", group: "Light" },
  { id: "contrast", label: "Contrast", group: "Light" },
  { id: "highlights", label: "Highlights", group: "Light" },
  { id: "shadows", label: "Shadows", group: "Light" },
  { id: "whites", label: "Whites", group: "Light" },
  { id: "blacks", label: "Blacks", group: "Light" },
  { id: "temperature", label: "Temperature", group: "Colour" },
  { id: "tint", label: "Tint", group: "Colour" },
  { id: "saturation", label: "Saturation", group: "Colour" },
  { id: "vibrance", label: "Vibrance", group: "Colour" },
  { id: "hue", label: "Hue", group: "Colour" },
  { id: "hsl", label: "HSL colour mix", group: "Colour" },
  { id: "curves", label: "Curves", group: "Colour" },
  { id: "grade", label: "Colour grading", group: "Colour" },
  { id: "filter", label: "Filter", group: "Look & detail" },
  { id: "effects", label: "Effects (B&W, sepia, fade, blur)", group: "Look & detail" },
  { id: "sharpness", label: "Sharpness", group: "Look & detail" },
  { id: "grain", label: "Grain", group: "Look & detail" },
  { id: "vignette", label: "Vignette", group: "Look & detail" },
  { id: "transform", label: "Crop, rotation & flip", group: "Geometry" },
];
/** what is ticked when the popover opens: every look property, but not the crop */
export const DEFAULT_COPY: CopyId[] = COPY_ITEMS.filter((i) => i.id !== "transform").map((i) => i.id);

const TONE_OF: Partial<Record<CopyId, ToneKey[]>> = {
  exposure: ["exposure"], brightness: ["brightness"], contrast: ["contrast"], highlights: ["highlights"], shadows: ["shadows"], whites: ["whites"], blacks: ["blacks"],
  temperature: ["temperature"], tint: ["tint"], saturation: ["saturation"], vibrance: ["vibrance"], hue: ["hue"],
  effects: ["grayscale", "sepia", "fade", "blur"], sharpness: ["sharpness"], grain: ["grain"], vignette: ["vignette"],
};

export interface EditClip {
  ids: CopyId[];
  sourceSlide: Id;
  name: string;
  adj: Adjustments;
  filter: FilterRef;
  geo: { zoom: number; fx: number; fy: number; flipX: boolean; flipY: boolean; rotation90: 0 | 90 | 180 | 270; ratio: number };
}

export function captureEdit(fill: MediaFill, slide: Slide, ids: CopyId[]): EditClip {
  return {
    ids: [...ids], sourceSlide: slide.id, name: slide.name,
    adj: structuredClone({ ...NEUTRAL, ...fill.adjustments }) as Adjustments,
    filter: { ...fill.filter },
    geo: { zoom: fill.zoom, fx: fill.fx, fy: fill.fy, flipX: fill.flipX, flipY: fill.flipY, rotation90: fill.rotation90, ratio: slide.width / slide.height },
  };
}

/** write the copied properties onto a fill. Everything stays a normal, editable setting. */
export function pasteEdit(fill: Draft<MediaFill>, clip: EditClip) {
  const a = fill.adjustments as Adjustments;
  for (const id of clip.ids) {
    for (const k of TONE_OF[id] ?? []) a[k] = clip.adj[k] ?? 0;
    if (id === "hsl") { if (clip.adj.hsl) a.hsl = structuredClone(clip.adj.hsl); else delete a.hsl; }
    if (id === "curves") { if (clip.adj.curves) a.curves = structuredClone(clip.adj.curves); else delete a.curves; }
    if (id === "grade") { if (clip.adj.grade) a.grade = structuredClone(clip.adj.grade); else delete a.grade; }
    if (id === "filter") fill.filter = { ...clip.filter };
    if (id === "transform") { fill.flipX = clip.geo.flipX; fill.flipY = clip.geo.flipY; fill.rotation90 = clip.geo.rotation90; }
  }
}

export function pasteToSlides(slideIds: Id[], clip: EditClip): number {
  let n = 0;
  st().commit((p) => {
    for (const s of p.slides) {
      if (!slideIds.includes(s.id) || s.id === clip.sourceSlide) continue;
      const el = mediaOf(s as Slide) as Draft<MediaEl> | undefined;
      if (!el?.fill) continue;
      pasteEdit(el.fill, clip);
      if (clip.ids.includes("transform")) {
        const a = getAsset(el.fill.assetId);
        if (a) { resizeToAspect(s, el, a, clip.geo.ratio); el.fill.zoom = clip.geo.zoom; el.fill.fx = clip.geo.fx; el.fill.fy = clip.geo.fy; }
      }
      n++;
    }
    syncFormat(p);
  });
  if (clip.ids.includes("transform")) st().requestFit();
  return n;
}

// ───────────────────────── match look ─────────────────────────

/** re-solve every target against the reference's current edits, as one undo step */
export async function matchToReference(refSlideId: Id, targetIds: Id[], opts: MatchOpts, intensity = 100): Promise<number> {
  const project = st().project;
  const refSlide = project.slides.find((s) => s.id === refSlideId);
  const refFill = refSlide && mediaOf(refSlide)?.fill;
  const refAsset = refFill && getAsset(refFill.assetId);
  if (!refSlide || !refFill || !refAsset) return 0;
  const refRaster = await rasterOf(refAsset);
  if (!refRaster) return 0;
  const refAdj = fillEffective(refFill);
  const refStats = statsOf(refRaster, refAdj);
  const solved = new Map<Id, ReturnType<typeof solveMatch>>();
  for (const id of targetIds) {
    if (id === refSlideId) continue;
    const s = project.slides.find((x) => x.id === id);
    const f = s && mediaOf(s)?.fill;
    const a = f && getAsset(f.assetId);
    if (!f || !a) continue;
    const raster = await rasterOf(a);
    if (!raster) continue;
    solved.set(id, solveMatch(raster, effectiveAdjustments(f.adjustments, f.filter), refStats, refAdj, opts));
  }
  if (!solved.size) return 0;
  st().commit((p) => {
    for (const s of p.slides) {
      const adj = solved.get(s.id);
      const f = adj && (mediaOf(s as Slide)?.fill as Draft<MediaFill> | undefined);
      if (!f || !adj) continue;
      f.match = { ref: refSlideId, intensity: f.match ? f.match.intensity : intensity, adj };
    }
  });
  return solved.size;
}

export function clearMatch(slideIds: Id[]) {
  st().commit((p) => {
    for (const s of p.slides) {
      if (!slideIds.includes(s.id)) continue;
      const f = mediaOf(s as Slide)?.fill as Draft<MediaFill> | undefined;
      if (f) delete f.match;
    }
  });
}
