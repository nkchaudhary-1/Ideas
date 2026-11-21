import type { Asset, Element, Slide } from "./types";
import { useStore, getSlide, firstEmptySegment } from "./store";
import { makeGrid, makeMedia, makeShape, makeSlide } from "./factory";
import { SEGMENT, panoramaCount } from "./formats";
import { GRID_PRESETS, mapCells, presetCellCount, treeFromPreset, cellsOf } from "./grid-engine";
import { newFill } from "./media-math";
import { fitSlide, type Template } from "./templates";
import { preloadFonts } from "./fonts";
import { flatten } from "./geometry";

const st = () => useStore.getState();
const isEmptySlide = (s: Slide) => s.elements.length === 0;

/** one full-bleed frame per asset (photo or video) */
function fullBleed(asset: Asset, w: number, h: number) {
  return makeMedia(asset.kind, w, h, newFill(asset.id, asset.kind), { name: asset.name.replace(/\.[^.]+$/, "") }, 0, 0);
}

export function createSingleFromAsset(asset: Asset) {
  const s = st();
  const slide = getSlide(s.project);
  if (isEmptySlide(slide)) s.addMediaToCanvas(asset);
  else s.addMediaToCanvas(asset);
}

/** every selected file becomes its own slide; photos and videos mix freely */
export function createCarouselFromAssets(assets: Asset[]) {
  if (!assets.length) return;
  const s = st();
  const first = getSlide(s.project);
  const { width: w, height: h } = s.project.format;
  let i = 0;
  if (s.project.slides.length === 1 && isEmptySlide(first)) {
    s.addElement(fullBleed(assets[0], first.width, first.height));
    s.commit((p) => { p.kind = "carousel"; p.slides[0].name = "Slide 1"; });
    i = 1;
  }
  for (; i < assets.length; i++) {
    const slide = makeSlide(w, h, `Slide ${st().project.slides.length + 1}`, structuredClone(getSlide(st().project).background));
    slide.elements = [fullBleed(assets[i], w, h)];
    st().addSlide({ slide, afterId: st().project.slides[st().project.slides.length - 1].id });
  }
  st().commit((p) => { p.kind = "carousel"; });
  st().setActiveSlide(st().project.slides[0].id); // land on the cover, not the last slide
  st().toast(`Carousel with ${assets.length} slide${assets.length > 1 ? "s" : ""} ready`, "ok");
}

/** pick the grid with exactly N cells (or the closest with enough) and pour the media in order */
export function createCollageFromAssets(assets: Asset[]) {
  if (!assets.length) return;
  const n = assets.length;
  const candidates = GRID_PRESETS.filter((p) => p.group !== "Cards");
  const exact = candidates.filter((p) => presetCellCount(p) === n);
  const bigger = candidates.filter((p) => presetCellCount(p) > n).sort((a, b) => presetCellCount(a) - presetCellCount(b));
  const smaller = candidates.filter((p) => presetCellCount(p) < n).sort((a, b) => presetCellCount(b) - presetCellCount(a));
  const preset = exact[0] ?? bigger[0] ?? smaller[0] ?? candidates[0];
  const slide = getSlide(st().project);
  const g = makeGrid(preset, slide.width, slide.height);
  let i = 0;
  g.tree = mapCells(treeFromPreset(preset), (c) => { const a = assets[i++]; return a ? { ...c, fill: newFill(a.id, a.kind) } : c; });
  st().addElement(g);
  st().toast(`${preset.name} · ${Math.min(n, cellsOf(g.tree).length)} of ${n} added`, "ok");
}

/**
 * On a panorama a template fills one slide of it (a slide is 1080 px wide) instead of being stretched across the whole strip: the slide
 * you picked (or the one under a drop), otherwise the first empty one. Only what sits wholly inside that slide is replaced, and a template
 * with several slides fills the following slides in order unless you picked one, which gets just the first.
 */
