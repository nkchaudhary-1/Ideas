"use client";
import { useRef, useState } from "react";
import { Check, Copy, Film, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { keys } from "@/lib/util";
import { useCompact } from "@/lib/use-media";
import SlideView from "@/components/canvas/SlideView";
import { addAssetsToEdit, isEmptyEdit, mediaOf, selectSlides, selectWhere, slideKind } from "@/lib/edit";
import { getAsset, ACCEPT } from "@/lib/media";
import { fillIsNeutral } from "@/lib/filters";
import { Chip } from "@/components/ui/controls";


/** The filmstrip in Edit mode: every photo and video, with multi-select for batch edits. */
export default function EditStrip() {
  const st = useStore.getState;
  const slides = useStore((s) => s.project.slides);
  const activeId = useStore((s) => s.project.activeSlideId);
  const sel = useStore((s) => s.ui.mediaSel);
  const refId = useStore((s) => s.ui.refSlideId);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const anchor = useRef<string>(activeId);
  const input = useRef<HTMLInputElement>(null);
  const items = slides.filter((s) => !isEmptyEdit(s));
  const photos = items.filter((s) => slideKind(s) === "image").length;
  const videos = items.length - photos;
  const chosen = new Set(sel.length ? sel : [activeId]);
  const phone = useCompact();
  const TH = phone ? 52 : 76;

  const click = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey) {
      const a = slides.findIndex((s) => s.id === anchor.current), b = slides.findIndex((s) => s.id === id);
      const [lo, hi] = [Math.min(a < 0 ? b : a, b), Math.max(a < 0 ? b : a, b)];
      selectSlides(slides.slice(lo, hi + 1).map((s) => s.id), id);
    } else if (e.metaKey || e.ctrlKey) toggle(id);
    else { anchor.current = id; selectSlides([id], id); }
  };
  const toggle = (id: string) => {
    anchor.current = id;
    if (chosen.has(id)) {
      const rest = [...chosen].filter((x) => x !== id);
      if (rest.length) selectSlides(rest, id === activeId ? rest[rest.length - 1] : activeId);
    } else selectSlides([...chosen, id], id);
  };

  const add = async (files: File[]) => {
    if (!files.length) return;
    const assets = await st().importMedia(files);
    if (assets.length) addAssetsToEdit(assets);
  };

  return (
    <div className={`card relative flex shrink-0 flex-col ${phone ? "h-[148px]" : "h-[184px]"}`} data-testid="slide-strip" data-edit-strip>
      <div className={`no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto pt-4 ${phone ? "px-4" : "px-8"}`} data-testid="select-bar">
        <span className="mr-1 shrink-0 whitespace-nowrap text-xs font-bold text-ink" data-testid="selection-count">{chosen.size > 1 ? `${chosen.size} selected` : `${items.length} item${items.length === 1 ? "" : "s"}`}</span>
        <Chip sm data-testid="select-all" onClick={() => selectWhere("all")}>All</Chip>
        <Chip sm data-testid="select-photos" disabled={!photos} onClick={() => selectWhere("image")}>Photos{photos ? ` · ${photos}` : ""}</Chip>
        <Chip sm data-testid="select-videos" disabled={!videos} onClick={() => selectWhere("video")}>Videos{videos ? ` · ${videos}` : ""}</Chip>
        <Chip sm data-testid="select-none" disabled={chosen.size < 2} onClick={() => selectWhere("none")}>None</Chip>
        <span className="ml-auto hidden min-w-0 truncate text-2xs text-faint lg:block" title={`Shift-click for a range, ${keys("⌘")}-click to add`}>Shift-click for a range, {keys("⌘")}-click to add</span>
      </div>
      <div className={`flex min-h-0 flex-1 items-center gap-4 overflow-x-auto ${phone ? "px-4 pb-4" : "px-8 pb-5"}`}>
        {slides.map((s, i) => {
          if (isEmptyEdit(s)) return null;
          const w = Math.max(phone ? 24 : 40, Math.min(150, Math.round(TH * (s.width / s.height))));
          const active = s.id === activeId, picked = chosen.has(s.id), isRef = s.id === refId;
          const f = mediaOf(s)?.fill;
          const edited = !!f && (!fillIsNeutral(f) || !!f.match);
          return (
            <div key={s.id} className="group relative flex shrink-0 flex-col items-center gap-1" draggable data-testid="slide-thumb" data-slide-id={s.id} data-selected={picked} data-active={active}
              onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = "move"; }}
              onDragOver={(e) => { if (drag !== null) { e.preventDefault(); setOver(i); } }}
              onDragLeave={() => setOver((o) => (o === i ? null : o))}
              onDrop={(e) => { e.preventDefault(); setOver(null); if (drag !== null && drag !== i) st().moveSlide(drag, i); setDrag(null); }}
              onDragEnd={() => { setDrag(null); setOver(null); }}>
              <button type="button" aria-label={`Select ${s.name}`} aria-pressed={picked} data-testid="thumb-open" onClick={(e) => click(e, s.id)}
                className={`relative overflow-hidden rounded ring-2 transition ${active ? "ring-ink/70" : picked ? "ring-accent/80" : over === i ? "ring-ink/50" : "ring-transparent hover:ring-ink/25"}`}>
                <div className="pointer-events-none"><SlideView slide={s} width={w} scope="strip" /></div>
                {slideKind(s) === "video" && <span className="absolute bottom-1 left-1 grid h-4 w-4 place-items-center rounded-full bg-black/70 text-white" title="Video"><Film size={9} /></span>}
                {isRef && <span className="absolute bottom-1 right-1 rounded-full bg-black/75 px-2 text-2xs font-bold leading-4 text-white" data-testid="ref-badge">REF</span>}
                {edited && !isRef && <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-accent ring-1 ring-black/40" title="Edited" />}
              </button>
              <button type="button" role="checkbox" aria-checked={picked} aria-label={`${picked ? "Deselect" : "Select"} ${s.name}`} data-testid="thumb-check" onClick={() => toggle(s.id)}
                className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full border text-white transition ${picked ? "grad-accent border-transparent opacity-100" : "border-white/80 bg-black/40 opacity-0 group-hover:opacity-100 touch:opacity-100"}`}>{picked && <Check size={13} strokeWidth={3} />}</button>
              <span className={`max-w-[152px] truncate text-2xs font-semibold ${active ? "text-ink" : "text-mute"}`} title={getAsset(f?.assetId ?? "")?.name ?? s.name}>{s.name}</span>
              <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex touch:!hidden">
                <button type="button" aria-label="Duplicate" title="Duplicate" onClick={() => st().duplicateSlide(s.id)} className="grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white hover:bg-black"><Copy size={12} /></button>
                <button type="button" aria-label="Remove from editor" title="Remove from editor" data-testid="thumb-remove" onClick={() => st().removeEditSlides([s.id])} className="grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="edit-add-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; void add(f); }} />
        <button type="button" aria-label="Add photos or videos" title="Add photos or videos" data-testid="add-slide" onClick={() => input.current?.click()}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("Files") || e.dataTransfer.types.includes("application/x-asset")) e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); const a = getAsset(e.dataTransfer.getData("application/x-asset")); if (a) addAssetsToEdit([a]); else void add([...e.dataTransfer.files]); }}
          className={`grid shrink-0 place-items-center rounded border-2 border-dotted border-faint/60 text-mute hover:border-ink/50 hover:text-ink ${phone ? "h-[52px] w-[52px]" : "h-[76px] w-[64px]"}`}><Plus size={18} /></button>
      </div>
    </div>
  );
}
