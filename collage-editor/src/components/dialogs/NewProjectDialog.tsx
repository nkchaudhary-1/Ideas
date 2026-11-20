"use client";
import { useRef, useState } from "react";
import { GalleryHorizontal, LayoutGrid, Minus, PenSquare, Plus, Rows3, Square, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { CUSTOM_FORMAT, FORMATS, PANORAMA_BASES, PANORAMA_MAX, PANORAMA_MIN, panoramaFormat } from "@/lib/formats";
import type { Format, ProjectKind } from "@/lib/types";
import { ACCEPT } from "@/lib/media";
import { Button, NumberField } from "@/components/ui/controls";
import Modal from "@/components/ui/Modal";
import { createCarouselFromAssets, createCollageFromAssets } from "@/lib/workflows";
import { makeMedia } from "@/lib/factory";
import { newFill } from "@/lib/media-math";

type Mode = "single" | "collage" | "carousel" | "panorama" | "blank";
const MODES: { id: Mode; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "single", label: "Single", desc: "One photo or video", icon: <Square size={20} /> },
  { id: "collage", label: "Collage", desc: "A grid of media", icon: <LayoutGrid size={20} /> },
  { id: "carousel", label: "Carousel", desc: "Swipeable slides", icon: <GalleryHorizontal size={20} /> },
  { id: "panorama", label: "Panorama", desc: "12:5 across slides", icon: <Rows3 size={20} className="rotate-90" /> },
  { id: "blank", label: "Blank", desc: "Type and layout", icon: <PenSquare size={20} /> },
];
const POPULAR = ["4-5", "1-1", "9-16", "3-4", "16-9"];

function RatioChip({ f, active, onClick, id }: { f: Format; active: boolean; onClick: () => void; id: string }) {
  const k = 20 / Math.max(f.width, f.height);
  return (
    <button type="button" data-testid={id} onClick={onClick} title={`${f.width} × ${f.height}px`}
      className={`flex items-center gap-2 rounded-full py-1.5 pl-3 pr-3.5 text-xs font-semibold transition-colors ${active ? "bg-pill text-pillink" : "bg-field text-mute hover:text-ink"}`}>
      <span className="block rounded-[3px] border-[1.5px] border-current" style={{ width: Math.max(7, f.width * k), height: Math.max(7, f.height * k) }} />
      {f.ratio}
    </button>
  );
}

