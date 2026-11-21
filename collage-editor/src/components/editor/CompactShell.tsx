"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useMediaQuery } from "@/lib/use-media";
import Workspace from "@/components/canvas/Workspace";
import Toast from "@/components/ui/Toast";
import StageChrome, { CompactTopBar } from "./StageChrome";
import SlideStrip from "./SlideStrip";
import EditStrip from "./EditStrip";
import EditEmpty from "./EditEmpty";
import Dock from "./Dock";
import ContextBar from "./ContextBar";
import BottomSheet from "./BottomSheet";
import { usePhotoTarget } from "./photo-actions";

/** the row along the bottom: the tools for what is selected, or the tool rail when nothing is */
function BottomBar() {
  const edit = useStore((s) => s.project.kind === "edit");
  const sheet = useStore((s) => s.ui.sheet);
  const selected = useStore((s) => s.selection.length > 0);
  const typing = useStore((s) => !!s.ui.editingTextId);
  const photo = usePhotoTarget();
  const context = typing || (edit ? !!photo : selected);
  // an open tool panel keeps the tool rail in view, so you can switch panels or close it
  return context && sheet !== "tools" ? <ContextBar /> : <Dock />;
}

/**
 * Phones and portrait tablets, the way Canva, CapCut and Lightroom lay it out: one slim bar on top, the work in the middle, one bar at the
 * bottom. Nothing floats over the picture; tools open as sheets that push the canvas up, and the strip of slides (or photos, in Edit mode)
 * sits between the canvas and the bottom bar when there is room for it.
 */
export default function CompactShell() {
  const kind = useStore((s) => s.project.kind);
  const sheet = useStore((s) => s.ui.sheet);
  const size = useStore((s) => s.ui.sheetSize);
  const requestFit = useStore((s) => s.requestFit);

  // the canvas changes size when a sheet opens or grows: refit it
  useEffect(() => { const t = setTimeout(requestFit, 60); return () => clearTimeout(t); }, [sheet, size, requestFit]);

  const edit = kind === "edit";
  // a tall sheet leaves no room for the strip. On a short screen (a phone with its browser bars) an open sheet leaves room for
  // a slim row of photo thumbnails in Edit mode, so you can still switch photos while adjusting; collage slides wait for the sheet to close.
  const short = useMediaQuery("(max-height: 720px)");
  const slim = edit && !!sheet && short;
  const showStrip = !sheet || size === "half";
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col gap-2 bg-bg px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-[max(4px,env(safe-area-inset-top))] text-ink" data-testid="editor-root" data-compact>
      <CompactTopBar />
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-big bg-stage ring-1 ring-line/70">
        <Workspace />
        <EditEmpty />
        <StageChrome />
        <Toast />
      </div>
      {showStrip && (edit ? (!sheet || !short || slim) && <EditStrip slim={slim} /> : !(sheet && short) && <SlideStrip />)}
      <BottomSheet />
      <BottomBar />
    </div>
  );
}
