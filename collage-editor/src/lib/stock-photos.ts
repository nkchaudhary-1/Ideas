import type { Element, GridNode, MediaFill, Slide } from "./types";
import { registerPreviewAsset } from "./media";
import { newFill } from "./media-math";
import { assetUrl } from "./util";

/**
 * The three bundled sample photos (public/samples), with their average colour and three framings each. Empty photo frames in previews
 * are dressed with them: the photo closest in colour to the frame's tint first, and, when a design has more frames than photos, the same
 * photos again in a tighter crop, so no two frames show the same view.
 */
const STOCK = [
  { id: "stock-penguin", file: "sample-1.jpg", rgb: [30, 60, 74], crops: [{ zoom: 1, fx: 0.46, fy: 0.5 }, { zoom: 2.1, fx: 0.45, fy: 0.48 }, { zoom: 1.7, fx: 0.8, fy: 0.6 }] },
  { id: "stock-sandpiper", file: "sample-2.jpg", rgb: [215, 180, 142], crops: [{ zoom: 1, fx: 0.36, fy: 0.45 }, { zoom: 2.2, fx: 0.37, fy: 0.38 }, { zoom: 1.6, fx: 0.12, fy: 0.62 }] },
  { id: "stock-leaf", file: "sample-3.jpg", rgb: [42, 62, 67], crops: [{ zoom: 1, fx: 0.5, fy: 0.5 }, { zoom: 2.3, fx: 0.5, fy: 0.52 }, { zoom: 1.8, fx: 0.35, fy: 0.2 }] },
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

/** A copy of the slide where every empty photo frame and grid cell holds one of the sample photos (see STOCK). */
export function withStockPhotos(slide: Slide): Slide {
  const out = structuredClone(slide);
  const uses = new Map<string, number>();
  const photo = (tint: string): MediaFill => {
    const t = hexRgb(tint) ?? [128, 128, 128];
    const dist = (rgb: readonly number[]) => (rgb[0] - t[0]) ** 2 + (rgb[1] - t[1]) ** 2 + (rgb[2] - t[2]) ** 2;
    const least = Math.min(...STOCK.map((x) => uses.get(x.id) ?? 0));
    const best = STOCK.filter((x) => (uses.get(x.id) ?? 0) === least).sort((a, b) => dist(a.rgb) - dist(b.rgb))[0];
    const n = uses.get(best.id) ?? 0;
    uses.set(best.id, n + 1);
    return { ...newFill(best.id, "image"), ...best.crops[n % best.crops.length] };
  };
  const tree = (n: GridNode, tint: string) => {
    if (n.kind === "split") n.children.forEach((c) => tree(c, tint));
    else if (!n.fill) n.fill = photo(n.bg ?? tint);
  };
  const walk = (els: Element[]) => els.forEach((e) => {
    if (e.type === "image" && !e.fill) e.fill = photo(e.bg);
    else if (e.type === "grid") tree(e.tree, e.cellBg);
    else if (e.type === "group") walk(e.children);
  });
  walk(out.elements);
  return out;
}