/** The front door: what are you making, what shape, optionally start with media. */
export default function NewProjectDialog() {
  const st = useStore.getState;
  const set = useStore((s) => s.setUI);
  const [mode, setMode] = useState<Mode>("carousel");
  const [fmt, setFmt] = useState<Format>(FORMATS[1]);
  const [more, setMore] = useState(false);
  const [cw, setCw] = useState(1080);
  const [ch, setCh] = useState(1350);
  const [custom, setCustom] = useState(false);
  const [slides, setSlides] = useState(3);
  const [segH, setSegH] = useState(1350);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pano = mode === "panorama";
  const format = pano ? panoramaFormat(slides, segH) : custom ? CUSTOM_FORMAT(Math.max(64, Math.min(8000, cw)), Math.max(64, Math.min(8000, ch))) : fmt;

  const create = async () => {
    setBusy(true);
    try {
      const kind: ProjectKind = mode === "carousel" ? "carousel" : mode === "collage" ? "collage" : format.ratio === "9:16" ? "story" : "single";
      const name = mode === "carousel" ? "Untitled carousel" : mode === "collage" ? "Untitled collage" : pano ? "Untitled panorama" : "Untitled design";
      st().newProject({ kind, format, name });
      set({ newProjectOpen: false });
      if (files.length) {
        const assets = await st().importMedia(files);
        if (assets.length) {
          if (mode === "carousel") createCarouselFromAssets(assets);
          else if (mode === "collage") createCollageFromAssets(assets);
          else if (pano) {
            // one photo = one long panoramic image; several = one per slide, side by side
            if (assets.length === 1) st().addElement(makeMedia(assets[0].kind, format.width, format.height, newFill(assets[0].id, assets[0].kind), { name: "Panorama" }, 0, 0));
            else assets.slice(0, slides).forEach((a, i) => st().addElement(makeMedia(a.kind, 1080, segH, newFill(a.id, a.kind), { name: `Slide ${i + 1}` }, i * 1080, 0), { select: false }));
          } else st().addMediaToCanvas(assets[0]);
        }
      }
      set({ leftPanel: mode === "blank" ? "text" : mode === "collage" ? "layouts" : "uploads" });
    } finally { setBusy(false); }
  };

  const shown = more ? FORMATS : FORMATS.filter((f) => POPULAR.includes(f.id));

  return (
    <Modal title="New project" onClose={() => set({ newProjectOpen: false })} width={640} testId="new-project-dialog"
      footer={<><Button onClick={() => set({ newProjectOpen: false })}>Cancel</Button><Button variant="primary" onClick={create} disabled={busy} testId="create-project">{busy ? "Creating…" : "Create"}</Button></>}>
      <div className="space-y-9 px-8 pb-4 pt-2">
        <section>
          <div className="grid grid-cols-5 gap-3">
            {MODES.map((m) => (
              <button key={m.id} type="button" data-testid={`mode-${m.id}`} onClick={() => setMode(m.id)}
                className={`flex flex-col items-start gap-4 rounded-3xl p-4 text-left transition-colors ${mode === m.id ? "bg-pill text-pillink" : "bg-field text-ink hover:bg-raised"}`}>
                <span className={mode === m.id ? "" : "text-mute"}>{m.icon}</span>
                <span><span className="block text-sm font-bold">{m.label}</span><span className={`block text-[11px] leading-4 ${mode === m.id ? "opacity-70" : "text-mute"}`}>{m.desc}</span></span>
              </button>
            ))}
          </div>
        </section>

        {pano ? (
          <section className="space-y-4" data-testid="panorama-options">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">{format.ratio} panorama · {slides} slides</h3>
                <p className="text-xs text-mute">One wide canvas, cut into {slides} slides on export. You can extend it any time.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label="Fewer slides" data-testid="new-pano-minus" disabled={slides <= PANORAMA_MIN} onClick={() => setSlides((n) => n - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-field hover:bg-raised disabled:opacity-30"><Minus size={14} /></button>
                <span className="w-8 text-center text-sm font-bold tabular-nums">{slides}</span>
                <button type="button" aria-label="More slides" data-testid="new-pano-plus" disabled={slides >= PANORAMA_MAX} onClick={() => setSlides((n) => n + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-pill text-pillink hover:opacity-90 disabled:opacity-30"><Plus size={14} /></button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PANORAMA_BASES.map((b) => (
                <button key={b.id} type="button" onClick={() => setSegH(b.h)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${segH === b.h ? "bg-pill text-pillink" : "bg-field text-mute hover:text-ink"}`}>{b.label}</button>
              ))}
              <span className="ml-auto text-xs text-faint">{format.width} × {format.height}px</span>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {shown.map((f) => <RatioChip key={f.id} id={`fmt-${f.id}`} f={f} active={!custom && fmt.id === f.id} onClick={() => { setFmt(f); setCustom(false); }} />)}
              <button type="button" data-testid="fmt-more" onClick={() => setMore((m) => !m)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink">{more ? "Fewer sizes" : "More sizes"}</button>
              <button type="button" data-testid="fmt-custom" onClick={() => setCustom(true)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${custom ? "bg-pill text-pillink" : "bg-field text-mute hover:text-ink"}`}>Custom</button>
            </div>
            {custom && (
              <div className="flex items-center gap-2">
                <NumberField value={cw} onChange={setCw} min={64} max={8000} step={1} label="W" width={84} />
                <NumberField value={ch} onChange={setCh} min={64} max={8000} step={1} label="H" width={84} />
              </div>
            )}
            <p className="text-xs text-mute">{format.width} × {format.height}px{mode === "carousel" ? " · every slide shares this size" : ""}</p>
          </section>
        )}

        {mode !== "blank" && (
          <section>
            <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="new-project-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; setFiles((l) => [...l, ...f]); }} />
            <div className="flex items-center gap-4 rounded-3xl border border-dashed border-faint/60 p-5" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFiles((l) => [...l, ...e.dataTransfer.files]); }}>
              <Button onClick={() => input.current?.click()}><Upload size={14} /> Add photos & videos</Button>
              <span className="text-xs text-mute">{files.length ? `${files.length} file${files.length > 1 ? "s" : ""} ready: ${mode === "carousel" ? "one slide each" : mode === "collage" ? "poured into a grid" : pano ? (files.length === 1 ? "stretched across the panorama" : "one per slide, side by side") : "the first is placed"}` : "Optional. You can add media later."}</span>
              {files.length > 0 && <button type="button" className="ml-auto text-xs font-semibold text-mute hover:text-ink" onClick={() => setFiles([])}>Clear</button>}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
