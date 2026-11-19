"use client";
import { useRef, useState } from "react";
import { GalleryHorizontal, LayoutGrid, PenSquare, Smartphone, Square, Upload, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { CUSTOM_FORMAT, FORMATS, PANORAMA_FORMATS } from "@/lib/formats";
import type { Format, ProjectKind } from "@/lib/types";
import { ACCEPT } from "@/lib/media";
import { Button, NumberField } from "@/components/ui/controls";
import Modal from "@/components/ui/Modal";
import { createCarouselFromAssets, createCollageFromAssets } from "@/lib/workflows";

type Mode = "single" | "collage" | "carousel" | "blank";
const MODES: { id: Mode; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "single", label: "Single image", desc: "One photo, framed and edited", icon: <Square size={18} /> },
  { id: "collage", label: "Collage", desc: "Photos & videos in a grid or freeform", icon: <LayoutGrid size={18} /> },
  { id: "carousel", label: "Carousel", desc: "Several slides, photos and videos mixed", icon: <GalleryHorizontal size={18} /> },
  { id: "blank", label: "Blank design", desc: "Typography, editorial, anything", icon: <PenSquare size={18} /> },
];

/** The simple front door: pick what you're making, the format, optionally drop media, go. */
export default function NewProjectDialog() {
  const st = useStore.getState;
  const set = useStore((s) => s.setUI);
  const [mode, setMode] = useState<Mode>("carousel");
  const [fmt, setFmt] = useState<Format>(FORMATS[1]);
  const [cw, setCw] = useState(1080);
  const [ch, setCh] = useState(1350);
  const [custom, setCustom] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const format = custom ? CUSTOM_FORMAT(Math.max(64, Math.min(8000, cw)), Math.max(64, Math.min(8000, ch))) : fmt;
  const first = useStore((s) => s.project);
  void first;

  const create = async () => {
    setBusy(true);
    try {
      const kind: ProjectKind = mode === "carousel" ? "carousel" : mode === "collage" ? "collage" : format.ratio === "9:16" ? "story" : "single";
      const p = st().newProject({ kind, format, name: mode === "carousel" ? "Untitled carousel" : mode === "collage" ? "Untitled collage" : "Untitled design" });
      void p;
      set({ newProjectOpen: false });
      if (files.length) {
        const assets = await st().importMedia(files);
        if (assets.length) {
          if (mode === "carousel") createCarouselFromAssets(assets);
          else if (mode === "collage") createCollageFromAssets(assets);
          else st().addMediaToCanvas(assets[0]);
        }
      }
      set({ leftPanel: mode === "blank" ? "text" : mode === "collage" ? "layouts" : "uploads" });
    } finally { setBusy(false); }
  };

  const ratioBox = (f: Format) => {
    const k = 22 / Math.max(f.width, f.height);
    return <span className="block rounded-[2px] border border-current" style={{ width: Math.max(6, f.width * k), height: Math.max(6, f.height * k) }} />;
  };

  return (
    <Modal title="New project" onClose={() => set({ newProjectOpen: false })} width={620} testId="new-project-dialog"
      footer={<><Button onClick={() => set({ newProjectOpen: false })}>Cancel</Button><Button variant="primary" onClick={create} disabled={busy} testId="create-project">{busy ? "Creating…" : "Create"}</Button></>}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-mute">What are you making?</h3>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button key={m.id} type="button" data-testid={`mode-${m.id}`} onClick={() => setMode(m.id)} className={`flex items-start gap-3 rounded-lg border p-3 text-left ${mode === m.id ? "border-accent bg-accent/10" : "border-line bg-panel2 hover:border-mute"}`}>
                <span className={mode === m.id ? "text-accent" : "text-mute"}>{m.icon}</span>
                <span><span className="block text-sm font-medium">{m.label}</span><span className="block text-xs text-mute">{m.desc}</span></span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-mute">
            <span>Aspect ratio</span>
            {mode === "carousel" && <span className="normal-case tracking-normal text-faint">One ratio for every slide, as Instagram requires</span>}
          </h3>
          <div className="grid grid-cols-5 gap-1.5">
            {FORMATS.map((f) => (
              <button key={f.id} type="button" data-testid={`fmt-${f.id}`} onClick={() => { setFmt(f); setCustom(false); }} className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 ${!custom && fmt.id === f.id ? "border-accent bg-accent/10 text-accent" : "border-line bg-panel2 text-mute hover:text-ink"}`}>
                <span className="grid h-6 place-items-center">{ratioBox(f)}</span>
                <span className="text-xs font-medium">{f.ratio}</span>
                <span className="text-[10px] leading-none text-faint">{f.id === "9-16" ? "Story/Reel" : f.id === "4-5" ? "Feed" : f.id === "191-1" ? "Landscape" : `${f.width}×${f.height}`}</span>
              </button>
            ))}
            <button type="button" data-testid="fmt-custom" onClick={() => setCustom(true)} className={`flex flex-col items-center justify-center gap-1 rounded-md border px-1 py-2 ${custom ? "border-accent bg-accent/10 text-accent" : "border-line bg-panel2 text-mute hover:text-ink"}`}>
              <span className="text-lg leading-none">+</span><span className="text-xs font-medium">Custom</span>
            </button>
            {mode !== "blank" && PANORAMA_FORMATS.map((f) => (
              <button key={f.id} type="button" onClick={() => { setFmt(f); setCustom(false); }} className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 ${!custom && fmt.id === f.id ? "border-accent bg-accent/10 text-accent" : "border-line bg-panel2 text-mute hover:text-ink"}`}>
                <span className="grid h-6 place-items-center">{ratioBox(f)}</span>
                <span className="text-xs font-medium">{f.label.replace("Panorama · ", "Pano ")}</span>
                <span className="text-[10px] leading-none text-faint">{f.width}×{f.height}</span>
              </button>
            ))}
          </div>
          {custom && (
            <div className="mt-2 flex items-center gap-2 text-xs text-mute">
              <NumberField value={cw} onChange={setCw} min={64} max={8000} step={1} label="W" />
              <X size={12} />
              <NumberField value={ch} onChange={setCh} min={64} max={8000} step={1} label="H" />
              <span>{format.ratio}</span>
            </div>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-faint"><Smartphone size={12} /> {format.width}×{format.height}px · {format.ratio}. Ratio can be changed later; content is kept.</p>
        </section>

        {mode !== "blank" && (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-mute">Start with media <span className="normal-case tracking-normal text-faint">(optional)</span></h3>
            <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="new-project-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; setFiles((l) => [...l, ...f]); }} />
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-line p-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFiles((l) => [...l, ...e.dataTransfer.files]); }}>
              <Button onClick={() => input.current?.click()}><Upload size={13} /> Choose photos & videos</Button>
              <span className="text-xs text-mute">{files.length ? `${files.length} file${files.length > 1 ? "s" : ""} ready: ${mode === "carousel" ? "one slide each" : mode === "collage" ? "poured into a grid" : "first one is placed"}` : "Or skip and add them later from the Uploads panel."}</span>
              {files.length > 0 && <button type="button" className="ml-auto text-xs text-mute hover:text-ink" onClick={() => setFiles([])}>Clear</button>}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
