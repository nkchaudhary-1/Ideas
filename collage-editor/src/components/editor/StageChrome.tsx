"use client";
import { useEffect, useState } from "react";
import {
  Check, ChevronDown, CircleAlert, Download, Eye, FilePlus2, FolderOpen, Frame, Hand, Keyboard, Loader2, Maximize, Minus, Moon, MousePointer2, Pause, PanelRight, Play, Plus, Redo2, SlidersHorizontal, SplitSquareHorizontal, Sun, Undo2,
} from "lucide-react";
import { useStore, getSlide } from "@/lib/store";
import { IconButton, Toggle } from "@/components/ui/controls";
import Popover from "@/components/ui/Popover";
import FormatMenu from "./FormatMenu";
import { panoramaCount } from "@/lib/formats";
import { zoomAround } from "@/lib/view-math";
import { slideHasVideo } from "@/lib/timeline";
import { isEmptyEdit } from "@/lib/edit";
import { useCompact } from "@/lib/use-media";

const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`pointer-events-auto flex items-center gap-1 rounded-full bg-panel p-2 shadow-float ${className}`}>{children}</div>
);

const RatioGlyph = ({ w, h }: { w: number; h: number }) => (
  <span className="block shrink-0 rounded-[3px] border-[1.5px] border-ink/70" style={{ width: Math.min(26, 14 * (w / h)), height: 14 }} />
);

/** everything the floating chrome reads from the store, in narrow subscriptions (panning changes ui.view on every frame) */
function useChrome() {
  const ui = {
    canvasSize: useStore((s) => s.ui.canvasSize),
    compare: useStore((s) => s.ui.compare),
    playing: useStore((s) => s.ui.playing),
    rightOpen: useStore((s) => s.ui.rightOpen),
    safeAreas: useStore((s) => s.ui.safeAreas),
    snapCanvas: useStore((s) => s.ui.snapCanvas),
    snapGrid: useStore((s) => s.ui.snapGrid),
    snapObjects: useStore((s) => s.ui.snapObjects),
    theme: useStore((s) => s.ui.theme),
    tool: useStore((s) => s.ui.tool),
    zoom: useStore((s) => Math.round(s.ui.view.scale * 100)),
  };
  return {
    ui,
    name: useStore((s) => s.project.name),
    status: useStore((s) => s.saveStatus),
    canUndo: useStore((s) => s.history.past.length > 0),
    canRedo: useStore((s) => s.history.future.length > 0),
    slide: useStore((s) => getSlide(s.project)),
    format: useStore((s) => s.project.format),
    isEdit: useStore((s) => s.project.kind === "edit"),
    nothingToShow: useStore((s) => s.project.kind === "edit" && s.project.slides.every(isEmptyEdit)),
  };
}
type Chrome = ReturnType<typeof useChrome>;

function SaveBadge({ status }: { status: Chrome["status"] }) {
  return (
    <span className="flex items-center text-xs text-mute" data-testid="save-status" aria-live="polite" title={status}>
      {status === "saving" && <Loader2 size={12} className="animate-spin" />}
      {status === "saved" && <><Check size={12} className="text-ink" /><span className="sr-only">Saved</span></>}
      {status === "unsaved" && <span className="h-1.5 w-1.5 rounded-full bg-faint" title="Unsaved changes"><span className="sr-only">Unsaved</span></span>}
      {status === "error" && <span className="flex items-center gap-1 text-red-500"><CircleAlert size={12} /> Save failed</span>}
    </span>
  );
}

