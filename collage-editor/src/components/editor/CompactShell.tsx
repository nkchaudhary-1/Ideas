"use client";
import { useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { useStore, useSelectedElements } from "@/lib/store";
import { useFillTarget } from "@/components/props/fill-target";
import { useMediaQuery } from "@/lib/use-media";
import Workspace from "@/components/canvas/Workspace";
import Toast from "@/components/ui/Toast";
import StageChrome from "./StageChrome";
import SlideStrip from "./SlideStrip";
import EditStrip from "./EditStrip";
import EditEmpty from "./EditEmpty";
import { EmptyCanvas } from "./ModeGuide";
import Dock from "./Dock";
import BottomSheet from "./BottomSheet";

const TYPE_LABEL: Record<string, string> = { image: "photo", video: "video", text: "text", shape: "shape", grid: "layout", group: "group" };

/** a floating shortcut to the properties sheet while something is selected */
function EditChip() {
  const sheet = useStore((s) => s.ui.sheet);
  const els = useSelectedElements();
  const cropping = useStore((s) => !!s.ui.cropId || !!s.ui.editingTextId);
  const photo = useFillTarget(); // a selected photo has its own toolbar, with an Adjust button
  if (sheet || !els.length || cropping || photo) return null;
  const label = els.length === 1 ? `Edit ${TYPE_LABEL[els[0].type] ?? "item"}` : `Edit ${els.length} selected`;
  return (
    <button type="button" data-testid="edit-chip" onClick={() => useStore.getState().setUI({ sheet: "props" })}
      className="pointer-events-auto absolute bottom-20 left-1/2 z-20 flex h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full grad-pill px-5 text-sm font-bold text-pillink shadow-float">
      <Pencil size={14} /> {label}
    </button>
  );
}

/**
 * Phones and portrait tablets. The canvas takes the whole screen; tools sit in a dock along the bottom and open as sheets;
 * the strip of slides (or of photos, in Edit mode) stays between the canvas and the sheet when there is room for it.
 */
export default function CompactShell() {
  const kind = useStore((s) => s.project.kind);
  const projectId = useStore((s) => s.project.id);
  const sheet = useStore((s) => s.ui.sheet);
  const size = useStore((s) => s.ui.sheetSize);
  const requestFit = useStore((s) => s.requestFit);
  const opened = useRef<string | null>(null);

  // the editor for photos is the properties sheet: open it once per project
  useEffect(() => {
    if (kind === "edit" && opened.current !== projectId) {
      opened.current = projectId;
      useStore.getState().setUI({ sheet: "props", sheetSize: "half" });
    }
  }, [kind, projectId]);
  // the canvas changes size when a sheet opens or grows: refit it
  useEffect(() => { const t = setTimeout(requestFit, 60); return () => clearTimeout(t); }, [sheet, size, requestFit]);

  const edit = kind === "edit";
  // a tall sheet leaves no room for the strip. On a short screen (a phone with its browser bars) an open sheet leaves room for
  // a slim row of photo thumbnails in Edit mode, so you can still switch photos while adjusting; collage slides wait for the sheet to close.
  const short = useMediaQuery("(max-height: 720px)");
  const slim = edit && !!sheet && short;
  const showStrip = !sheet || size === "half";
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col gap-2 bg-bg p-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))] text-ink" data-testid="editor-root" data-compact>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-big bg-stage ring-1 ring-line/70">
        <Workspace />
        <EditEmpty />
        <EmptyCanvas />
        <StageChrome />
        <EditChip />
        <Toast />
      </div>
      {showStrip && (edit ? (!sheet || !short || slim) && <EditStrip slim={slim} /> : !(sheet && short) && <SlideStrip />)}
      <BottomSheet />
      <Dock />
    </div>
  );
}
