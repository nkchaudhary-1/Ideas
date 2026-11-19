import type { Slide } from "../types";
import { createRenderer } from "./render";

/** ~320px JPEG data URL of a slide (videos show their poster frame) */
export async function makeThumb(slide: Slide): Promise<string | null> {
  const r = await createRenderer(slide, { scale: 320 / Math.max(slide.width, slide.height) });
  try {
    await r.ready(6000);
    if (r.hasVideo()) { await r.seekAll(-1); await r.ready(6000); }
    const c = r.frame();
    const url = c.toDataURL("image/jpeg", 0.72);
    c.width = 0;
    return url;
  } finally {
    r.destroy();
  }
}
