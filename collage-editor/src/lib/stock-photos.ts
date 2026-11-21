import type { Element, GridNode, Slide } from "./types";
import { registerPreviewAsset } from "./media";
import { newFill } from "./media-math";
import { assetUrl } from "./util";

/** The bundled sample pictures (public/samples), with their average colour, used to dress empty photo frames in previews. */
const STOCK = [
  { id: "stock-1", file: "sample-1.jpg", rgb: [184, 126, 106] },
  { id: "stock-2", file: "sample-2.jpg", rgb: [116, 156, 158] },
  { id: "stock-3", file: "sample-3.jpg", rgb: [88, 58, 99] },
  { id: "stock-4", file: "sample-4.jpg", rgb: [201, 160, 103] },
  { id: "stock-5", file: "sample-5.jpg", rgb: [94, 157, 170] },
  { id: "stock-6", file: "sample-6.jpg", rgb: [151, 154, 159] },
  { id: "stock-7", file: "sample-7.jpg", rgb: [60, 28, 77] },
  { id: "stock-8", file: "sample-8.jpg", rgb: [201, 206, 227] },
  { id: "stock-9", file: "sample-9.jpg", rgb: [15, 25, 52] },
] as const;

let loading: Promise<void> | null = null;
/** load the sample pictures once; they are registered as preview-only media */
export function ensureStockPhotos(): Promise<void> {
  loading ??= Promise.all(STOCK.map(async (s) => {
    try {
      const res = await fetch(assetUrl(`samples/${s.file}`));
      if (!res.ok) return;
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      registerPreviewAsset({ id: s.id, kind: "image", name: s.file, mime: blob.type || "image/jpeg", size: blob.size, width: bmp.width, height: bmp.height, createdAt: 0, thumb: "", status: "ready" }, blob);
      bmp.close();
    } catch { /* a missing sample just leaves that frame tinted */ }
  })).then(() => undefined);
  return loading;
}

const hexRgb = (c: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * A copy of the slide where every empty photo frame and grid cell holds one of the sample pictures: the one closest in colour to the
 * frame's own tint (so a green frame gets a green picture), and a different one for each frame while there are pictures left.
 */
export function withStockPhotos(slide: Slide): Slide {
  const out = structuredClone(slide);
  const used = new Set<string>();
  const pick = (tint: string) => {
    const t = hexRgb(tint) ?? [128, 128, 128];
    const dist = (rgb: readonly number[]) => (rgb[0] - t[0]) ** 2 + (rgb[1] - t[1]) ** 2 + (rgb[2] - t[2]) ** 2;
    const free = STOCK.filter((s) => !used.has(s.id));
    const best = [...(free.length ? free : STOCK)].sort((a, b) => dist(a.rgb) - dist(b.rgb))[0];
    used.add(best.id);
    return best.id;
  };
  const tree = (n: GridNode, tint: string) => {
    if (n.kind === "split") n.children.forEach((c) => tree(c, tint));
    else if (!n.fill) n.fill = newFill(pick(n.bg ?? tint), "image");
  };
  const walk = (els: Element[]) => els.forEach((e) => {
    if (e.type === "image" && !e.fill) e.fill = newFill(pick(e.bg), "image");
    else if (e.type === "grid") tree(e.tree, e.cellBg);
    else if (e.type === "group") walk(e.children);
  });
  walk(out.elements);
  return out;
}
