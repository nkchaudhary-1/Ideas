"use client";
import { createContext, useContext } from "react";

export interface RenderCtx {
  /** edit = live editor, preview = read-only playback, export = offscreen full-quality render */
  mode: "edit" | "preview" | "export";
  /** pixels-per-document-unit the canvas is displayed at (stage scale × devicePixelRatio) */
  pixelScale: number;
  playing: boolean;
  /** export mode: components register a probe that returns true once their media/fonts are ready */
  registerReady?: (probe: () => boolean) => () => void;
  /** export mode: per-element video seek handles */
  registerVideo?: (key: string, seek: (t: number) => Promise<void>) => () => void;
  fontsTick: number;
  mediaTick: number;
  /** hide per-element placeholders (empty frame hints) */
  showPlaceholders: boolean;
  /** separates <video> players between stages (editor, thumbnails, preview) so they never fight over one element */
  scope?: string;
}

export const RenderContext = createContext<RenderCtx>({
  mode: "edit", pixelScale: 1, playing: false, fontsTick: 0, mediaTick: 0, showPlaceholders: true,
});
export const useRender = () => useContext(RenderContext);

/** coordinator for offscreen export: waits until every registered probe is happy */
export class ReadyTracker {
  probes = new Set<() => boolean>();
  videos = new Map<string, (t: number) => Promise<void>>();
  register = (p: () => boolean) => { this.probes.add(p); return () => { this.probes.delete(p); }; };
  registerVideo = (k: string, f: (t: number) => Promise<void>) => { this.videos.set(k, f); return () => { this.videos.delete(k); }; };
  async whenReady(timeoutMs = 30000) {
    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, 30));
    for (;;) {
      let ok = true;
      for (const p of this.probes) if (!p()) { ok = false; break; }
      if (ok) return;
      if (performance.now() - t0 > timeoutMs) throw new Error("Timed out waiting for media to load");
      await new Promise((r) => setTimeout(r, 40));
    }
  }
}