/** the logo button and its menu; on phones it also holds the theme switch, which has no room in the bar */
function AppMenu({ compact, dark }: { compact: boolean; dark: boolean }) {
  const st = useStore.getState;
  const items = [
    { icon: <FilePlus2 size={15} />, label: "New project", id: "new-project", run: () => st().setUI({ newProjectOpen: true }) },
    { icon: <FolderOpen size={15} />, label: "Open project", id: "open-projects", run: () => st().setUI({ projectsOpen: true }) },
    ...(compact
      ? [{ icon: dark ? <Sun size={15} /> : <Moon size={15} />, label: dark ? "Light theme" : "Dark theme", id: "toggle-theme", run: () => st().setTheme(dark ? "light" : "dark") }]
      : [{ icon: <Keyboard size={15} />, label: "Keyboard shortcuts", id: "shortcuts", run: () => st().setUI({ shortcutsOpen: true }) }]),
  ];
  return (
    <Popover align="left" width={220} trigger={(open, toggle) => (
      <button type="button" onClick={toggle} aria-label="Menu" data-testid="app-menu" className={`flex h-10 items-center gap-1 rounded-full pl-2 pr-2 coarse:h-11 ${open ? "bg-field" : "hover:bg-field"}`}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-pill text-pillink"><Frame size={14} strokeWidth={2.4} /></span>
        <ChevronDown size={13} className="text-mute" />
      </button>
    )}>
      {(close) => (
        <div className="-m-2 space-y-1">
          {items.map((m) => (
            <button key={m.id} type="button" data-testid={m.id} onClick={() => { close(); m.run(); }} className="flex h-10 w-full items-center gap-3 rounded-in-16 px-3 text-left text-sm font-medium hover:bg-field">{m.icon}{m.label}</button>
          ))}
        </div>
      )}
    </Popover>
  );
}

function ProjectName({ name, maxWidth }: { name: string; maxWidth: number }) {
  const st = useStore.getState;
  const [editing, setEditing] = useState(false);
  return editing ? (
    <input autoFocus defaultValue={name} aria-label="Project name"
      onBlur={(e) => { st().renameProject(e.target.value); setEditing(false); }}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(false); }}
      className="h-8 w-44 min-w-0 rounded-full bg-field px-3 text-sm font-semibold outline-none ring-2 ring-ink/30" />
  ) : (
    <button type="button" onClick={() => setEditing(true)} title="Rename project" data-testid="project-name" className="h-9 min-w-0 truncate rounded-full px-3 text-sm font-semibold hover:bg-field" style={{ maxWidth }}>{name}</button>
  );
}

function SizeChip({ c, narrow, flat }: { c: Chrome; narrow: boolean; flat?: boolean }) {
  const shell = flat ? "h-9 gap-2 px-3 hover:bg-field coarse:h-11" : "h-[52px] gap-3 bg-panel shadow-float coarse:h-[60px]";
  const pano = panoramaCount(c.slide.width);
  if (c.isEdit) {
    return (
      <div data-testid="edit-size" className={`pointer-events-auto flex items-center rounded-full text-sm ${shell} ${flat ? "" : "px-5"}`} title="Pixel size of the active photo or video">
        <RatioGlyph w={c.slide.width} h={c.slide.height} />
        <span className="font-bold">{c.slide.width}×{c.slide.height}</span>
      </div>
    );
  }
  return (
    <Popover align="left" width={424} placement={narrow ? "top" : "bottom"} trigger={(open, toggle) => (
      <button type="button" onClick={toggle} data-testid="format-chip" aria-label="Canvas size" className={`pointer-events-auto flex items-center rounded-full text-sm ${shell} ${flat ? "" : "pl-5 pr-4"} ${open ? "ring-2 ring-ink/30" : ""}`}>
        <RatioGlyph w={c.slide.width} h={c.slide.height} />
        <span className="font-bold">{c.format.ratio}</span>
        {!narrow && <span className="text-mute">{pano > 1 ? `${pano} slides` : `${c.slide.width}×${c.slide.height}`}</span>}
        <ChevronDown size={14} className="text-mute" />
      </button>
    )}>
      {(close) => <FormatMenu close={close} />}
    </Popover>
  );
}

function CompareButton({ c, narrow }: { c: Chrome; narrow: boolean }) {
  const st = useStore.getState;
  return (
    <button type="button" title="Hold to see the original (or hold the \ key)" aria-label="Hold to compare with the original" data-testid="compare" aria-pressed={c.ui.compare}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); st().setUI({ compare: true }); }}
      onPointerUp={() => st().setUI({ compare: false })} onPointerCancel={() => st().setUI({ compare: false })}
      className={`flex h-9 touch-none items-center gap-2 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors coarse:h-11 ${c.ui.compare ? "bg-ink/10 text-ink" : "text-mute hover:bg-ink/[0.07] hover:text-ink"}`}><SplitSquareHorizontal size={15} />{!narrow && (c.ui.compare ? " Original" : " Compare")}</button>
  );
}