function applyTemplateToSlides(slides: Slide[], segment?: number) {
  const s = st();
  const cur = getSlide(s.project);
  const n = panoramaCount(cur.width);
  const picked = segment ?? s.ui.pinSegment ?? undefined;
  const start = Math.max(0, Math.min(n - 1, picked ?? firstEmptySegment(cur) ?? 0));
  const used = picked !== undefined ? slides.slice(0, 1) : slides;
  const sameBg = (a: Slide["background"], b: Slide["background"]) => JSON.stringify(a) === JSON.stringify(b);
  const placed: { from: number; to: number; els: Element[] }[] = [];
  let at = start;
  for (const sl of used) {
    const m = Math.min(n, Math.max(1, panoramaCount(sl.width)));
    if (at + m > n) at = Math.max(0, n - m);
    if (placed.length && at < placed[placed.length - 1].to) break; // out of room
    const fitted = fitSlide(sl, m * SEGMENT, cur.height);
    const els = fitted.elements;
    // the slide's own background becomes a block behind its content, since a panorama has one background for all of its slides
    const bg = fitted.background;
    if (!sameBg(bg, cur.background) && (bg.type === "solid" || bg.type === "gradient")) {
      els.unshift(makeShape("rect", m * SEGMENT, cur.height, { fill: bg.type === "solid" ? { type: "solid", color: bg.color } : { type: "gradient", angle: bg.angle, stops: bg.stops }, name: "Slide background" }, 0, 0));
    }
    els.forEach((e) => { e.x += at * SEGMENT; });
    placed.push({ from: at, to: at + m, els });
    at += m;
  }
  const lo = placed[0].from * SEGMENT, hi = placed[placed.length - 1].to * SEGMENT;
  st().commit((p) => {
    const target = p.slides.find((x) => x.id === p.activeSlideId)!;
    target.elements = target.elements.filter((e) => !(e.x >= lo - 2 && e.x + e.width <= hi + 2)) as typeof target.elements;
    placed.forEach((pl) => target.elements.push(...(pl.els as typeof target.elements)));
  });
  st().clearSelection();
  st().setUI({ pinSegment: null });
  const first = placed[0].from + 1, last = placed[placed.length - 1].to;
  st().toast(first === last ? `Applied to slide ${first}` : `Applied to slides ${first} to ${last}`, "ok");
  void preloadFonts(used.flatMap((sl) => flatten(sl.elements)).filter((e) => e.type === "text").map((e) => ({ family: (e as { fontFamily: string }).fontFamily, weight: (e as { fontWeight: number }).fontWeight })));
}

/** put a template on the canvas (single slide), on one slide of a panorama, or add it as new slides (carousel templates) */
export function applyTemplate(t: Template, mode: "replace" | "append" = "replace", opts?: { segment?: number }) {
  const s = st();
  const slides = t.build();
  const cur = getSlide(s.project);
  if (mode === "replace" && panoramaCount(cur.width) >= 2) { applyTemplateToSlides(slides, opts?.segment); return; }
  const ratioDiffers = Math.abs(t.size.w / t.size.h - cur.width / cur.height) > 0.02;
  const lone = s.project.slides.length === 1 && isEmptySlide(cur);

  if (slides.length === 1 && mode === "replace") {
    if (ratioDiffers && lone) s.setFormat({ id: "custom", label: "Template", ratio: `${t.size.w}:${t.size.h}`, width: t.size.w, height: t.size.h }, { content: "none" });
    const target = getSlide(st().project);
    const fitted = fitSlide(slides[0], target.width, target.height);
    st().applySlide(fitted);
  } else {
    if (lone && ratioDiffers) s.setFormat({ id: "custom", label: "Template", ratio: `${t.size.w}:${t.size.h}`, width: t.size.w, height: t.size.h }, { content: "none" });
    const { width: w, height: h } = st().project.format;
    let after = st().project.activeSlideId;
    slides.forEach((sl, i) => {
      const fitted = fitSlide(sl, w, h);
      if (i === 0 && lone && mode === "replace") { st().applySlide(fitted); st().renameSlide(st().project.slides[0].id, fitted.name); }
      else after = st().addSlide({ slide: fitted, afterId: after });
    });
    if (slides.length > 1) st().commit((p) => { p.kind = "carousel"; });
  }
  void preloadFonts(slides.flatMap((sl) => flatten(sl.elements)).filter((e) => e.type === "text").map((e) => ({ family: (e as { fontFamily: string }).fontFamily, weight: (e as { fontWeight: number }).fontWeight })));
  st().requestFit();
}
