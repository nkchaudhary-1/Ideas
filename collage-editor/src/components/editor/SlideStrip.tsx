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
import { useCompact } from "@/lib/use-media";


export default function SlideStrip() {
  const st = useStore.getState;
  const slides = useStore((s) => s.project.slides);
  const activeId = useStore((s) => s.project.activeSlideId);
  const kind = useStore((s) => s.project.kind);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [rename, setRename] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ left: number; bottom: number } | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const toggleMenu = () => {
    if (menu) { setMenu(null); return; }
    const r = addRef.current?.getBoundingClientRect();
    if (!r) return;
    // open upward from the button; keep it inside the window
    setMenu({ left: Math.max(16, Math.min(r.left, window.innerWidth - 256)), bottom: window.innerHeight - r.top + 12 });
  };
  const scroller = useRef<HTMLDivElement>(null);
  const phone = useCompact();
  const compact = slides.length === 1 && kind !== "carousel";
  const TH = phone ? 52 : compact ? 52 : 88; // thumbnail height budget

  const addBlank = () => {
    const cur = slides.find((s) => s.id === activeId) ?? slides[0];
    const slide = makeSlide(cur.width, cur.height, `Slide ${slides.length + 1}`, structuredClone(cur.background));
    st().addSlide({ slide, afterId: slides[slides.length - 1].id });
    if (kind !== "carousel") st().commit((p) => { p.kind = "carousel"; });
    setMenu(null);
    requestAnimationFrame(() => scroller.current?.scrollTo({ left: 1e6, behavior: "smooth" }));
  };

  return (
    <div className={`relative flex shrink-0 items-stretch ${phone ? "h-[68px]" : `card ${compact ? "h-[92px]" : "h-[144px]"}`}`} data-testid="slide-strip">
      <div ref={scroller} className={`flex min-w-0 flex-1 items-center overflow-x-auto ${phone ? "gap-3 px-1 py-2" : "gap-4 px-8 py-3"}`}>
        {slides.map((s, i) => {
          const ar = s.width / s.height;
          const w = Math.max(phone ? 28 : 36, Math.min(compact ? 160 : 260, Math.round(TH * ar)));
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
                className={`relative overflow-hidden ring-2 transition ${phone ? "rounded" : compact ? "rounded-in-10" : "rounded-in-19"} ${active ? "ring-ink/60" : over === i ? "ring-ink/60" : "ring-transparent hover:ring-ink/25"}`}>
                <div className="pointer-events-none"><SlideView slide={s} width={w} scope="strip" /></div>
                {segs > 1 && Array.from({ length: segs - 1 }, (_, k) => <span key={k} className="pointer-events-none absolute inset-y-0 w-px border-l-2 border-dotted border-white/90 mix-blend-difference" style={{ left: `${((k + 1) / segs) * 100}%` }} />)}
                {slideHasVideo(s) && <span className="absolute bottom-1 left-1 grid h-4 w-4 place-items-center rounded-full bg-black/70 text-white" title="Contains video"><Film size={9} /></span>}
              </button>
              {phone ? null : rename === s.id ? (
                <input autoFocus defaultValue={s.name} className="h-5 w-20 rounded bg-panel2 px-1 text-center text-2xs outline-none ring-1 ring-ink/30"
                  onBlur={(e) => { st().renameSlide(s.id, e.target.value || s.name); setRename(null); }}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur(); }} />
              ) : (
                <span className={`max-w-[160px] truncate text-2xs font-semibold ${active ? "text-ink" : "text-mute"}`} onDoubleClick={() => setRename(s.id)} title="Double-click to rename">{segs > 1 ? `${s.name} · ${segs} slides` : `${i + 1} · ${s.name}`}</span>
              )}
              <div className={`absolute right-1 top-1 hidden gap-1 group-hover:flex ${phone ? "!hidden" : ""} ${active ? "touch:flex" : ""}`}>
                <button type="button" aria-label="Duplicate slide" title="Duplicate slide" onClick={() => st().duplicateSlide(s.id)} className="grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white hover:bg-black"><Copy size={12} /></button>
                {slides.length > 1 && <button type="button" aria-label="Delete slide" title="Delete slide" onClick={() => st().deleteSlide(s.id)} className="grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"><Trash2 size={12} /></button>}
              </div>
            </div>
          );
        })}
        <div className="flex shrink-0 flex-col items-center gap-1">
        <button ref={addRef} type="button" aria-label="Add slide" title="Add slide" data-testid="add-slide" onClick={toggleMenu}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-asset")) e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); const a = getAsset(e.dataTransfer.getData("application/x-asset")); if (a) createCarouselFromAssets([a]); }}
          className={`grid shrink-0 place-items-center border-2 border-dotted border-faint/60 text-mute hover:border-ink/50 hover:text-ink ${phone ? "h-[52px] w-[52px] rounded" : compact ? "h-[52px] w-[52px] rounded-in-11" : "h-[88px] w-[64px] rounded-in-19"}`}><Plus size={18} /></button>
        {!phone && <span className="text-2xs" aria-hidden>&nbsp;</span>}
        </div>
      </div>
      <div className={`shrink-0 flex-col items-end justify-center pl-4 pr-7 text-2xs text-mute ${phone ? "hidden" : "flex"}`}>
        <span className="text-xs font-bold text-ink">{slides.length === 1 && panoramaCount(slides[0].width) > 1 ? `${panoramaCount(slides[0].width)} slides` : `${slides.length} slide${slides.length > 1 ? "s" : ""}`}</span>
      </div>
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div className="card pop fixed z-50 w-60 overflow-hidden p-2 text-sm shadow-float" style={{ left: menu.left, bottom: menu.bottom }} data-testid="add-slide-menu">
            <button type="button" className="flex h-10 w-full items-center rounded-in-8 px-4 text-left font-medium hover:bg-field" onClick={addBlank} data-testid="add-blank-slide">Blank slide</button>
            <button type="button" className="flex h-10 w-full items-center rounded-in-8 px-4 text-left font-medium hover:bg-field" onClick={() => { st().duplicateSlide(activeId); setMenu(null); }}>Duplicate current slide</button>
            <button type="button" className="flex h-10 w-full items-center rounded-in-8 px-4 text-left font-medium hover:bg-field" onClick={() => { st().setUI({ leftPanel: "templates" }); setMenu(null); st().toast("Pick a template, then use + to add it as a new slide", "info"); }}>From template…</button>
            <button type="button" className="flex h-10 w-full items-center rounded-in-8 px-4 text-left font-medium hover:bg-field" onClick={() => { st().setUI({ importOpen: true, importQueue: [] }); setMenu(null); }}>From photos & videos…</button>
          </div>
        </>
      )}
    </div>
  );
}
