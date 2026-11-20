"use client";
import { Minus, Plus } from "lucide-react";
import { useStore, getSlide } from "@/lib/store";
import { PANORAMA_MAX, PANORAMA_MIN, panoramaCount } from "@/lib/formats";
import { firstEmptySegment } from "@/lib/store";

/** On a panorama canvas: slide numbers over each segment, and + / − on the right edge to extend or shorten it. */
export default function PanoramaHandles() {
  const st = useStore.getState;
  const view = useStore((s) => s.ui.view);
  const slide = useStore((s) => getSlide(s.project));
  const pin = useStore((s) => s.ui.pinSegment);
  const n = panoramaCount(slide.width);
  const next = pin ?? firstEmptySegment(slide);
  if (n < 2) return null;
  const sw = 1080 * view.scale;
  const right = view.x + slide.width * view.scale;
  const midY = view.y + (slide.height * view.scale) / 2;
  const top = Math.max(84, view.y - 34);
  const stop = (e: React.PointerEvent) => e.stopPropagation();
  return (
    <div className="pointer-events-none absolute inset-0 z-10" data-testid="panorama-handles">
      {Array.from({ length: n }, (_, i) => (
        <button key={i} type="button" data-testid={`pano-chip-${i + 1}`} aria-pressed={pin === i} title={pin === i ? `Layouts will go to slide ${i + 1} (click to undo)` : `Add the next layout to slide ${i + 1}`}
          onPointerDown={stop} onClick={() => st().setUI({ pinSegment: pin === i ? null : i })}
          className={`pointer-events-auto absolute -translate-x-1/2 grid h-8 min-w-8 place-items-center rounded-full px-3 text-2xs font-bold shadow-card transition-colors ${pin === i ? "bg-pill text-pillink" : next === i ? "bg-panel text-ink ring-1 ring-ink/40" : "bg-panel text-mute hover:text-ink"}`}
          style={{ left: view.x + sw * (i + 0.5), top }}>
          {i + 1}
        </button>
      ))}
      <div className="absolute flex -translate-y-1/2 flex-col gap-3" style={{ left: right + 16, top: midY }} onPointerDown={stop}>
        <button type="button" aria-label="Add a slide to the right" title="Extend by one slide" data-testid="pano-extend" disabled={n >= PANORAMA_MAX} onClick={() => st().setPanoramaSlides(n + 1)}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-pill text-pillink shadow-float hover:opacity-90 disabled:opacity-30"><Plus size={16} /></button>
        <button type="button" aria-label="Remove the last slide" title="Shorten by one slide" data-testid="pano-shorten" disabled={n <= PANORAMA_MIN} onClick={() => st().setPanoramaSlides(n - 1)}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-panel text-ink shadow-float hover:bg-field disabled:opacity-30"><Minus size={16} /></button>
      </div>
    </div>
  );
}
