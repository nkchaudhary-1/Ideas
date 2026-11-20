"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff, Film, Group as GroupIcon, Image as ImageIcon, LayoutGrid, Lock, Shapes, Trash2, Type, Unlock, Ungroup } from "lucide-react";
import { useStore, getSlide } from "@/lib/store";
import type { Element } from "@/lib/types";
import { Empty } from "@/components/ui/controls";

const ICON = { image: ImageIcon, video: Film, text: Type, shape: Shapes, grid: LayoutGrid, group: GroupIcon } as const;

function Row({ el, depth, index, list }: { el: Element; depth: number; index: number; list: Element[] }) {
  const st = useStore.getState;
  const selected = useStore((s) => s.selection.includes(el.id));
  const [open, setOpen] = useState(true);
  const [edit, setEdit] = useState(false);
  const [over, setOver] = useState<"above" | "below" | null>(null);
  const Icon = ICON[el.type] ?? ImageIcon;
  const label = el.type === "text" ? el.text.slice(0, 28) || "Text" : el.name;
  const isVideo = el.type === "video";
  return (
    <>
      <div
        data-testid="layer-row"
        data-layer-id={el.id}
        draggable={!edit}
        onDragStart={(e) => { e.dataTransfer.setData("application/x-layer", el.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-layer")) { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setOver(e.clientY < r.top + r.height / 2 ? "above" : "below"); } }}
        onDragLeave={() => setOver(null)}
        onDrop={(e) => {
          const id = e.dataTransfer.getData("application/x-layer");
          setOver(null);
          if (!id || id === el.id) return;
          // list is bottom→top; "above" in the UI means a higher index
          const target = over === "above" ? index + 1 : index;
          const cur = list.findIndex((x) => x.id === id);
          st().moveLayer(id, cur >= 0 && cur < target ? target - 1 : target);
          e.preventDefault();
        }}
        onClick={(e) => st().select([el.id], e.shiftKey || e.metaKey || e.ctrlKey)}
        className={`relative flex h-10 cursor-default items-center gap-1.5 pr-3 text-xs ${selected ? "bg-ink/10 text-ink" : "text-ink/85 hover:bg-ink/5"} ${el.visible ? "" : "opacity-50"}`}
        style={{ paddingLeft: 14 + depth * 16 }}
      >
        {over === "above" && <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" />}
        {over === "below" && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
        {el.type === "group" ? (
          <button type="button" aria-label="Toggle group" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="grid h-4 w-4 place-items-center text-mute">{open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}</button>
        ) : <span className="w-4" />}
        <Icon size={13} className={isVideo ? "text-ink" : "text-mute"} />
        {edit ? (
          <input autoFocus defaultValue={el.name} onClick={(e) => e.stopPropagation()} onBlur={(e) => { st().updateElement(el.id, { name: e.target.value || el.name }); setEdit(false); }} onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEdit(false); }} className="h-5 min-w-0 flex-1 rounded bg-panel2 px-1 text-xs outline-none ring-1 ring-ink/30" />
        ) : (
          <span className="min-w-0 flex-1 truncate" onDoubleClick={() => setEdit(true)} title="Double-click to rename">{label}</span>
        )}
        <button type="button" aria-label={el.visible ? "Hide layer" : "Show layer"} title={el.visible ? "Hide" : "Show"} data-testid="layer-visibility" onClick={(e) => { e.stopPropagation(); st().updateElement(el.id, { visible: !el.visible }); }} className="grid h-5 w-5 place-items-center rounded text-mute hover:text-ink">{el.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
        <button type="button" aria-label={el.locked ? "Unlock layer" : "Lock layer"} title={el.locked ? "Unlock" : "Lock"} data-testid="layer-lock" onClick={(e) => { e.stopPropagation(); st().updateElement(el.id, { locked: !el.locked }); }} className={`grid h-5 w-5 place-items-center rounded hover:text-ink ${el.locked ? "text-ink" : "text-mute"}`}>{el.locked ? <Lock size={12} /> : <Unlock size={12} />}</button>
      </div>
      {el.type === "group" && open && [...el.children].reverse().map((c, ri) => <Row key={c.id} el={c} depth={depth + 1} index={el.children.length - 1 - ri} list={el.children} />)}
    </>
  );
}

export default function LayersPanel() {
  const st = useStore.getState;
  const slide = useStore((s) => getSlide(s.project));
  const sel = useStore((s) => s.selection);
  const first = slide.elements.find((e) => e.id === sel[0]);
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="layers-panel">
      <div className="flex items-center gap-1.5 px-6 pb-3">
        <button type="button" title="Duplicate" aria-label="Duplicate layer" disabled={!sel.length} onClick={() => st().duplicateElements()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/10 disabled:opacity-30"><Copy size={14} /></button>
        <button type="button" title="Group" aria-label="Group layers" disabled={sel.length < 2} onClick={() => st().group()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/10 disabled:opacity-30"><GroupIcon size={14} /></button>
        <button type="button" title="Ungroup" aria-label="Ungroup" disabled={first?.type !== "group"} onClick={() => st().ungroup()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/10 disabled:opacity-30"><Ungroup size={14} /></button>
        <button type="button" title="Delete" aria-label="Delete layer" disabled={!sel.length} onClick={() => st().deleteElements()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/10 hover:text-red-300 disabled:opacity-30"><Trash2 size={14} /></button>
        <span className="ml-auto pr-1 text-2xs text-faint">{slide.elements.length} layer{slide.elements.length === 1 ? "" : "s"}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {slide.elements.length === 0 && <Empty>This slide has no layers yet. Add photos, text or shapes and they will appear here, top layer first.</Empty>}
        {[...slide.elements].reverse().map((el, ri) => <Row key={el.id} el={el} depth={0} index={slide.elements.length - 1 - ri} list={slide.elements} />)}
        {slide.elements.length > 0 && <div className="flex h-10 items-center gap-2 px-4 text-xs text-faint"><span className="h-3 w-3 rounded-sm border border-line" style={{ background: slide.background.type === "solid" ? slide.background.color : "#555" }} /> Background</div>}
      </div>
    </div>
  );
}
