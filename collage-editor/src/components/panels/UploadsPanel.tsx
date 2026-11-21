"use client";
import { useMemo, useRef, useState } from "react";
import { Check, Film, ImagePlus, Images, LayoutGrid, Search, SlidersHorizontal, Trash2, Upload, GalleryHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { ACCEPT } from "@/lib/media";
import type { Asset } from "@/lib/types";
import { assetUrl, formatBytes, formatTime } from "@/lib/util";
import { Button, Empty, Segmented, Select, TextButton } from "@/components/ui/controls";
import { createCarouselFromAssets, createCollageFromAssets } from "@/lib/workflows";
import { addAssetsToEdit } from "@/lib/edit";
import { useFillTargetLite } from "./useReplaceTarget";

const SAMPLES = [["penguin", 1], ["sandpiper", 2], ["leaf", 3]].map(([name, n]) => ({ url: assetUrl(`samples/sample-${n}.jpg`), name: `${name}.jpg` }));

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
  const editMode = useStore((s) => s.project.kind === "edit");

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
      st().toast(`Added ${res.assets.length} sample photos`, "ok");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="uploads-panel"
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
      onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); st().setUI({ importQueue: [...e.dataTransfer.files], importOpen: true }); } }}
    >
      <div className="space-y-3 px-8 pb-5">
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="file-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) st().setUI({ importQueue: f, importOpen: true }); }} />
        <Button variant="primary" className="w-full" onClick={() => input.current?.click()} testId="upload-button"><Upload size={14} /> Upload photos & videos</Button>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="Search" aria-label="Search media" className="h-9 w-full rounded-full bg-field pl-10 pr-4 text-xs outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/40" />
          </div>
          <Select width={104} value={sort} options={[{ value: "new", label: "Newest" }, { value: "name", label: "Name" }, { value: "type", label: "Type" }, { value: "size", label: "Size" }]} onChange={setSort} />
        </div>
        <Segmented block value={filter} onChange={(f) => st().setUI({ libraryFilter: f })} options={[{ value: "all", label: "All" }, { value: "image", label: "Photos" }, { value: "video", label: "Videos" }]} />
        {replaceTarget && <div className="rounded bg-ink/[0.06] px-4 py-3 text-2xs leading-4 text-ink">Click media to <b>replace</b> the selected frame. Shift-click to select several.</div>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-6 pt-2">
        {assets.length === 0 ? (
          <Empty>
            <ImagePlus className="mx-auto mb-2" size={22} />
            Drop photos and videos here, or upload them.<br />
            JPG, PNG, WebP · MP4, MOV, WebM
            <div className="mt-3"><Button onClick={loadSamples} disabled={busy} testId="load-samples">{busy ? "Loading…" : "Try sample photos"}</Button></div>
          </Empty>
        ) : (
          <div className="grid grid-cols-3 gap-3" data-testid="asset-grid">
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
                    className={`relative block aspect-square w-full overflow-hidden rounded ring-1 ring-inset ${on ? "ring-2 ring-ink/60" : "ring-line hover:ring-ink/40"}`}
                  >
                    <img src={a.thumb} alt={a.name} className="h-full w-full object-cover" draggable={false} />
                    {a.kind === "video" && <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/75 px-1 py-0.5 text-2xs text-white"><Film size={9} /> {formatTime(a.duration ?? 0)}</span>}
                  </button>
                  <button type="button" onClick={() => toggle(a.id)} aria-label={on ? "Deselect" : "Select"} className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full border ${on ? "border-ink grad-accent text-white" : "border-white/60 bg-black/40 text-white opacity-0 group-hover:opacity-100 touch:opacity-100"}`}>{on && <Check size={13} strokeWidth={3} />}</button>
                  <button type="button" onClick={() => void st().deleteAsset(a.id)} aria-label={`Delete ${a.name}`} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 hover:text-red-300 group-hover:opacity-100 touch:opacity-100"><Trash2 size={12} /></button>
                </div>
              );
            })}
          </div>
        )}
        {assets.length > 0 && <div className="mt-4"><Button onClick={loadSamples} disabled={busy}>{busy ? "Loading…" : "Add sample photos"}</Button></div>}
      </div>

      {chosen.length > 0 && (
        <div className="space-y-3 border-t border-line/60 bg-panel2 p-5" data-testid="selection-actions">
          <div className="flex h-8 items-center justify-between text-xs"><span>{chosen.length} selected</span><TextButton className="-mr-3" onClick={() => st().setUI({ assetSelection: [] })}>Clear</TextButton></div>
          <div className="grid grid-cols-2 gap-3">
            {editMode ? (
              <Button variant="primary" className="col-span-2" onClick={() => { addAssetsToEdit(chosen); st().setUI({ assetSelection: [] }); }} testId="sel-edit"><Images size={12} /> Add to editor</Button>
            ) : (
              <>
                <Button onClick={() => { createCarouselFromAssets(chosen); st().setUI({ assetSelection: [] }); }} testId="sel-carousel"><GalleryHorizontal size={12} /> Carousel</Button>
                <Button onClick={() => { createCollageFromAssets(chosen); st().setUI({ assetSelection: [] }); }} testId="sel-collage"><LayoutGrid size={12} /> Collage</Button>
                <Button onClick={() => chosen.forEach((a) => st().addMediaToCanvas(a))}><Images size={12} /> To canvas</Button>
                <Button onClick={() => { addAssetsToEdit(chosen); st().setUI({ assetSelection: [] }); }} testId="sel-edit"><SlidersHorizontal size={12} /> Edit</Button>
              </>
            )}
            <Button variant="danger" onClick={() => { chosen.forEach((a) => void st().deleteAsset(a.id)); st().setUI({ assetSelection: [] }); }}><Trash2 size={12} /> Delete</Button>
          </div>
        </div>
      )}
    </div>
  );
}
