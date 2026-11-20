"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Film, GalleryHorizontal, ImageIcon, LayoutGrid, Library, Loader2, Square, Trash2, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { ACCEPT, importFiles, removeAsset } from "@/lib/media";
import type { Asset } from "@/lib/types";
import { formatBytes, formatTime } from "@/lib/util";
import { Button } from "@/components/ui/controls";
import Modal from "@/components/ui/Modal";
import { createCarouselFromAssets, createCollageFromAssets } from "@/lib/workflows";

interface Item { key: string; name: string; state: "working" | "ready" | "failed"; asset?: Asset; reason?: string }

/** Mixed photo + video intake: shows what was understood, what was refused (and why), then routes the selection. */
export default function ImportDialog() {
  const st = useStore.getState;
  const queue = useStore((s) => s.ui.importQueue);
  const [items, setItems] = useState<Item[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [dragKey, setDragKey] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const running = useRef(false);

  const close = () => st().setUI({ importOpen: false, importQueue: [] });

  const ingest = async (files: File[]) => {
    const base = Date.now();
    const fresh: Item[] = files.map((f, i) => ({ key: `${base}-${i}`, name: f.name, state: "working" }));
    setItems((l) => [...l, ...fresh]);
    for (let i = 0; i < files.length; i++) {
      const res = await importFiles([files[i]]);
      const a = res.assets[0];
      setItems((l) => l.map((it) => (it.key === fresh[i].key ? (a ? { ...it, state: "ready", asset: a } : { ...it, state: "failed", reason: res.rejected[0]?.reason ?? "Couldn't import this file." }) : it)));
      if (a) setPicked((p) => new Set(p).add(fresh[i].key));
      st().refreshAssets();
    }
  };

  useEffect(() => {
    if (!queue.length || running.current) return;
    running.current = true;
    const files = queue;
    st().setUI({ importQueue: [] });
    void ingest(files).finally(() => { running.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  const ready = items.filter((i) => i.state === "ready" && i.asset);
  const chosen = ready.filter((i) => picked.has(i.key)).map((i) => i.asset!) as Asset[];
  const busy = items.some((i) => i.state === "working");
  const nVid = chosen.filter((a) => a.kind === "video").length;
  const toggle = (k: string) => setPicked((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const move = (k: string, d: number) => setItems((l) => { const i = l.findIndex((x) => x.key === k); const j = i + d; if (i < 0 || j < 0 || j >= l.length) return l; const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = async (it: Item) => {
    setItems((l) => l.filter((x) => x.key !== it.key));
    setPicked((p) => { const n = new Set(p); n.delete(it.key); return n; });
    if (it.asset) await st().deleteAsset(it.asset.id);
  };
  void removeAsset;

  const run = (fn: (a: Asset[]) => void) => { fn(chosen); close(); };
  const allSelected = ready.length > 0 && ready.every((i) => picked.has(i.key));

  return (
    <Modal title="Import photos & videos" onClose={close} width={680} testId="import-dialog"
      footer={
        <>
          <span className="mr-auto text-xs text-mute">{chosen.length} selected{nVid ? ` · ${nVid} video${nVid > 1 ? "s" : ""}` : ""}</span>
          <Button onClick={close} testId="import-library" title="Keep everything in the library and close"><Library size={13} /> Add to library</Button>
          <Button disabled={!chosen.length || busy} onClick={() => run((a) => st().addMediaToCanvas(a[0]))} testId="import-single" title="Place the first selected item on the current slide"><Square size={13} /> Single</Button>
          <Button disabled={chosen.length < 1 || busy} onClick={() => run(createCollageFromAssets)} testId="import-collage"><LayoutGrid size={13} /> Collage</Button>
          <Button variant="primary" disabled={!chosen.length || busy} onClick={() => run(createCarouselFromAssets)} testId="import-carousel"><GalleryHorizontal size={13} /> Carousel</Button>
        </>
      }
    >
      <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="import-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) void ingest(f); }} />
      <div
        className="m-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-line px-4 py-3 text-sm text-mute"
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); const f = [...e.dataTransfer.files]; if (f.length) void ingest(f); }}
      >
        <span>Drop more files here, or add them from your computer. Photos and videos can be mixed freely.</span>
        <Button onClick={() => input.current?.click()}><Upload size={13} /> Add files</Button>
      </div>

      {items.length > 0 && (
        <div className="px-4 pb-1">
          <div className="mb-2 flex items-center justify-between text-xs text-mute">
            <button type="button" className="hover:text-ink" onClick={() => setPicked(allSelected ? new Set() : new Set(ready.map((i) => i.key)))}>{allSelected ? "Select none" : "Select all"}</button>
            <span>Order here becomes slide / cell order. Drag to reorder.</span>
          </div>
          <ul className="space-y-1.5 pb-3" data-testid="import-list">
            {items.map((it, idx) => (
              <li key={it.key} draggable={it.state === "ready"} onDragStart={() => setDragKey(it.key)} onDragOver={(e) => { if (dragKey) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (dragKey && dragKey !== it.key) { const from = items.findIndex((x) => x.key === dragKey); move(dragKey, idx - from); } setDragKey(null); }}
                className={`flex items-center gap-3 rounded-lg border px-2.5 py-2 ${it.state === "failed" ? "border-red-500/30 bg-red-500/5" : picked.has(it.key) ? "border-accent/50 bg-accent/5" : "border-line bg-panel2"}`} data-testid="import-item">
                <button type="button" aria-label={picked.has(it.key) ? "Deselect" : "Select"} disabled={it.state !== "ready"} onClick={() => toggle(it.key)} className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${picked.has(it.key) ? "border-accent bg-accent text-white" : "border-line"} disabled:opacity-30`}>{picked.has(it.key) && <Check size={12} />}</button>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-black">
                  {it.asset ? <img src={it.asset.thumb} alt="" className="h-full w-full object-cover" /> : it.state === "working" ? <Loader2 size={16} className="absolute inset-0 m-auto animate-spin text-mute" /> : <AlertTriangle size={16} className="absolute inset-0 m-auto text-red-300" />}
                  {it.asset?.kind === "video" && <Film size={11} className="absolute bottom-0.5 left-0.5 text-white drop-shadow" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{it.name}</div>
                  <div className={`truncate text-xs ${it.state === "failed" ? "text-red-300 whitespace-normal" : "text-mute"}`}>
                    {it.state === "working" && "Reading…"}
                    {it.state === "failed" && it.reason}
                    {it.asset && <>{it.asset.kind === "video" ? <Film size={10} className="mr-1 inline" /> : <ImageIcon size={10} className="mr-1 inline" />}{it.asset.width}×{it.asset.height} · {formatBytes(it.asset.size)}{it.asset.duration ? ` · ${formatTime(it.asset.duration)}` : ""}{it.asset.kind === "video" && it.asset.hasAudio === false ? " · no audio" : ""}</>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button type="button" aria-label="Move up" disabled={idx === 0} onClick={() => move(it.key, -1)} className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-ink/10 disabled:opacity-30"><ArrowUp size={13} /></button>
                  <button type="button" aria-label="Move down" disabled={idx === items.length - 1} onClick={() => move(it.key, 1)} className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-ink/10 disabled:opacity-30"><ArrowDown size={13} /></button>
                  <button type="button" aria-label="Remove" title={it.asset ? "Remove and delete from library" : "Dismiss"} onClick={() => remove(it)} className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-red-500/20 hover:text-red-300"><Trash2 size={13} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {items.length === 0 && <p className="px-4 pb-6 text-sm text-faint">Nothing queued yet.</p>}
      <p className="px-4 pb-4 text-xs leading-relaxed text-faint">
        Supported: JPG, PNG, WebP, MP4, MOV, WebM. Videos must use a codec your browser can decode (H.264/AAC MP4 works everywhere; HEVC .mov works in Safari). If a clip is refused, convert it first, e.g. <code className="rounded bg-panel2 px-1">ffmpeg -i in.mov -c:v libx264 -c:a aac out.mp4</code>. Originals are never altered. Everything stays on this device.
      </p>
    </Modal>
  );
}
