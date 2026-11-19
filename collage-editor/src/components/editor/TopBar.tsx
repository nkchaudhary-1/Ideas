"use client";
import { useEffect, useRef, useState } from "react";
import {
  Check, CircleAlert, Download, Eye, FolderOpen, Grid3x3, Hand, Keyboard, Loader2, Magnet, MousePointer2, Play, Plus, Redo2, Ruler, ScanLine, Square, Undo2, ZoomIn, ZoomOut, Maximize, Pause, Frame, FilePlus2, Shield,
} from "lucide-react";
import { useStore, getSlide } from "@/lib/store";
import { IconButton, Button } from "@/components/ui/controls";
import { fitView, viewForRect, zoomAround } from "@/lib/view-math";
import { boundsOf, flatten, unionRects } from "@/lib/geometry";

export default function TopBar() {
  const name = useStore((s) => s.project.name);
  const status = useStore((s) => s.saveStatus);
  const canUndo = useStore((s) => s.history.past.length > 0);
  const canRedo = useStore((s) => s.history.future.length > 0);
  const view = useStore((s) => s.ui.view);
  const ui = useStore((s) => s.ui);
  const slide = useStore((s) => getSlide(s.project));
  const hasVideo = flatten(slide.elements).some((e) => e.type === "video" || (e.type === "image" && e.fill?.kind === "video") || (e.type === "grid" && JSON.stringify(e.tree).includes('"kind":"video"')));
  const [editing, setEditing] = useState(false);
  const [snapOpen, setSnapOpen] = useState(false);
  const snapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!snapOpen) return;
    const f = (e: MouseEvent) => { if (!snapRef.current?.contains(e.target as Node)) setSnapOpen(false); };
    window.addEventListener("mousedown", f);
    return () => window.removeEventListener("mousedown", f);
  }, [snapOpen]);

  const st = useStore.getState;
  const size = ui.canvasSize;
  const zoom = (f: number) => st().setView(zoomAround(st().ui.view, f, size.w / 2, size.h / 2));
  const zoomSel = () => {
    const sel = flatten(getSlide(st().project).elements).filter((e) => st().selection.includes(e.id));
    const r = unionRects(sel.map(boundsOf));
    if (r) st().setView(viewForRect(size, r));
  };

  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b border-line bg-panel px-2" data-testid="topbar">
      <div className="flex items-center gap-1 pr-2">
        <div className="mr-1 grid h-6 w-6 place-items-center rounded-md bg-accent text-black"><Frame size={14} strokeWidth={2.4} /></div>
        <IconButton icon={<FolderOpen size={16} />} label="Projects" onClick={() => st().setUI({ projectsOpen: true })} testId="open-projects" />
        <IconButton icon={<FilePlus2 size={16} />} label="New project" onClick={() => st().setUI({ newProjectOpen: true })} testId="new-project" />
      </div>

      <div className="flex min-w-0 items-center gap-2 border-l border-line pl-3">
        {editing ? (
          <input
            autoFocus
            defaultValue={name}
            aria-label="Project name"
            onBlur={(e) => { st().renameProject(e.target.value); setEditing(false); }}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(false); }}
            className="h-6 w-48 rounded bg-panel2 px-2 text-sm text-ink outline-none ring-1 ring-accent/70"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} title="Rename project" data-testid="project-name" className="max-w-[220px] truncate rounded px-1.5 py-0.5 text-sm font-medium text-ink hover:bg-white/10">{name}</button>
        )}
        <span className="flex items-center gap-1 text-xs text-mute" data-testid="save-status" aria-live="polite">
          {status === "saving" && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
          {status === "saved" && <><Check size={11} className="text-accent" /> Saved</>}
          {status === "unsaved" && <>Unsaved</>}
          {status === "error" && <span className="flex items-center gap-1 text-red-300"><CircleAlert size={11} /> Save failed</span>}
        </span>
      </div>

      <div className="mx-3 flex items-center gap-0.5 border-l border-line pl-3">
        <IconButton icon={<Undo2 size={16} />} label="Undo" shortcut="⌘Z" onClick={() => st().undo()} disabled={!canUndo} testId="undo" />
        <IconButton icon={<Redo2 size={16} />} label="Redo" shortcut="⇧⌘Z" onClick={() => st().redo()} disabled={!canRedo} testId="redo" />
      </div>

      <div className="flex items-center gap-0.5 border-l border-line pl-3">
        <IconButton icon={<MousePointer2 size={16} />} label="Select" shortcut="V" active={ui.tool === "select"} onClick={() => st().setUI({ tool: "select" })} />
        <IconButton icon={<Hand size={16} />} label="Hand (pan)" shortcut="H / Space" active={ui.tool === "hand"} onClick={() => st().setUI({ tool: "hand" })} />
      </div>

      <div className="flex flex-1 items-center justify-center gap-0.5">
        <IconButton icon={<ZoomOut size={16} />} label="Zoom out" shortcut="−" onClick={() => zoom(1 / 1.25)} testId="zoom-out" />
        <button type="button" title="Reset to 100%" data-testid="zoom-pct" onClick={() => st().setView(zoomAround(st().ui.view, 1 / st().ui.view.scale, size.w / 2, size.h / 2))} className="h-7 w-[52px] rounded-md text-center text-xs tabular-nums text-ink/90 hover:bg-white/10">
          {Math.round(view.scale * 100)}%
        </button>
        <IconButton icon={<ZoomIn size={16} />} label="Zoom in" shortcut="+" onClick={() => zoom(1.25)} testId="zoom-in" />
        <IconButton icon={<Maximize size={16} />} label="Fit to canvas" shortcut="⇧1" onClick={() => st().requestFit()} testId="zoom-fit" />
        <IconButton icon={<ScanLine size={16} />} label="Zoom to selection" shortcut="⇧2" onClick={zoomSel} disabled={st().selection.length === 0} />
        <span className="mx-2 h-5 w-px bg-line" />
        <IconButton icon={<Ruler size={16} />} label="Rulers" shortcut="⇧R" active={ui.rulers} onClick={() => st().setUI({ rulers: !ui.rulers })} testId="toggle-rulers" />
        <IconButton icon={<Grid3x3 size={16} />} label="Layout grid" shortcut="⌘'" active={slide.grid.visible} onClick={() => st().commit((p) => { const s = p.slides.find((x) => x.id === p.activeSlideId)!; s.grid.visible = !s.grid.visible; if (s.grid.kind === "none") s.grid.kind = "columns"; })} testId="toggle-grid" />
        <IconButton icon={<Shield size={16} />} label="Safe areas" active={ui.safeAreas} onClick={() => st().setUI({ safeAreas: !ui.safeAreas })} />
        <div ref={snapRef} className="relative">
          <IconButton icon={<Magnet size={16} />} label="Snapping" active={ui.snapObjects || ui.snapCanvas || ui.snapGrid} onClick={() => setSnapOpen(!snapOpen)} testId="snap-menu" />
          {snapOpen && (
            <div className="absolute left-1/2 top-9 z-50 w-48 -translate-x-1/2 rounded-lg border border-line bg-panel p-2 text-xs shadow-xl">
              {([["snapCanvas", "Snap to canvas"], ["snapObjects", "Snap to objects"], ["snapGrid", "Snap to grid & guides"], ["guides", "Show guides"]] as const).map(([k, l]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-white/5">
                  <input type="checkbox" checked={ui[k]} onChange={() => st().setUI({ [k]: !ui[k] } as never)} className="accent-[rgb(var(--accent))]" />
                  {l}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-2">
        {hasVideo && (
          <IconButton icon={ui.playing ? <Pause size={16} /> : <Play size={16} />} label={ui.playing ? "Stop playback" : "Play slide"} active={ui.playing} onClick={() => st().setUI({ playing: !ui.playing })} testId="play-slide" />
        )}
        <IconButton icon={<Keyboard size={16} />} label="Keyboard shortcuts" shortcut="?" onClick={() => st().setUI({ shortcutsOpen: true })} />
        <Button onClick={() => st().setUI({ previewOpen: true, playing: false })} testId="preview"><Eye size={14} /> Preview</Button>
        <Button variant="primary" onClick={() => st().setUI({ exportOpen: true, playing: false })} testId="export"><Download size={14} /> Export</Button>
      </div>
      <span className="sr-only"><Plus /><Square /></span>
    </header>
  );
}
export { fitView };
