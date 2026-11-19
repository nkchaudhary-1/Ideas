import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import type { Slide } from "../types";
import { RenderContext, ReadyTracker, type RenderCtx } from "@/components/canvas/render-context";
import { SlideBody } from "@/components/canvas/ElementNode";
import { releaseScope } from "../media";
import { uid } from "../util";

export interface SlideRenderer {
  /** pixels per document unit */
  scale: number;
  width: number;
  height: number;
  /** wait for fonts, photos and video elements to be decodable */
  ready(): Promise<void>;
  /** seek every video element to time t (seconds into the slide); t < 0 means the poster frame */
  seekAll(t: number): Promise<void>;
  hasVideo(): boolean;
  /** rasterise the current state to a fresh canvas at `scale` */
  frame(): HTMLCanvasElement;
  destroy(): void;
}

const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Renders a slide through the very same Konva scene the editor displays, off-screen, in `export` mode.
 * No editor chrome (selection handles, guides, rulers, grid overlays) is part of this tree.
 */
export async function createRenderer(slide: Slide, opts: { scale: number; transparent?: boolean }): Promise<SlideRenderer> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-100000px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;visibility:hidden";
  document.body.appendChild(host);

  const tracker = new ReadyTracker();
  const scope = `export-${uid("r")}`;
  let stage: Konva.Stage | null = null;
  const rc: RenderCtx = {
    mode: "export",
    pixelScale: opts.scale,
    playing: false,
    fontsTick: 0,
    mediaTick: 0,
    showPlaceholders: false,
    registerReady: tracker.register,
    registerVideo: tracker.registerVideo,
    scope,
  };
  const root = createRoot(host);
  flushSync(() => {
    root.render(
      <Stage ref={(r) => { stage = r; }} width={slide.width} height={slide.height} listening={false}>
        <RenderContext.Provider value={rc}>
          <Layer listening={false}>
            <SlideBody slide={slide} transparentBg={opts.transparent} />
          </Layer>
        </RenderContext.Provider>
      </Stage>,
    );
  });

  return {
    scale: opts.scale,
    width: slide.width,
    height: slide.height,
    async ready() {
      await tracker.whenReady();
      // let React commit font-driven re-measures (auto-height text) before we rasterise
      await raf();
      await raf();
      stage?.getLayers().forEach((l) => l.draw());
    },
    async seekAll(t) {
      await Promise.all([...tracker.videos.values()].map((seek) => seek(t)));
    },
    hasVideo: () => tracker.videos.size > 0,
    frame() {
      if (!stage) throw new Error("renderer not ready");
      return stage.toCanvas({ pixelRatio: opts.scale });
    },
    destroy() {
      try { root.unmount(); } catch { /* already gone */ }
      host.remove();
      releaseScope(scope);
    },
  };
}
