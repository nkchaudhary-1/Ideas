"use client";
import { useEffect, useRef, useState } from "react";
import {
  Check, ChevronDown, CircleAlert, Download, Eye, FilePlus2, FolderOpen, Hand, Keyboard, Loader2, Maximize, Minus, Moon, MousePointer2, Pause, PanelRight, Pencil, Play, Plus, Redo2, SlidersHorizontal, SplitSquareHorizontal, Sun, Undo2,
} from "lucide-react";
import { useStore, getSlide, useSelectedElements } from "@/lib/store";
import Logo from "@/components/ui/Logo";
import PhotoWheel from "./PhotoWheel";
import QuickAdjust from "./QuickAdjust";
import { GuideChip } from "./ModeGuide";
import { cropTargetOf } from "@/components/canvas/Workspace";
import { IconButton, Toggle } from "@/components/ui/controls";
import Popover from "@/components/ui/Popover";
import FormatMenu from "./FormatMenu";
import { panoramaCount, projectKindLabel, ratioLabel } from "@/lib/formats";
import { tweenView, zoomAround } from "@/lib/view-math";
import { slideHasVideo } from "@/lib/timeline";
import { isEmptyEdit } from "@/lib/edit";
import { useCompact, isCoarse } from "@/lib/use-media";

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
    hasSelection: useStore((s) => s.selection.length > 0),
    nothingToShow: useStore((s) => s.project.kind === "edit" && s.project.slides.every(isEmptyEdit)),
  };
}
type Chrome = ReturnType<typeof useChrome>;