function ViewMenu({ c }: { c: Chrome }) {
  const st = useStore.getState;
  return (
    <Popover placement="top" width={250} trigger={(open, toggle) => <IconButton icon={<SlidersHorizontal size={16} />} label="View options" active={open} onClick={toggle} testId="view-menu" />}>
      {() => (
        <div className="space-y-4 p-1" data-testid="view-options">
          <Toggle label="Layout grid" value={c.slide.grid.visible} onChange={(v) => st().commit((p) => { const s = p.slides.find((x) => x.id === p.activeSlideId)!; s.grid.visible = v; if (v && s.grid.kind === "none") s.grid.kind = "columns"; })} />
          <Toggle label="Safe areas" value={c.ui.safeAreas} onChange={(v) => st().setUI({ safeAreas: v })} />
          <div className="h-px bg-line" />
          <Toggle label="Snap to canvas" value={c.ui.snapCanvas} onChange={(v) => st().setUI({ snapCanvas: v })} />
          <Toggle label="Snap to objects" value={c.ui.snapObjects} onChange={(v) => st().setUI({ snapObjects: v })} />
          <Toggle label="Snap to layout grid" value={c.ui.snapGrid} onChange={(v) => st().setUI({ snapGrid: v })} />
        </div>
      )}
    </Popover>
  );
}

/** Everything that floats over the canvas: project, size, history, view, preview and export. */
export default function StageChrome() {
  const c = useChrome();
  const compact = useCompact();
  useEffect(() => { document.documentElement.dataset.theme = c.ui.theme; }, [c.ui.theme]);
  return compact ? <CompactChrome c={c} /> : <DesktopChrome c={c} />;
}

/** phones and portrait tablets: a slim bar on top, one pill of view controls at the bottom */
function CompactChrome({ c }: { c: Chrome }) {
  const st = useStore.getState;
  const { ui } = c;
  const hasVideo = slideHasVideo(c.slide);
  return (
    <div className="pointer-events-none absolute inset-0 z-20" data-testid="stage-chrome">
      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <Pill className="h-[52px] min-w-0 flex-1 pr-4 coarse:h-[60px]">
          <AppMenu compact dark={ui.theme === "dark"} />
          <ProjectName name={c.name} maxWidth={160} />
          <SaveBadge status={c.status} />
        </Pill>
        <Pill className="h-[52px] shrink-0 px-2 coarse:h-[60px]">
          <IconButton icon={<Undo2 size={17} />} label="Undo" onClick={() => st().undo()} disabled={!c.canUndo} testId="undo" />
          <IconButton icon={<Redo2 size={17} />} label="Redo" onClick={() => st().redo()} disabled={!c.canRedo} testId="redo" />
        </Pill>
        <button type="button" onClick={() => st().setUI({ exportOpen: true, playing: false, sheet: null })} data-testid="export" aria-label="Export" disabled={c.nothingToShow}
          className="pointer-events-auto grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full grad-pill text-pillink shadow-float hover:opacity-90 disabled:pointer-events-none disabled:opacity-40 coarse:h-[60px] coarse:w-[60px] touch:active:scale-95"><Download size={18} /></button>
      </div>

      <div className="absolute inset-x-3 bottom-3 flex justify-center">
        <Pill className="h-[52px] max-w-full coarse:h-[60px]">
          <SizeChip c={c} narrow flat />
          <IconButton icon={<Maximize size={15} />} label="Fit to screen" onClick={() => st().requestFit()} testId="zoom-fit" />
          {hasVideo && <IconButton icon={ui.playing ? <Pause size={17} /> : <Play size={17} />} label={ui.playing ? "Stop playback" : "Play slide"} active={ui.playing} onClick={() => st().setUI({ playing: !ui.playing })} testId="play-slide" />}
          {c.isEdit && <CompareButton c={c} narrow />}
          <ViewMenu c={c} />
          <IconButton icon={<Eye size={16} />} label="Preview" onClick={() => st().setUI({ previewOpen: true, playing: false, sheet: null })} disabled={c.nothingToShow} testId="preview" />
        </Pill>
      </div>
    </div>
  );
}

