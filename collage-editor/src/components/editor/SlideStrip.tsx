"use client";
import { useRef, useState } from "react";
import { Copy, Film, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { slideHasVideo } from "@/lib/timeline";
import SlideView from "@/components/canvas/SlideView";
import { createCarouselFromAssets } from "@/lib/workflows";
import { getAsset } from "@/lib/media";
import { makeSlide } from "@/lib/factory";

const TH = 78; // thumbnail height budget

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

  const addBlank = () => {
    const cur = slides.find((s) => s.id === activeId) ?? slides[0];
    const slide = makeSlide(cur.width, cur.height, `Slide ${slides.length + 1}`, structuredClone(cur.background));
    st().addSlide({ slide, afterId: slides[slides.length - 1].id });
    if (kind !== "carousel") st().commit((p) => { p.kind = "carousel"; });
    setMenu(false);
    requestAnimationFrame(() => scroller.current?.scrollTo({ left: 1e6, behavior: "smooth" }));
  };

  return (
    <div className="relative flex h-[132px] shrink-0 items-stretch border-t border-line bg-panel" data-testid="slide-strip">
      <div ref={scroller} className="flex flex-1 items-center gap-3 overflow-x-auto px-4 py-2">
        {slides.map((s, i) => {
          const ar = s.width / s.height;
          const w = Math.max(44, Math.min(130, Math.round(TH * ar)));
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
                className={`relative overflow-hidden rounded-md ring-2 transition ${active ? "ring-accent" : over === i ? "ring-white/60" : "ring-transparent hover:ring-white/25"}`}>
                <div className="pointer-events-none"><SlideView slide={s} width={w} scope="strip" /></div>
                {slideHasVideo(s) && <span className="absolute bottom-1 left-1 grid h-4 w-4 place-items-center rounded-full bg-black/70 text-white" title="Contains video"><Film size={9} /></span>}
              </button>
              {rename === s.id ? (
                <input autoFocus defaultValue={s.name} className="h-5 w-20 rounded bg-panel2 px-1 text-center text-2xs outline-none ring-1 ring-accent/70"
                  onBlur={(e) => { st().renameSlide(s.id, e.target.value || s.name); setRename(null); }}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur(); }} />
              ) : (
                <span className={`max-w-[110px] truncate text-2xs ${active ? "text-ink" : "text-mute"}`} onDoubleClick={() => setRename(s.id)} title="Double-click to rename">{i + 1} · {s.name}</span>
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
            className="grid h-[78px] w-[62px] place-items-center rounded-md border border-dashed border-line text-mute hover:border-mute hover:text-ink"><Plus size={18} /></button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="absolute bottom-full left-0 z-50 mb-2 w-52 overflow-hidden rounded-lg border border-line bg-raised py-1 text-sm shadow-xl">
                <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-white/10" onClick={addBlank} data-testid="add-blank-slide">Blank slide</button>
                <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-white/10" onClick={() => { st().duplicateSlide(activeId); setMenu(false); }}>Duplicate current slide</button>
                <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-white/10" onClick={() => { st().setUI({ leftPanel: "templates" }); setMenu(false); st().toast("Pick a template, then use + to add it as a new slide", "info"); }}>From template…</button>
                <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-white/10" onClick={() => { st().setUI({ importOpen: true, importQueue: [] }); setMenu(false); }}>From photos & videos…</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex w-28 shrink-0 flex-col items-end justify-center gap-0.5 border-l border-line px-3 text-2xs text-faint">
        <span className="text-xs text-mute">{slides.length} slide{slides.length > 1 ? "s" : ""}</span>
        <span>{kind === "carousel" || slides.length > 1 ? "Carousel" : "Single"}</span>
      </div>
    </div>
  );
}
