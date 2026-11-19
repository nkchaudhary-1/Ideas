"use client";
import { memo, useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { Layer, Stage } from "react-konva";
import type { Slide } from "@/lib/types";
import { mediaVersion, subscribeMedia, releaseScope } from "@/lib/media";
import { onFontsLoaded } from "@/lib/fonts";
import { RenderContext } from "./render-context";
import { SlideBody } from "./ElementNode";

/** Read-only render of one slide through the same scene the editor and the exporter use. */
function SlideViewImpl({ slide, width, playing = false, scope: scopeName, className }: { slide: Slide; width: number; playing?: boolean; scope: string; className?: string }) {
  // unique per mounted view: a view being replaced must never release its successor's <video> players
  const inst = useId();
  const scope = `${scopeName}-${inst}`;
  const k = width / slide.width;
  const height = Math.round(slide.height * k);
  const mediaTick = useSyncExternalStore(subscribeMedia, mediaVersion, () => 0);
  const [fontsTick, setFonts] = useState(0);
  useEffect(() => onFontsLoaded(() => setFonts((x) => x + 1)), []);
  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const rc = useMemo(() => ({ mode: "preview" as const, pixelScale: k * dpr, playing, fontsTick, mediaTick, showPlaceholders: false, scope }), [k, dpr, playing, fontsTick, mediaTick, scope]);

  // free the <video> elements this view created when it goes away
  useEffect(() => () => releaseScope(scope), [scope]);

  return (
    <div className={className} style={{ width, height }}>
      <Stage width={width} height={height} scaleX={k} scaleY={k} listening={false}>
        <RenderContext.Provider value={rc}>
          <Layer listening={false}>
            <SlideBody slide={slide} />
          </Layer>
        </RenderContext.Provider>
      </Stage>
    </div>
  );
}
export default memo(SlideViewImpl);
