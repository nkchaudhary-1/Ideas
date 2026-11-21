import type { Template } from "./templates";
import { ensureStockPhotos, withStockPhotos } from "./stock-photos";

/**
 * Template thumbnails are the real slide, drawn by the same renderer as the editor and export, with the sample pictures in the empty
 * photo frames. They are made one at a time, on demand, and kept for the session.
 */
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();
let queue: Promise<unknown> = Promise.resolve();

export const cachedThumb = (id: string) => cache.get(id) ?? null;

async function render(t: Template): Promise<string | null> {
  const [{ createRenderer }] = await Promise.all([import("./export/render"), ensureStockPhotos()]);
  const slide = withStockPhotos(t.build()[0]);
  const r = await createRenderer(slide, { scale: 360 / Math.max(slide.width, slide.height) });
  try {
    await r.ready(8000);
    const c = r.frame();
    const url = c.toDataURL("image/jpeg", 0.88);
    c.width = 0;
    return url;
  } finally {
    r.destroy();
  }
}

export function templateThumb(t: Template): Promise<string | null> {
  const hit = cache.get(t.id);
  if (hit) return Promise.resolve(hit);
  let job = inflight.get(t.id);
  if (!job) {
    job = (queue = queue.then(() => render(t)).catch(() => null)) as Promise<string | null>;
    inflight.set(t.id, job);
    void job.then((url) => { if (url) cache.set(t.id, url); inflight.delete(t.id); });
  }
  return job;
}
