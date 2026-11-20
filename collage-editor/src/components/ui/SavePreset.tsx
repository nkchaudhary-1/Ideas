"use client";
import { useState } from "react";
import { Bookmark, Check, Pencil, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";

/** "Save as…": a quiet button that opens an inline name field. Enter saves, Escape cancels. */
export function SavePreset({ label, placeholder, defaultName, onSave, testId, disabled }: {
  label: string; placeholder?: string; defaultName: () => string; onSave: (name: string) => void; testId?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const commit = () => {
    const n = name.trim() || defaultName();
    onSave(n);
    setOpen(false);
  };
  if (!open) {
    return (
      <button type="button" disabled={disabled} data-testid={testId} onClick={() => { setName(defaultName()); setOpen(true); }}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-field px-3 text-xs font-semibold text-ink hover:bg-raised disabled:opacity-40">
        <Bookmark size={13} /> {label}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5" data-testid="save-preset-row">
      <input autoFocus value={name} placeholder={placeholder ?? "Name"} aria-label="Preset name" data-testid="preset-name"
        onFocus={(e) => e.target.select()}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") commit(); if (e.key === "Escape") setOpen(false); }}
        className="h-8 min-w-0 flex-1 rounded-full bg-field px-3 text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-accent/40" />
      <button type="button" aria-label="Save" data-testid="preset-save" onClick={commit} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pill text-pillink hover:opacity-90"><Check size={14} /></button>
      <button type="button" aria-label="Cancel" onClick={() => setOpen(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute hover:bg-field hover:text-ink"><X size={14} /></button>
    </div>
  );
}

/** rename (inline) and delete for one saved preset; shown on hover of its tile */
export function PresetActions({ id, name, onRename }: { id: string; name: string; onRename: () => void }) {
  const del = useStore((s) => s.deletePreset);
  return (
    <span className="absolute right-0.5 top-0.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <button type="button" aria-label={`Rename ${name}`} title="Rename" onClick={(e) => { e.stopPropagation(); onRename(); }} className="grid h-5 w-5 place-items-center rounded-full bg-black/65 text-white hover:bg-black"><Pencil size={10} /></button>
      <button type="button" aria-label={`Delete ${name}`} title="Delete" data-testid="preset-delete" onClick={(e) => { e.stopPropagation(); del(id); useStore.getState().toast(`Deleted “${name}”`, "info"); }} className="grid h-5 w-5 place-items-center rounded-full bg-black/65 text-white hover:bg-red-600"><Trash2 size={10} /></button>
    </span>
  );
}

/** a name that turns into an input on demand */
export function RenameLabel({ id, name, editing, setEditing, className = "" }: { id: string; name: string; editing: boolean; setEditing: (v: boolean) => void; className?: string }) {
  const rename = useStore((s) => s.renamePreset);
  if (!editing) return <span className={`truncate ${className}`} onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Double-click to rename">{name}</span>;
  return (
    <input autoFocus defaultValue={name} aria-label="Preset name" onClick={(e) => e.stopPropagation()}
      onBlur={(e) => { rename(id, e.target.value); setEditing(false); }}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(false); }}
      className="h-5 w-full min-w-0 rounded-full bg-field px-2 text-2xs font-semibold text-ink outline-none ring-1 ring-ink/30" />
  );
}