function SaveBadge({ status, words }: { status: Chrome["status"]; words?: boolean }) {
  const label = status === "saving" ? "Saving" : status === "saved" ? "Saved" : status === "unsaved" ? "Unsaved" : "Save failed";
  return (
    <span className={`flex items-center gap-1 whitespace-nowrap text-xs ${status === "error" ? "text-red-500" : "text-mute"}`} data-testid="save-status" aria-live="polite" title={label}>
      {status === "saving" && <Loader2 size={12} className="animate-spin" />}
      {status === "saved" && <Check size={12} className="text-ink" />}
      {status === "unsaved" && <span className="h-1.5 w-1.5 rounded-full bg-faint" />}
      {status === "error" && <CircleAlert size={12} />}
      <span className={words || status === "error" ? "" : "sr-only"}>{label}</span>
    </span>
  );
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 8 ? `${d} d ago` : new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

/** the last few projects, one tap away */
function RecentProjects({ close }: { close: () => void }) {
  const projects = useStore((s) => s.projects);
  const currentId = useStore((s) => s.project.id);
  useEffect(() => { void useStore.getState().refreshProjects(); }, []);
  const list = projects.slice(0, 5);
  if (list.length === 0) return <p className="px-4 pb-3 text-xs leading-5 text-mute">Everything you make is saved on this device and shows up here.</p>;
  return (
    <ul className="space-y-1 px-2 pb-1" data-testid="recent-projects">
      {list.map((p) => (
        <li key={p.id}>
          <button type="button" data-testid="recent-project" aria-current={p.id === currentId} onClick={() => { close(); if (p.id !== currentId) void useStore.getState().openProject(p.id); }}
            className={`flex w-full items-center gap-3 rounded-in-16 px-2 py-2 text-left hover:bg-field ${p.id === currentId ? "bg-field" : ""}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded bg-stage">
              {p.thumb ? <img src={p.thumb} alt="" className="h-full w-full object-cover" /> : <Logo size={16} className="text-faint" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold" title={p.name}>{p.name}</span>
              <span className="block truncate text-2xs text-mute">{projectKindLabel(p.kind, p.ratio)} · {p.ratio} · {ago(p.updatedAt)}</span>
            </span>
            {p.id === currentId && <span className="shrink-0 rounded-full bg-ink/10 px-2 py-1 text-2xs font-semibold text-ink">Open</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** the logo button and its menu: the app, what you can do, and your recent projects; on phones it also holds the theme switch */
function AppMenu({ compact, dark }: { compact: boolean; dark: boolean }) {
  const st = useStore.getState;
  const items = [
    { icon: <FilePlus2 size={15} />, label: "New project", id: "new-project", run: () => st().setUI({ newProjectOpen: true }) },
    { icon: <FolderOpen size={15} />, label: "All projects…", id: "open-projects", run: () => st().setUI({ projectsOpen: true }) },
    ...(compact ? [] : [{ icon: <Keyboard size={15} />, label: "Keyboard shortcuts", id: "shortcuts", run: () => st().setUI({ shortcutsOpen: true }) }]),
    { icon: dark ? <Sun size={15} /> : <Moon size={15} />, label: dark ? "Light theme" : "Dark theme", id: "toggle-theme", run: () => st().setTheme(dark ? "light" : "dark") },
  ];
  return (
    <Popover align="left" width={320} trigger={(open, toggle) => (
      <button type="button" onClick={toggle} aria-label="Collage Studio menu" title="Menu: new project, your projects" data-testid="app-menu" className={`flex h-10 items-center gap-1 rounded-full pl-1 pr-2 coarse:h-11 ${open ? "bg-field" : "hover:bg-field"}`}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-pill text-pillink"><Logo size={18} /></span>
        <ChevronDown size={13} className="text-mute" />
      </button>
    )}>
      {(close) => (
        <div className="-m-2 pb-1" data-testid="app-menu-panel">
          <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pill text-pillink"><Logo size={22} /></span>
            <span className="min-w-0"><span className="block text-sm font-extrabold tracking-tight">Collage Studio</span><span className="block text-2xs text-mute">Collages, carousels, photo and video edits</span></span>
          </div>
          <div className="space-y-1 px-2">
            {items.map((m) => (
              <button key={m.id} type="button" data-testid={m.id} onClick={() => { close(); m.run(); }} className="flex h-10 w-full items-center gap-3 rounded-in-16 px-3 text-left text-sm font-medium hover:bg-field coarse:h-11">{m.icon}{m.label}</button>
            ))}
          </div>
          <div className="mx-4 my-3 h-px bg-line" />
          <div className="px-4 pb-2 text-xs font-bold text-ink">Recent projects</div>
          <RecentProjects close={close} />
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
    <button type="button" onClick={() => setEditing(true)} title="Rename project" aria-label={`Project name: ${name}. Click to rename`} data-testid="project-name" className="group flex h-9 min-w-0 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-field" style={{ maxWidth }}><span className="min-w-0 truncate">{name}</span><Pencil size={11} className="shrink-0 text-faint group-hover:text-ink" /></button>
  );
}

function SizeChip({ c, narrow, flat }: { c: Chrome; narrow: boolean; flat?: boolean }) {
  const shell = flat ? "h-9 gap-2 px-3 hover:bg-field coarse:h-11" : "h-[52px] gap-3 bg-panel shadow-float coarse:h-[60px]";
  const pano = panoramaCount(c.slide.width);
  // a panorama is one wide canvas: name the shape of one slide and how many there are, not the 28:5 of the whole strip
  const ratio = pano > 1 ? ratioLabel(c.slide.width / pano, c.slide.height) : c.format.ratio;
  if (c.isEdit) {
    return (
      <div data-testid="edit-size" className={`pointer-events-auto flex items-center rounded-full text-sm ${shell} ${flat ? "" : "px-5"}`} title="Pixel size of the active photo or video">
        <RatioGlyph w={c.slide.width} h={c.slide.height} />
        <span className="font-bold">{c.slide.width}×{c.slide.height}</span>
      </div>
    );
  }
  return (
    <Popover align="left" width={424} placement={flat ? "top" : "bottom"} trigger={(open, toggle) => (
      <button type="button" onClick={toggle} data-testid="format-chip" aria-label="Canvas size" title={pano > 1 ? `Canvas size: ${pano} slides of ${ratio}, ${c.slide.width}×${c.slide.height}px in all` : `Canvas size: ${c.slide.width}×${c.slide.height}px`} className={`pointer-events-auto flex items-center rounded-full text-sm ${shell} ${flat ? "" : "pl-5 pr-4"} ${open ? "ring-2 ring-ink/30" : ""}`}>
        {!narrow && <span className="text-mute">Size</span>}
        <RatioGlyph w={c.slide.width / pano} h={c.slide.height} />
        <span className="font-bold">{ratio}</span>
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
let hintedZoom = false;
export default function StageChrome() {
  const c = useChrome();
  const compact = useCompact();
  // tell people once how to zoom and move a photo inside its frame: it is a double-click (double-tap), which nothing on screen shows
  const els = useSelectedElements();
  const cell = useStore((s) => s.ui.selectedCell);
  useEffect(() => {
    if (hintedZoom || els.length !== 1) return;
    const e = els[0];
    const photo = (e.type === "image" || e.type === "video") ? !!e.fill?.assetId : cropTargetOf(getSlide(useStore.getState().project), e.id, cell) !== null;
    if (!photo) return;
    hintedZoom = true;
    useStore.getState().toast(`${isCoarse() ? "Double-tap" : "Double-click"} the photo to zoom and move it inside its frame`, "info");
  }, [els, cell]);
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

      <GuideChip compact />
      <PhotoWheel compact />
      <QuickAdjust compact />
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
  const zoom = (f: number) => { const v = st().ui.view; tweenView(v, zoomAround(v, f, size.w / 2, size.h / 2), (n) => st().setView(n)); };
  const dark = ui.theme === "dark";
  // the Properties card starts closed on smaller windows: open it the first time something is selected, and keep an Edit chip while it is shut
  const autoOpened = useRef(false);
  useEffect(() => {
    if (c.hasSelection && !ui.rightOpen && !autoOpened.current) { autoOpened.current = true; useStore.getState().setUI({ rightOpen: true }); }
  }, [c.hasSelection, ui.rightOpen]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20" data-testid="stage-chrome">
      {!ui.rightOpen && (c.hasSelection || c.isEdit) && (
        <div className="absolute right-5 top-[88px]">
          <button type="button" data-testid="edit-chip-desktop" onClick={() => st().setUI({ rightOpen: true })} className="pointer-events-auto flex h-9 items-center gap-2 rounded-full bg-pill px-4 text-xs font-semibold text-pillink shadow-float hover:opacity-90">
            <SlidersHorizontal size={14} /> {c.isEdit ? "Adjust photo" : "Edit"}
          </button>
        </div>
      )}
      {/* top row: project + canvas size on the left, history + preview + export on the right */}
      <div className="absolute inset-x-5 top-5 flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <Pill className="h-[52px] min-w-0 pr-4">
            <AppMenu compact={false} dark={dark} />
            <ProjectName name={c.name} maxWidth={narrow ? 110 : 200} />
            <SaveBadge status={c.status} words={!narrow} />
          </Pill>
          <SizeChip c={c} narrow={narrow} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Pill className="h-[52px] px-2">
            <IconButton icon={<Undo2 size={17} />} label="Undo" shortcut="⌘Z" onClick={() => st().undo()} disabled={!c.canUndo} testId="undo" />
            <IconButton icon={<Redo2 size={17} />} label="Redo" shortcut="⇧⌘Z" onClick={() => st().redo()} disabled={!c.canRedo} testId="redo" />
            {hasVideo && <IconButton icon={ui.playing ? <Pause size={17} /> : <Play size={17} />} label={ui.playing ? "Stop playback" : "Play slide"} active={ui.playing} onClick={() => st().setUI({ playing: !ui.playing })} testId="play-slide" />}
            <span className="mx-1 h-5 w-px bg-line" />
            <IconButton icon={<Eye size={17} />} label="Preview" onClick={() => st().setUI({ previewOpen: true, playing: false })} disabled={c.nothingToShow} testId="preview" />
            <IconButton icon={<PanelRight size={17} />} label={ui.rightOpen ? "Hide the edit panel" : "Show the edit panel"} active={ui.rightOpen} onClick={() => st().setUI({ rightOpen: !ui.rightOpen })} testId="toggle-properties" />
          </Pill>
          <button type="button" onClick={() => st().setUI({ exportOpen: true, playing: false })} data-testid="export" aria-label="Export" disabled={c.nothingToShow} className="pointer-events-auto flex h-[52px] items-center gap-2 rounded-full grad-pill px-6 text-sm font-bold text-pillink shadow-float hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"><Download size={16} /> Export</button>
        </div>
      </div>

      <GuideChip compact={false} lowered={size.w < 820} />
      <PhotoWheel compact={false} />
      <QuickAdjust compact={false} />
      {/* bottom centre: view */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <Pill className="h-[52px] px-2">
          <IconButton icon={<MousePointer2 size={16} />} label="Select" shortcut="V" active={ui.tool === "select"} onClick={() => st().setUI({ tool: "select" })} />
          <IconButton icon={<Hand size={16} />} label="Hand (pan)" shortcut="H / Space" active={ui.tool === "hand"} onClick={() => st().setUI({ tool: "hand" })} />
          <span className="mx-2 h-5 w-px bg-line" />
          <IconButton icon={<Minus size={16} />} label="Zoom out" shortcut="−" onClick={() => zoom(1 / 1.25)} testId="zoom-out" />
          <button type="button" title="Reset to 100%" data-testid="zoom-pct" onClick={() => { const v = st().ui.view; tweenView(v, zoomAround(v, 1 / v.scale, size.w / 2, size.h / 2), (n) => st().setView(n)); }} className="h-9 w-14 rounded-full text-center text-xs font-semibold tabular-nums hover:bg-field">{Math.round(ui.zoom)}%</button>
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
