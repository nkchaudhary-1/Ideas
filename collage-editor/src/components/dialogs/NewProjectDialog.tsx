"use client";
import { useRef, useState } from "react";
import { GalleryHorizontal, LayoutGrid, Minus, PenSquare, Plus, Rows3, SlidersHorizontal, Square, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { dims } from "@/lib/util";
import { CUSTOM_FORMAT, FORMATS, PANORAMA_BASES, PANORAMA_MAX, PANORAMA_MIN, panoramaFormat } from "@/lib/formats";
import type { Format, ProjectKind } from "@/lib/types";
import { ACCEPT } from "@/lib/media";
import { Button, Chip, NumberField, TextButton } from "@/components/ui/controls";
import Modal from "@/components/ui/Modal";
import { createCarouselFromAssets, createCollageFromAssets } from "@/lib/workflows";
import { makeMedia } from "@/lib/factory";
import { newFill } from "@/lib/media-math";
import { startEdit } from "@/lib/edit";

type Intent = "collage" | "edit";
const INTENTS: { id: Intent; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "collage", label: "Create collage", desc: "Grids, carousels, panoramas and layouts", icon: <LayoutGrid size={22} /> },
  { id: "edit", label: "Edit photos & videos", desc: "Colour, light, looks and crops", icon: <SlidersHorizontal size={22} /> },
];

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
    <Chip data-testid={id} active={active} onClick={onClick} title={`${f.width} × ${f.height}px`} className="pl-3">
      <span className="block rounded-[3px] border-[1.5px] border-current" style={{ width: Math.max(8, f.width * k), height: Math.max(8, f.height * k) }} />
      {f.ratio}
    </Chip>
  );
}

