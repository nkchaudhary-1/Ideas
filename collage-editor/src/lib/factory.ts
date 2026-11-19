import type {
  Background, BaseEl, Element, Format, GridEl, GroupEl, LayoutGrid, MediaEl, MediaFill, Project, ProjectKind, ShapeEl, ShapeKind, Slide, TextEl,
} from "./types";
import { uid } from "./util";
import { GRID_PRESETS, treeFromPreset, type GridPreset } from "./grid-engine";
import { newFill } from "./media-math";

export function baseEl(name: string, x: number, y: number, w: number, h: number): BaseEl {
  return {
    id: uid("el"), name, x, y, width: w, height: h, rotation: 0, opacity: 1, visible: true, locked: false, blend: "source-over", shadow: null,
  };
}

export const defaultLayoutGrid = (): LayoutGrid => ({
  visible: false, kind: "columns", columns: 6, rows: 8, gutter: 24, margin: 48, baseline: 24, color: "#ff4d6d", snap: true,
});

export function makeText(over: Partial<TextEl> & { text: string }, x = 80, y = 80): TextEl {
  const { text, ...rest } = over;
  return {
    ...baseEl("Text", x, y, 640, 90),
    type: "text",
    text,
    fontFamily: "Inter",
    fontSize: 64,
    fontWeight: 600,
    italic: false,
    underline: false,
    strike: false,
    align: "left",
    vAlign: "top",
    lineHeight: 1.15,
    letterSpacing: 0,
    textTransform: "none",
    fill: { type: "solid", color: "#ffffff" },
    stroke: null,
    padding: 0,
    background: null,
    autoHeight: true,
    ...rest,
  } as TextEl;
}

export function makeShape(kind: ShapeKind, w: number, h: number, over: Partial<ShapeEl> = {}, x = 100, y = 100): ShapeEl {
  const line = kind === "line" || kind === "arrow";
  return {
    ...baseEl(kind[0].toUpperCase() + kind.slice(1), x, y, w, line ? Math.max(h, 0) : h),
    type: "shape",
    kind,
    fill: line ? null : { type: "solid", color: "#ffffff" },
    stroke: line ? { color: "#ffffff", width: 6 } : null,
    radius: 0,
    sides: kind === "star" ? 5 : kind === "polygon" ? 6 : 3,
    innerRatio: 0.45,
    ...over,
  } as ShapeEl;
}

export function makeMedia(type: "image" | "video", w: number, h: number, fill: MediaFill | null, over: Partial<MediaEl> = {}, x = 0, y = 0): MediaEl {
  return {
    ...baseEl(type === "video" ? "Video" : "Image", x, y, w, h),
    type,
    shape: "rect",
    radius: 0,
    fill,
    bg: fill ? "transparent" : "#2b2b2b", // PNG/WebP with alpha must stay transparent; grey is only the empty-frame fill
    stroke: null,
    ...over,
  };
}

export function makeFrame(w = 480, h = 600, over: Partial<MediaEl> = {}, x = 100, y = 100): MediaEl {
  return makeMedia("image", w, h, null, { name: "Frame", radius: 32, ...over }, x, y);
}

export function makeGrid(preset: GridPreset | undefined, w: number, h: number, over: Partial<GridEl> = {}): GridEl {
  const p = preset ?? GRID_PRESETS.find((g) => g.id === "four")!;
  return {
    ...baseEl(p.name, 0, 0, w, h),
    type: "grid",
    margin: p.margin ?? 40,
    gutter: p.gutter ?? 20,
    radius: p.radius ?? 24,
    cellBg: "#2b2b2b",
    cellStroke: null,
    tree: treeFromPreset(p),
    ...over,
  };
}

export function makeGroup(children: Element[], x: number, y: number, w: number, h: number): GroupEl {
  return { ...baseEl("Group", x, y, w, h), type: "group", children };
}

export const solidBg = (color: string): Background => ({ type: "solid", color });

export function makeSlide(width: number, height: number, name = "Slide 1", background: Background = solidBg("#ffffff")): Slide {
  return {
    id: uid("slide"), name, width, height, background, elements: [], guides: { x: [], y: [] }, grid: defaultLayoutGrid(), duration: null,
  };
}

export function makeProject(kind: ProjectKind, format: Format, name = "Untitled design"): Project {
  const slide = makeSlide(format.width, format.height, kind === "carousel" ? "Slide 1" : "Design");
  const now = Date.now();
  return { id: uid("proj"), schema: 1, name, kind, format, slides: [slide], activeSlideId: slide.id, createdAt: now, updatedAt: now };
}

export const emptyFill = (kind: "image" | "video" = "image") => newFill(null, kind);

/** deep-clone an element tree with fresh ids (duplicate / paste / templates) */
export function cloneElement<T extends Element>(el: T, offset = 0): T {
  const copy = structuredClone(el) as T;
  const fresh = (e: Element) => {
    e.id = uid("el");
    if (e.type === "group") e.children.forEach(fresh);
    if (e.type === "grid") {
      const re = (n: GridEl["tree"]): void => {
        n.id = uid(n.kind === "cell" ? "c" : "s");
        if (n.kind === "split") n.children.forEach(re);
      };
      re(e.tree);
    }
  };
  fresh(copy);
  copy.x += offset;
  copy.y += offset;
  return copy;
}

export function cloneSlide(s: Slide, name?: string): Slide {
  const copy = structuredClone(s);
  copy.id = uid("slide");
  copy.name = name ?? `${s.name} copy`;
  copy.elements = copy.elements.map((e) => cloneElement(e, 0));
  return copy;
}
