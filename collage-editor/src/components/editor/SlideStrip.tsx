"use client";
import { useRef, useState } from "react";
import { Copy, Film, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { slideHasVideo } from "@/lib/timeline";
import SlideView from "@/components/canvas/SlideView";
import { createCarouselFromAssets } from "@/lib/workflows";
import { getAsset } from "@/lib/media";
import { makeSlide } from "@/lib/factory";
import { panoramaCount } from "@/lib/formats";


export default function SlideStrip() {
  const st = useStore.getState;
  const slides = useStore((s) => s.project.slides);
  const activeId = useStore((s) => s.project.activeSlideId);
  const kind = useStore((s) => s.project.kind);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [rename, setRename] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const compact = slides.length === 1 && kind !== "carousel";
  const TH = compact ? 44 : 72; // thumbnail height budget

  const addBlank = () => {
    const cur = slides.find((s) => s.id === activeId) ?? slides[0];
    const slide = makeSlide(cur.width, cur.height, `Slide ${slides.length + 1}`, structuredClone(cur.background));
    st().addSlide({ slide, afterId: slides[slides.length - 1].id });
    if (kind !== "carousel") st().commit((p) => { p.kind = "carousel"; });
    setMenu(false);
    requestAnimationFrame(() => scroller.current?.scrollTo({ left: 1e6, behavior: "smooth" }));
  };

  return (
    <div className={`card relative flex shrink-0 items-stretch ${compact ? "h-[76px]" : "h-[120px]"}`} data-testid="slide-strip">
      <div ref={scroller} className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto px-5 py-2">
        {slides.map((s, i) => {
          const ar = s.width / s.height;
          const w = Math.max(36, Math.min(compact ? 160 : 260, Math.round(TH * ar)));
          const segs = panoramaCount(s.width);
          const active = s.id === activeId;
          return (
            <div key={s.id} className="group relative flex shrink-0 flex-col items-center gap-1"
              draggable
              onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("application/x-slide", String(i)); }}
              onDragOver={(e) => { if (drag !== null || e.dataTransfer.types.includes("application/x-asset")) { e.preventDefault(); setOver(i); } }}
              onDragLeave={() => setOver((o) => (o === i ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const aid = e.dataTransfer.getData("application/x-asset");
                if (aid && getAsset(aid)) { st().setActiveSlide(s.id); st().addMediaToCanvas(getAsset(aid)!); return; }
                if (drag !== null && drag !== i) st().moveSlide(drag, i);
                setDrag(null);
              }}
              onDragEnd={() => { setDrag(null); setOver(null); }}
              data-testid="slide-thumb" data-slide-id={s.id}
            >
              <button type="button" aria-label={`Open ${s.name}`} aria-current={active} onClick={() => st().setActiveSlide(s.id)}
                className={`relative overflow-hidden rounded-md ring-2 transition ${active ? "ring-accent" : over === i ? "ring-ink/60" : "ring-transparent hover:ring-ink/25"}`}>
                <div className="pointer-events-none"><SlideView slide={s} width={w} scope="strip" /></div>
                {segs > 1 && Array.from({ length: segs - 1 }, (_, k) => <span key={k} className="pointer-events-none absolute inset-y-0 w-px border-l border-dashed border-white/90 mix-blend-difference" style={{ left: `${((k + 1) / segs) * 100}%` }} />)}
                {slideHasVideo(s) && <span className="absolute bottom-1 left-1 grid h-4 w-4 place-items-center rounded-full bg-black/70 text-white" title="Contains video"><Film size={9} /></span>}
              </button>
              {rename === s.id ? (
                <input autoFocus defaultValue={s.name} className="h-5 w-20 rounded bg-panel2 px-1 text-center text-2xs outline-none ring-1 ring-accent/70"
                  onBlur={(e) => { st().renameSlide(s.id, e.target.value || s.name); setRename(null); }}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur(); }} />
              ) : (
                <span className={`max-w-[160px] truncate text-2xs font-semibold ${active ? "text-ink" : "text-mute"}`} onDoubleClick={() => setRename(s.id)} title="Double-click to rename">{segs > 1 ? `${s.name} · ${segs} slides` : `${i + 1} · ${s.name}`}</span>
              )}
              <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
                <button type="button" aria-label="Duplicate slide" title="Duplicate slide" onClick={() => st().duplicateSlide(s.id)} className="grid h-5 w-5 place-items-center rounded bg-black/70 text-white hover:bg-black"><Copy size={10} /></button>
                {slides.length > 1 && <button type="button" aria-label="Delete slide" title="Delete slide" onClick={() => st().deleteSlide(s.id)} className="grid h-5 w-5 place-items-center rounded bg-black/70 text-white hover:bg-red-600"><Trash2 size={10} /></button>}
              </div>
            </div>
          );
        })}
        <div className="relative shrink-0">
          <button type="button" aria-label="Add slide" title="Add slide" data-testid="add-slide" onClick={() => setMenu((m) => !m)}
            onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-asset")) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); const a = getAsset(e.dataTransfer.getData("application/x-asset")); if (a) createCarouselFromAssets([a]); }}
            className={`grid place-items-center rounded-xl border border-dashed border-faint/60 text-mute hover:border-accent hover:text-accent ${compact ? "h-[44px] w-[44px]" : "h-[72px] w-[56px]"}`}><Plus size={18} /></button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="card pop absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-2xl p-1.5 text-sm shadow-float">
                <button type="button" className="block w-full rounded-xl px-3 py-2 text-left font-medium hover:bg-field" onClick={addBlank} data-testid="add-blank-slide">Blank slide</button>
                <button type="button" className="block w-full rounded-xl px-3 py-2 text-left font-medium hover:bg-field" onClick={() => { st().duplicateSlide(activeId); setMenu(false); }}>Duplicate current slide</button>
                <button type="button" className="block w-full rounded-xl px-3 py-2 text-left font-medium hover:bg-field" onClick={() => { st().setUI({ leftPanel: "templates" }); setMenu(false); st().toast("Pick a template, then use + to add it as a new slide", "info"); }}>From template…</button>
                <button type="button" className="block w-full rounded-xl px-3 py-2 text-left font-medium hover:bg-field" onClick={() => { st().setUI({ importOpen: true, importQueue: [] }); setMenu(false); }}>From photos & videos…</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 pl-2 pr-5 text-2xs text-mute">
        <span className="text-xs font-bold text-ink">{slides.length === 1 && panoramaCount(slides[0].width) > 1 ? `${panoramaCount(slides[0].width)} slides` : `${slides.length} slide${slides.length > 1 ? "s" : ""}`}</span>
        <span>{slides.length === 1 && panoramaCount(slides[0].width) > 1 ? "Panorama" : kind === "carousel" || slides.length > 1 ? "Carousel" : "Single"}</span>
      </div>
    </div>
  );
}