/** The front door: what are you making, what shape, optionally start with media. */
export default function NewProjectDialog() {
  const st = useStore.getState;
  const set = useStore((s) => s.setUI);
  const [intent, setIntent] = useState<Intent>("collage");
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
      if (intent === "edit") {
        const assets = files.length ? await st().importMedia(files) : [];
        if (files.length && !assets.length) { st().toast("None of those files could be imported", "error"); return; }
        startEdit(assets);
        set({ newProjectOpen: false, leftPanel: "uploads" });
        return;
      }
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
    <Modal title="New project" onClose={() => set({ newProjectOpen: false })} width={680} testId="new-project-dialog"
      footer={<><Button onClick={() => set({ newProjectOpen: false })}>Cancel</Button><Button variant="primary" onClick={create} disabled={busy} testId="create-project">{busy ? (intent === "edit" ? "Opening…" : "Creating…") : intent === "edit" ? "Start editing" : "Create"}</Button></>}>
      <div className="space-y-9 px-8 pb-4 pt-2">
        <section>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="What are you making?">
            {INTENTS.map((i) => (
              <button key={i.id} type="button" data-testid={`intent-${i.id}`} aria-pressed={intent === i.id} onClick={() => setIntent(i.id)}
                className={`flex h-24 items-center gap-4 rounded p-5 text-left transition-colors ${intent === i.id ? "bg-pill text-pillink" : "bg-field text-ink hover:bg-raised"}`}>
                <span className={intent === i.id ? "" : "text-mute"}>{i.icon}</span>
                <span><span className="block text-sm font-bold">{i.label}</span><span className={`block text-2xs leading-4 ${intent === i.id ? "opacity-70" : "text-mute"}`}>{i.desc}</span></span>
              </button>
            ))}
          </div>
        </section>

        {intent === "edit" && (
          <section data-testid="edit-options">
            <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="new-project-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; setFiles((l) => [...l, ...f]); }} />
            <div className="flex flex-col items-center gap-4 rounded border-2 border-dotted border-faint/60 px-6 py-10 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFiles((l) => [...l, ...e.dataTransfer.files]); }}>
              <Button onClick={() => input.current?.click()}><Upload size={14} /> Add photos & videos</Button>
              <span className="max-w-sm text-xs leading-5 text-mute">
                {files.length ? `${files.length} file${files.length > 1 ? "s" : ""} ready. Each one opens as its own item you can edit alone or with others.` : "Add one or many, photos, videos or both. Each is edited on its own, or together as a batch. You can add more later."}
              </span>
              {files.length > 0 && <TextButton onClick={() => setFiles([])}>Clear</TextButton>}
            </div>
          </section>
        )}

        {intent === "collage" && (<>
        <section>
          <div className="grid grid-cols-5 gap-3">
            {MODES.map((m) => (
              <button key={m.id} type="button" data-testid={`mode-${m.id}`} onClick={() => setMode(m.id)}
                className={`flex h-32 flex-col items-start justify-between rounded p-4 text-left transition-colors ${mode === m.id ? "bg-pill text-pillink" : "bg-field text-ink hover:bg-raised"}`}>
                <span className={mode === m.id ? "" : "text-mute"}>{m.icon}</span>
                <span><span className="block text-sm font-bold">{m.label}</span><span className={`block text-2xs leading-4 ${mode === m.id ? "opacity-70" : "text-mute"}`}>{m.desc}</span></span>
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
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Fewer slides" data-testid="new-pano-minus" disabled={slides <= PANORAMA_MIN} onClick={() => setSlides((n) => n - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-field hover:bg-raised disabled:opacity-30"><Minus size={14} /></button>
                <span className="w-8 text-center text-sm font-bold tabular-nums">{slides}</span>
                <button type="button" aria-label="More slides" data-testid="new-pano-plus" disabled={slides >= PANORAMA_MAX} onClick={() => setSlides((n) => n + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-pill text-pillink hover:opacity-90 disabled:opacity-30"><Plus size={14} /></button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PANORAMA_BASES.map((b) => (
                <Chip key={b.id} active={segH === b.h} onClick={() => setSegH(b.h)}>{b.label}</Chip>
              ))}
              <span className="ml-auto text-xs text-faint">{dims(format.width, format.height)}</span>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {shown.map((f) => <RatioChip key={f.id} id={`fmt-${f.id}`} f={f} active={!custom && fmt.id === f.id} onClick={() => { setFmt(f); setCustom(false); }} />)}
              <Chip data-testid="fmt-more" onClick={() => setMore((m) => !m)} className="!bg-transparent">{more ? "Fewer sizes" : "More sizes"}</Chip>
              <Chip data-testid="fmt-custom" active={custom} onClick={() => setCustom(true)}>Custom</Chip>
            </div>
            {custom && (
              <div className="flex items-center gap-2">
                <NumberField value={cw} onChange={setCw} min={64} max={8000} step={1} label="W" width={84} />
                <NumberField value={ch} onChange={setCh} min={64} max={8000} step={1} label="H" width={84} />
              </div>
            )}
            <p className="text-xs text-mute">{dims(format.width, format.height)}{mode === "carousel" ? " · every slide shares this size" : ""}</p>
          </section>
        )}

        {mode !== "blank" && (
          <section>
            <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="new-project-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; setFiles((l) => [...l, ...f]); }} />
            <div className="flex items-center gap-4 rounded border-2 border-dotted border-faint/60 p-5" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFiles((l) => [...l, ...e.dataTransfer.files]); }}>
              <Button onClick={() => input.current?.click()}><Upload size={14} /> Add photos & videos</Button>
              <span className="text-xs text-mute">{files.length ? `${files.length} file${files.length > 1 ? "s" : ""} ready: ${mode === "carousel" ? "one slide each" : mode === "collage" ? "poured into a grid" : pano ? (files.length === 1 ? "stretched across the panorama" : "one per slide, side by side") : "the first is placed"}` : "Optional. You can add media later."}</span>
              {files.length > 0 && <TextButton className="ml-auto" onClick={() => setFiles([])}>Clear</TextButton>}
            </div>
          </section>
        )}
        </>)}
      </div>
    </Modal>
  );
}