function DesktopChrome({ c }: { c: Chrome }) {
  const st = useStore.getState;
  const { ui } = c;
  const hasVideo = slideHasVideo(c.slide);
  const size = ui.canvasSize;
  const narrow = size.w < 980; // the stage shrinks when both side panels are open
  const zoom = (f: number) => st().setView(zoomAround(st().ui.view, f, size.w / 2, size.h / 2));
  const dark = ui.theme === "dark";

  return (
    <div className="pointer-events-none absolute inset-0 z-20" data-testid="stage-chrome">
      {/* top row: project + canvas size on the left, history + preview + export on the right */}
      <div className="absolute inset-x-5 top-5 flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <Pill className="h-[52px] min-w-0 pr-4">
            <AppMenu compact={false} dark={dark} />
            <ProjectName name={c.name} maxWidth={narrow ? 110 : 200} />
            <SaveBadge status={c.status} />
          </Pill>
          <SizeChip c={c} narrow={narrow} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Pill className="h-[52px] px-2">
            <IconButton icon={<Undo2 size={17} />} label="Undo" shortcut="⌘Z" onClick={() => st().undo()} disabled={!c.canUndo} testId="undo" />
            <IconButton icon={<Redo2 size={17} />} label="Redo" shortcut="⇧⌘Z" onClick={() => st().redo()} disabled={!c.canRedo} testId="redo" />
            {hasVideo && <IconButton icon={ui.playing ? <Pause size={17} /> : <Play size={17} />} label={ui.playing ? "Stop playback" : "Play slide"} active={ui.playing} onClick={() => st().setUI({ playing: !ui.playing })} testId="play-slide" />}
            <IconButton icon={dark ? <Sun size={17} /> : <Moon size={17} />} label={dark ? "Light theme" : "Dark theme"} onClick={() => st().setTheme(dark ? "light" : "dark")} testId="toggle-theme" />
            <IconButton icon={<PanelRight size={17} />} label="Properties" active={ui.rightOpen} onClick={() => st().setUI({ rightOpen: !ui.rightOpen })} testId="toggle-properties" />
          </Pill>
          <button type="button" onClick={() => st().setUI({ previewOpen: true, playing: false })} data-testid="preview" aria-label="Preview" disabled={c.nothingToShow} className={`pointer-events-auto flex h-[52px] items-center gap-2 rounded-full bg-panel text-sm font-semibold shadow-float hover:bg-panel2 disabled:pointer-events-none disabled:opacity-40 ${narrow ? "w-[52px] justify-center" : "px-5"}`}><Eye size={16} />{!narrow && " Preview"}</button>
          <button type="button" onClick={() => st().setUI({ exportOpen: true, playing: false })} data-testid="export" aria-label="Export" disabled={c.nothingToShow} className="pointer-events-auto flex h-[52px] items-center gap-2 rounded-full grad-pill px-6 text-sm font-bold text-pillink shadow-float hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"><Download size={16} /> Export</button>
        </div>
      </div>

      {/* bottom centre: view */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <Pill className="h-[52px] px-2">
          <IconButton icon={<MousePointer2 size={16} />} label="Select" shortcut="V" active={ui.tool === "select"} onClick={() => st().setUI({ tool: "select" })} />
          <IconButton icon={<Hand size={16} />} label="Hand (pan)" shortcut="H / Space" active={ui.tool === "hand"} onClick={() => st().setUI({ tool: "hand" })} />
          <span className="mx-2 h-5 w-px bg-line" />
          <IconButton icon={<Minus size={16} />} label="Zoom out" shortcut="−" onClick={() => zoom(1 / 1.25)} testId="zoom-out" />
          <button type="button" title="Reset to 100%" data-testid="zoom-pct" onClick={() => st().setView(zoomAround(st().ui.view, 1 / st().ui.view.scale, size.w / 2, size.h / 2))} className="h-9 w-14 rounded-full text-center text-xs font-semibold tabular-nums hover:bg-field">{Math.round(ui.zoom)}%</button>
          <IconButton icon={<Plus size={16} />} label="Zoom in" shortcut="+" onClick={() => zoom(1.25)} testId="zoom-in" />
          <IconButton icon={<Maximize size={15} />} label="Fit to screen" shortcut="⇧1" onClick={() => st().requestFit()} testId="zoom-fit" />
          {c.isEdit && (
            <>
              <span className="mx-2 h-5 w-px bg-line" />
              <CompareButton c={c} narrow={narrow} />
            </>
          )}
          <span className="mx-2 h-5 w-px bg-line" />
          <ViewMenu c={c} />
        </Pill>
      </div>
    </div>
  );
}
