"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film, Maximize2, Pause, Play, Repeat, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { dims } from "@/lib/util";
import SlideView from "@/components/canvas/SlideView";
import { slideDuration, slideHasVideo } from "@/lib/timeline";
import { pauseAllPlayers } from "@/lib/media";
import { panoramaCount } from "@/lib/formats";

type Mode = "post" | "cover";

/** Real playback of the carousel through the same renderer as export: videos play, order and cover are what you'll publish. */
export default function PreviewDialog() {
  const set = useStore((s) => s.setUI);
  const slides = useStore((s) => s.project.slides);
  const startId = useStore.getState().project.activeSlideId;
  // a panorama is cut into N frames on export, so preview it as N swipeable frames
  const frames = useMemo(() => slides.flatMap((sl) => { const parts = panoramaCount(sl.width); return Array.from({ length: parts }, (_, part) => ({ sl, part, parts })); }), [slides]);
  const [i, setI] = useState(Math.max(0, frames.findIndex((f) => f.sl.id === startId)));
  const [playing, setPlaying] = useState(true);
  const [auto, setAuto] = useState(false);
  const [mode, setMode] = useState<Mode>("post");
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  const box = useRef<HTMLDivElement>(null);
  const frame = frames[Math.min(i, frames.length - 1)];
  const slide = frame.sl;
  const dur = useMemo(() => slideDuration(slide), [slide]);

  const close = () => { pauseAllPlayers(); set({ previewOpen: false }); };
  const go = (d: number) => setI((x) => Math.max(0, Math.min(frames.length - 1, x + d)));

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key.toLowerCase() === "f") { void toggleFs(); }
      else if (e.key === "Escape" && !document.fullscreenElement) close();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // autoplay: advance after the slide's own length (longest clip, explicit duration, or 3 s for stills)
  useEffect(() => {
    if (!auto || !playing) return;
    const h = setTimeout(() => setI((x) => (x + 1 >= frames.length ? 0 : x + 1)), dur * 1000 + 250);
    return () => clearTimeout(h);
  }, [auto, playing, i, dur, frames.length]);

  const toggleFs = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await box.current?.requestFullscreen(); } catch { /* unsupported */ }
  };

  const segW = frame.parts > 1 ? 1080 : slide.width;
  const ar = segW / slide.height;
  const maxW = vp.w * 0.92 - 160, maxH = vp.h - 190;
  const w = Math.max(160, Math.min(maxW, maxH * ar, 1100));

  const cover = frames[0].sl;
  const cParts = frames[0].parts;
  const cAr = (cParts > 1 ? 1080 : cover.width) / cover.height;
  const tile = (cw: number, ch: number) => {
    const sw = Math.max(cw, ch * cAr);
    return (
      <div className="relative overflow-hidden bg-black" style={{ width: cw, height: ch }}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden" style={{ width: Math.round(sw), height: Math.round(sw / cAr) }}><SlideView slide={cover} width={Math.round(sw) * cParts} scope="cover" /></div>
      </div>
    );
  };

  return (
    <div ref={box} className="fixed inset-0 z-[90] flex flex-col bg-[#0b0b0b]" data-testid="preview-dialog" role="dialog" aria-modal="true" aria-label="Preview">
      <header className="flex h-12 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-1 rounded-full bg-panel2 p-1 text-xs">
          {(["post", "cover"] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} data-testid={`preview-mode-${m}`} className={`h-7 whitespace-nowrap rounded-full px-4 ${mode === m ? "bg-raised text-ink" : "text-mute hover:text-ink"}`}>{m === "post" ? "Post" : "Cover & grid"}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setAuto(!auto)} title="Autoplay through slides" aria-pressed={auto} className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-4 text-xs ${auto ? "bg-accent/20 text-accent" : "text-mute hover:bg-white/10 hover:text-ink"}`}><Repeat size={13} /> Autoplay</button>
          <button type="button" onClick={toggleFs} title="Fullscreen (F)" aria-label="Fullscreen" className="grid h-9 w-9 place-items-center rounded-full text-mute hover:bg-white/10 hover:text-ink"><Maximize2 size={15} /></button>
          <button type="button" onClick={close} title="Close (Esc)" aria-label="Close preview" data-testid="preview-close" className="grid h-9 w-9 place-items-center rounded-full text-mute hover:bg-white/10 hover:text-ink"><X size={16} /></button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center gap-4">
        {mode === "post" ? (
          <>
            <button type="button" aria-label="Previous slide" disabled={i === 0} onClick={() => go(-1)} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-25" data-testid="preview-prev"><ChevronLeft /></button>
            <div className="overflow-hidden rounded-sm shadow-2xl ring-1 ring-white/10" data-radius-free data-testid="preview-stage">
              <div className="relative overflow-hidden" style={{ width: Math.round(w), height: Math.round(w / ar) }}>
                <div className="absolute top-0" style={{ left: -Math.round(w) * frame.part }}>
                  <SlideView key={slide.id + String(playing)} slide={slide} width={Math.round(w) * frame.parts} playing={playing} scope="preview" />
                </div>
              </div>
            </div>
            <button type="button" aria-label="Next slide" disabled={i === frames.length - 1} onClick={() => go(1)} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-25" data-testid="preview-next"><ChevronRight /></button>
          </>
        ) : (
          <div className="flex items-start gap-10" data-testid="preview-cover">
            <figure className="space-y-2 text-center">
              <div className="grid grid-cols-3 gap-px bg-white/10">{[0, 1, 2].map((k) => k === 0 ? <div key={k}>{tile(150, 200)}</div> : <div key={k} className="bg-[#161616]" style={{ width: 150, height: 200 }} />)}</div>
              <figcaption className="text-xs text-mute">Profile grid (3:4 crop, centred)</figcaption>
            </figure>
            <figure className="space-y-2 text-center">
              {tile(200, 200)}
              <figcaption className="text-xs text-mute">Square thumbnail (1:1 crop)</figcaption>
            </figure>
            <figure className="space-y-2 text-center">
              {tile(Math.round(Math.min(260, 300 * cAr)), Math.round(Math.min(260, 300 * cAr) / cAr))}
              <figcaption className="text-xs text-mute">Full cover · {dims(cParts > 1 ? 1080 : cover.width, cover.height)}</figcaption>
            </figure>
          </div>
        )}
      </main>

      <footer className="flex h-[88px] shrink-0 flex-col items-center justify-center gap-3">
        <div className="flex items-center" data-testid="preview-dots">
          {frames.map((f, k) => (
            <button key={`${f.sl.id}-${f.part}`} type="button" aria-label={`Go to slide ${k + 1}`} onClick={() => setI(k)} className="grid h-6 min-w-6 place-items-center px-1"><span className={`block h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"}`} /></button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-mute">
          <button type="button" onClick={() => setPlaying(!playing)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label={playing ? "Pause" : "Play"} data-testid="preview-play">{playing ? <Pause size={14} /> : <Play size={14} />}</button>
          <span data-testid="preview-counter">{i + 1} / {frames.length}</span>
          <span className="text-faint">·</span>
          <span>{frame.parts > 1 ? `${slide.name} · panorama ${frame.part + 1} of ${frame.parts}` : slide.name}</span>
          {slideHasVideo(slide) && <span className="flex items-center gap-1 text-accent"><Film size={11} /> video · {dur.toFixed(1)}s</span>}
        </div>
      </footer>
    </div>
  );
}
