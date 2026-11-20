import type { GridEl, LayoutData, LookData, MediaFill, PresetKind, Slide, TextEl, TextStyleData, UserPreset } from "./types";
import { mapCells } from "./grid-engine";

export const KIND_LABEL: Record<PresetKind, string> = { look: "Look", text: "Style", size: "Size", layout: "Layout" };

/** "Look 3": the next free number for a kind */
export function defaultName(presets: UserPreset[], kind: PresetKind, base?: string): string {
  const stem = base ?? KIND_LABEL[kind];
  const used = new Set(presets.filter((p) => p.kind === kind).map((p) => p.name));
  for (let i = 1; i < 1000; i++) if (!used.has(`${stem} ${i}`)) return `${stem} ${i}`;
  return stem;
}

export const captureLook = (fill: MediaFill): LookData => ({ filter: { ...fill.filter }, adjustments: { ...fill.adjustments } });

export const sameLook = (fill: MediaFill, look: LookData) =>
  fill.filter.id === look.filter.id && fill.filter.intensity === look.filter.intensity && JSON.stringify(fill.adjustments) === JSON.stringify(look.adjustments);

export function captureTextStyle(el: TextEl, slide: Pick<Slide, "width">): TextStyleData {
  return {
    fontFamily: el.fontFamily, sizeRatio: el.fontSize / slide.width, fontWeight: el.fontWeight, italic: el.italic, underline: el.underline, strike: el.strike,
    align: el.align, lineHeight: el.lineHeight, letterRatio: el.letterSpacing / slide.width, textTransform: el.textTransform,
    fill: structuredClone(el.fill), stroke: el.stroke ? { ...el.stroke } : null, background: el.background ? { ...el.background } : null, shadow: el.shadow ? { ...el.shadow } : null,
  };
}

export function captureLayout(g: GridEl, slide: Pick<Slide, "width">): LayoutData {
  return {
    tree: mapCells(structuredClone(g.tree), (c) => ({ ...c, fill: null })),
    margin: g.margin, gutter: g.gutter, radius: g.radius, cellBg: g.cellBg, cellStroke: g.cellStroke ? { ...g.cellStroke } : null, refWidth: g.width || slide.width,
  };
}

/** a readable chip background for previewing a style whose text may be white or black */
export function previewBg(color: string): string {
  const c = color.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c.slice(0, 6), 16);
  if (Number.isNaN(n)) return "#2b2b33";
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.6 ? "#26233f" : "#f1f1f6";
}
