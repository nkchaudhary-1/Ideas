"use client";
import { useEffect, useState } from "react";
import {
  Check, ChevronDown, CircleAlert, Download, Eye, FilePlus2, FolderOpen, Frame, Hand, Keyboard, Loader2, Maximize, Minus, Moon, MousePointer2, Pause, PanelRight, Play, Plus, Redo2, SlidersHorizontal, Sun, Undo2,
} from "lucide-react";
import { useStore, getSlide } from "@/lib/store";
import { IconButton, Toggle } from "@/components/ui/controls";
import Popover from "@/components/ui/Popover";
import FormatMenu from "./FormatMenu";
import { panoramaCount } from "@/lib/formats";
import { zoomAround } from "@/lib/view-math";
import { slideHasVideo } from "@/lib/timeline";

const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`pointer-events-auto flex items-center gap-1 rounded-full bg-panel p-1.5 shadow-float ${className}`}>{children}</div>
);

/** Everything that floats over the canvas: project, size, history, view, preview and export. */
export default function StageChrome() {
  const st = useStore.getState;
  const name = useStore((s) => s.project.name);
  const status = useStore((s) => s.saveStatus);
  const canUndo = useStore((s) => s.history.past.length > 0);
  const canRedo = useStore((s) => s.history.future.length > 0);
  const ui = useStore((s) => s.ui);
  const slide = useStore((s) => getSlide(s.project));
  const format = useStore((s) => s.project.format);
  const hasVideo = slideHasVideo(slide);
  const [editing, setEditing] = useState(false);
  const pano = panoramaCount(slide.width);
  const size = ui.canvasSize;
  const narrow = size.w < 980; // the stage shrinks when both side panels are open
  const zoom = (f: number) => st().setView(zoomAround(st().ui.view, f, size.w / 2, size.h / 2));
  const dark = ui.theme === "dark";
  useEffect(() => { document.documentElement.dataset.theme = ui.theme; }, [ui.theme]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20" data-testid="stage-chrome">
      {/* top row: project + canvas size on the left, history + preview + export on the right */}
      <div className="absolute inset-x-5 top-5 flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <Pill className="h-[52px] min-w-0 pr-4">
          <Popover align="left" width={220} trigger={(open, toggle) => (
            <button type="button" onClick={toggle} aria-label="Menu" data-testid="app-menu" className={`flex h-10 items-center gap-1 rounded-full pl-1.5 pr-2 ${open ? "bg-field" : "hover:bg-field"}`}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-pill text-pillink"><Frame size={14} strokeWidth={2.4} /></span>
              <ChevronDown size={13} className="text-mute" />
            </button>
          )}>
            {(close) => (
              <div className="-m-2 space-y-1">
                {[
                  { icon: <FilePlus2 size={15} />, label: "New project", id: "new-project", run: () => st().setUI({ newProjectOpen: true }) },
                  { icon: <FolderOpen size={15} />, label: "Open project", id: "open-projects", run: () => st().setUI({ projectsOpen: true }) },
                  { icon: <Keyboard size={15} />, label: "Keyboard shortcuts", id: "shortcuts", run: () => st().setUI({ shortcutsOpen: true }) },
                ].map((m) => (
                  <button key={m.id} type="button" data-testid={m.id} onClick={() => { close(); m.run(); }} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-field">{m.icon}{m.label}</button>
                ))}
              </div>
            )}
          </Popover>
          {editing ? (
            <input autoFocus defaultValue={name} aria-label="Project name"
              onBlur={(e) => { st().renameProject(e.target.value); setEditing(false); }}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(false); }}
              className="h-8 w-44 rounded-full bg-field px-3 text-sm font-semibold outline-none ring-2 ring-ink/30" />
          ) : (
            <button type="button" onClick={() => setEditing(true)} title="Rename project" data-testid="project-name" className="truncate rounded-full px-3 py-2 text-sm font-semibold hover:bg-field" style={{ maxWidth: narrow ? 110 : 200 }}>{name}</button>
          )}
          <span className="flex items-center text-xs text-mute" data-testid="save-status" aria-live="polite" title={status}>
            {status === "saving" && <Loader2 size={12} className="animate-spin" />}
            {status === "saved" && <><Check size={12} className="text-ink" /><span className="sr-only">Saved</span></>}
            {status === "unsaved" && <span className="h-1.5 w-1.5 rounded-full bg-faint" title="Unsaved changes"><span className="sr-only">Unsaved</span></span>}
            {status === "error" && <span className="flex items-center gap-1 text-red-500"><CircleAlert size={12} /> Save failed</span>}
          </span>
        </Pill>
        <Popover align="left" width={372} trigger={(open, toggle) => (
          <button type="button" onClick={toggle} data-testid="format-chip" aria-label="Canvas size" className={`pointer-events-auto flex h-[52px] items-center gap-3 rounded-full bg-panel pl-5 pr-4 text-sm shadow-float ${open ? "ring-2 ring-ink/30" : ""}`}>
            <span className="block rounded-[3px] border-[1.5px] border-ink/70" style={{ width: Math.min(26, 14 * (slide.width / slide.height)), height: 14 }} />
            <span className="font-bold">{format.ratio}</span>
            {!narrow && <span className="text-mute">{pano > 1 ? `${pano} slides` : `${slide.width}×${slide.height}`}</span>}
            <ChevronDown size={14} className="text-mute" />
          </button>
        )}>
          {(close) => <FormatMenu close={close} />}
        </Popover>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <Pill className="h-[52px] px-2">
          <IconButton icon={<Undo2 size={17} />} label="Undo" shortcut="⌘Z" onClick={() => st().undo()} disabled={!canUndo} testId="undo" size={38} />
          <IconButton icon={<Redo2 size={17} />} label="Redo" shortcut="⇧⌘Z" onClick={() => st().redo()} disabled={!canRedo} testId="redo" size={38} />
          {hasVideo && <IconButton icon={ui.playing ? <Pause size={17} /> : <Play size={17} />} label={ui.playing ? "Stop playback" : "Play slide"} active={ui.playing} onClick={() => st().setUI({ playing: !ui.playing })} testId="play-slide" size={38} />}
          <IconButton icon={dark ? <Sun size={17} /> : <Moon size={17} />} label={dark ? "Light theme" : "Dark theme"} onClick={() => st().setTheme(dark ? "light" : "dark")} testId="toggle-theme" size={38} />
          <IconButton icon={<PanelRight size={17} />} label="Properties" active={ui.rightOpen} onClick={() => st().setUI({ rightOpen: !ui.rightOpen })} testId="toggle-properties" size={38} />
        </Pill>
        <button type="button" onClick={() => st().setUI({ previewOpen: true, playing: false })} data-testid="preview" aria-label="Preview" className={`pointer-events-auto flex h-[52px] items-center gap-2 rounded-full bg-panel text-sm font-semibold shadow-float hover:bg-panel2 ${narrow ? "w-[52px] justify-center" : "px-5"}`}><Eye size={16} />{!narrow && " Preview"}</button>
        <button type="button" onClick={() => st().setUI({ exportOpen: true, playing: false })} data-testid="export" aria-label="Export" className="pointer-events-auto flex h-[52px] items-center gap-2 rounded-full grad-pill px-6 text-sm font-bold text-pillink shadow-float hover:opacity-90"><Download size={16} /> Export</button>
      </div>
      </div>

      {/* bottom centre: view */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <Pill className="h-[52px] px-2">
          <IconButton icon={<MousePointer2 size={16} />} label="Select" shortcut="V" active={ui.tool === "select"} onClick={() => st().setUI({ tool: "select" })} size={38} />
          <IconButton icon={<Hand size={16} />} label="Hand (pan)" shortcut="H / Space" active={ui.tool === "hand"} onClick={() => st().setUI({ tool: "hand" })} size={38} />
          <span className="mx-1.5 h-5 w-px bg-line" />
          <IconButton icon={<Minus size={16} />} label="Zoom out" shortcut="−" onClick={() => zoom(1 / 1.25)} testId="zoom-out" size={38} />
          <button type="button" title="Reset to 100%" data-testid="zoom-pct" onClick={() => st().setView(zoomAround(st().ui.view, 1 / st().ui.view.scale, size.w / 2, size.h / 2))} className="h-9 w-[54px] rounded-full text-center text-xs font-semibold tabular-nums hover:bg-field">{Math.round(ui.view.scale * 100)}%</button>
          <IconButton icon={<Plus size={16} />} label="Zoom in" shortcut="+" onClick={() => zoom(1.25)} testId="zoom-in" size={38} />
          <IconButton icon={<Maximize size={15} />} label="Fit to screen" shortcut="⇧1" onClick={() => st().requestFit()} testId="zoom-fit" size={38} />
          <span className="mx-1.5 h-5 w-px bg-line" />
          <Popover placement="top" width={250} trigger={(open, toggle) => <IconButton icon={<SlidersHorizontal size={16} />} label="View options" active={open} onClick={toggle} testId="view-menu" size={38} />}>
            {() => (
              <div className="space-y-4 p-1" data-testid="view-options">
                <Toggle label="Rulers" value={ui.rulers} onChange={(v) => st().setUI({ rulers: v })} />
                <Toggle label="Layout grid" value={slide.grid.visible} onChange={(v) => st().commit((p) => { const s = p.slides.find((x) => x.id === p.activeSlideId)!; s.grid.visible = v; if (v && s.grid.kind === "none") s.grid.kind = "columns"; })} />
                <Toggle label="Safe areas" value={ui.safeAreas} onChange={(v) => st().setUI({ safeAreas: v })} />
                <div className="h-px bg-line" />
                <Toggle label="Snap to canvas" value={ui.snapCanvas} onChange={(v) => st().setUI({ snapCanvas: v })} />
                <Toggle label="Snap to objects" value={ui.snapObjects} onChange={(v) => st().setUI({ snapObjects: v })} />
                <Toggle label="Snap to grid and guides" value={ui.snapGrid} onChange={(v) => st().setUI({ snapGrid: v })} />
                <Toggle label="Show guides" value={ui.guides} onChange={(v) => st().setUI({ guides: v })} />
              </div>
            )}
          </Popover>
        </Pill>
      </div>
    </div>
  );
}
