import type { Slide } from "../types";
import { createRenderer } from "./render";

export type ImageFormat = "png" | "jpeg" | "webp";
export const MIME: Record<ImageFormat, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };
export const EXT: Record<ImageFormat, string> = { png: "png", jpeg: "jpg", webp: "webp" };

/** browsers refuse canvases beyond ~16k px a side / ~268 MP; stay well inside */
export const MAX_SIDE = 8192;
export function clampScale(slide: Pick<Slide, "width" | "height">, scale: number) {
  return Math.min(scale, MAX_SIDE / Math.max(slide.width, slide.height));
}

export function canvasToBlob(c: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error(`This browser can't encode ${format.toUpperCase()}.`))), MIME[format], quality);
  });
}

export interface ImageOptions {
  format: ImageFormat;
  /** output pixels per document unit (1 = the canvas size, 2 = double) */
  scale: number;
  quality: number;
  transparent: boolean;
  /** cut a multi-slide panorama (width a multiple of 1080) into 1080-wide pieces */
  slicePanorama: boolean;
}

export const isPanorama = (s: Pick<Slide, "width">) => s.width >= 2160 && s.width % 1080 === 0;

/** rasterise a slide (videos show their poster frame) and return one or more image blobs */
export async function exportSlideImages(slide: Slide, o: ImageOptions): Promise<Blob[]> {
  const scale = clampScale(slide, o.scale);
  const transparent = o.transparent && o.format !== "jpeg";
  const r = await createRenderer(slide, { scale, transparent });
  try {
    await r.ready();
    if (r.hasVideo()) { await r.seekAll(-1); await r.ready(); }
    const full = r.frame();
    if (!(o.slicePanorama && isPanorama(slide))) {
      const blob = await canvasToBlob(full, o.format, o.quality);
      full.width = 0;
      return [blob];
    }
    const n = slide.width / 1080;
    const pw = Math.round(1080 * scale);
    const out: Blob[] = [];
    for (let i = 0; i < n; i++) {
      const part = document.createElement("canvas");
      part.width = pw;
      part.height = full.height;
      part.getContext("2d")!.drawImage(full, i * pw, 0, pw, full.height, 0, 0, pw, full.height);
      out.push(await canvasToBlob(part, o.format, o.quality));
      part.width = 0;
    }
    full.width = 0;
    return out;
  } finally {
    r.destroy();
  }
}
