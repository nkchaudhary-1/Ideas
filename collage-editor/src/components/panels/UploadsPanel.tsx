"use client";
import { useMemo, useRef, useState } from "react";
import { Check, Film, ImagePlus, Images, LayoutGrid, Search, Trash2, Upload, GalleryHorizontal } from "lucide-react";
import { useStore, getSlide } from "@/lib/store";
import { ACCEPT } from "@/lib/media";
import type { Asset } from "@/lib/types";
import { assetUrl, formatBytes, formatTime } from "@/lib/util";
import { Button, Empty, Select } from "@/components/ui/controls";
import { createCarouselFromAssets, createCollageFromAssets } from "@/lib/workflows";
import { useFillTargetLite } from "./useReplaceTarget";

const SAMPLES = Array.from({ length: 9 }, (_, i) => ({ url: assetUrl(`samples/dharamshala-${i + 1}.jpg`), name: `dharamshala-${i + 1}.jpg` }));

export default function UploadsPanel() {
  const assets = useStore((s) => s.assets);
  const filter = useStore((s) => s.ui.libraryFilter);
  const sel = useStore((s) => s.ui.assetSelection);
  const st = useStore.getState;
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "name" | "type" | "size">("new");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const replaceTarget = useFillTargetLite();

  const list = useMemo(() => {
    let l = assets.filter((a) => (filter === "all" || a.kind === filter) && a.name.toLowerCase().includes(q.toLowerCase()));
    l = [...l].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "type" ? a.kind.localeCompare(b.kind) || b.createdAt - a.createdAt : sort === "size" ? b.size - a.size : b.createdAt - a.createdAt));
    return l;
  }, [assets, filter, q, sort]);

  const toggle = (id: string) => st().setUI({ assetSelection: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id] });
  const chosen = sel.map((id) => assets.find((a) => a.id === id)).filter(Boolean) as Asset[];

  const click = (a: Asset, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) { toggle(a.id); return; }
    if (replaceTarget) { replaceTarget(a); return; }
    st().addMediaToCanvas(a);
  };

  const loadSamples = async () => {
    setBusy(true);
    try {
      const { importUrls } = await import("@/lib/media");
      const res = await importUrls(SAMPLES);
      st().refreshAssets();
      st().toast(`Added ${res.assets.length} sample photos from your Dharamshala board`, "ok");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="uploads-panel"
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
      onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); st().setUI({ importQueue: [...e.dataTransfer.files], importOpen: true }); } }}
    >
      <div className="space-y-2 border-b border-line p-3">
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="file-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) st().setUI({ importQueue: f, importOpen: true }); }} />
        <Button variant="primary" className="w-full !h-8" onClick={() => input.current?.click()} testId="upload-button"><Upload size={14} /> Upload photos & videos</Button>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="Search" aria-label="Search media" className="h-7 w-full rounded-md bg-panel2 pl-6 pr-2 text-xs outline-none ring-1 ring-line focus:ring-accent/70" />
          </div>
          <Select width={78} value={sort} options={[{ value: "new", label: "Newest" }, { value: "name", label: "Name" }, { value: "type", label: "Type" }, { value: "size", label: "Size" }]} onChange={setSort} className="!h-7" />
        </div>
        <div className="flex gap-1">
          {(["all", "image", "video"] as const).map((f) => (
            <button key={f} type="button" onClick={() => st().setUI({ libraryFilter: f })} className={`h-6 flex-1 rounded-md text-xs ${filter === f ? "bg-raised text-ink" : "text-mute hover:text-ink"}`}>
              {{ all: "All", image: "Photos", video: "Videos" }[f]}
            </button>
          ))}
        </div>
        {replaceTarget && <div className="rounded-md bg-accent/10 px-2 py-1.5 text-2xs leading-4 text-accent">Click media to <b>replace</b> the selected frame. Shift-click to select several.</div>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {assets.length === 0 ? (
          <Empty>
            <ImagePlus className="mx-auto mb-2" size={22} />
            Drop photos and videos here, or upload them.<br />
            JPG, PNG, WebP · MP4, MOV, WebM
            <div className="mt-3"><Button onClick={loadSamples} disabled={busy} testId="load-samples">{busy ? "Loading…" : "Try your Dharamshala photos"}</Button></div>
          </Empty>
        ) : (
          <div className="grid grid-cols-3 gap-2" data-testid="asset-grid">
            {list.map((a) => {
              const on = sel.includes(a.id);
              return (
                <div key={a.id} className="group relative" data-testid="asset-tile">
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("application/x-asset", a.id); e.dataTransfer.effectAllowed = "copy"; }}
                    onClick={(e) => click(a, e)}
                    title={`${a.name}\n${a.width}×${a.height} · ${formatBytes(a.size)}`}
                    className={`relative block aspect-square w-full overflow-hidden rounded-md ring-1 ${on ? "ring-2 ring-accent" : "ring-line hover:ring-ink/40"}`}
                  >
                    <img src={a.thumb} alt={a.name} className="h-full w-full object-cover" draggable={false} />
                    {a.kind === "video" && <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/75 px-1 py-0.5 text-2xs text-white"><Film size={9} /> {formatTime(a.duration ?? 0)}</span>}
                  </button>
                  <button type="button" onClick={() => toggle(a.id)} aria-label={on ? "Deselect" : "Select"} className={`absolute left-1 top-1 grid h-4 w-4 place-items-center rounded border ${on ? "border-accent bg-accent text-white" : "border-white/60 bg-black/40 text-white opacity-0 group-hover:opacity-100"}`}>{on && <Check size={11} strokeWidth={3} />}</button>
                  <button type="button" onClick={() => void st().deleteAsset(a.id)} aria-label={`Delete ${a.name}`} className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded bg-black/60 opacity-0 hover:text-red-300 group-hover:opacity-100 text-white"><Trash2 size={10} /></button>
                </div>
              );
            })}
          </div>
        )}
        {assets.length > 0 && <div className="mt-3"><Button variant="ghost" onClick={loadSamples} disabled={busy}>{busy ? "Loading…" : "Add your Dharamshala sample photos"}</Button></div>}
      </div>

      {chosen.length > 0 && (
        <div className="space-y-1.5 border-t border-line bg-panel2 p-2.5" data-testid="selection-actions">
          <div className="flex items-center justify-between text-xs"><span>{chosen.length} selected</span><button type="button" className="text-mute hover:text-ink" onClick={() => st().setUI({ assetSelection: [] })}>Clear</button></div>
          <div className="grid grid-cols-2 gap-1.5">
            <Button onClick={() => { createCarouselFromAssets(chosen); st().setUI({ assetSelection: [] }); }} testId="sel-carousel"><GalleryHorizontal size={12} /> Carousel</Button>
            <Button onClick={() => { createCollageFromAssets(chosen); st().setUI({ assetSelection: [] }); }} testId="sel-collage"><LayoutGrid size={12} /> Collage</Button>
            <Button onClick={() => chosen.forEach((a) => st().addMediaToCanvas(a))}><Images size={12} /> To canvas</Button>
            <Button variant="danger" onClick={() => { chosen.forEach((a) => void st().deleteAsset(a.id)); st().setUI({ assetSelection: [] }); }}><Trash2 size={12} /> Delete</Button>
          </div>
        </div>
      )}
      {void getSlide}
    </div>
  );
}
