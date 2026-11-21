"use client";
import { Check, Copy, FlipHorizontal2, Move, Palette, Pencil, RefreshCw, RotateCcw, RotateCw, SlidersHorizontal, SplitSquareHorizontal, Sun, Trash2, Upload, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { DockBar, DockButton } from "./Dock";
import { flipPhoto, replacePhoto, resetFraming, toggleCrop, turnPhoto, usePhotoTarget } from "./photo-actions";

/**
 * Phones: the bottom bar changes with what is selected, the way Canva and CapCut do. A photo gets its own tools (replace, crop, filters, light,
 * turn, flip, reset); anything else gets edit, duplicate and delete; typing gets a Done. The × puts the tool rail back.
 */
export default function ContextBar() {
  const st = useStore.getState;
  const edit = useStore((s) => s.project.kind === "edit");
  const compare = useStore((s) => s.ui.compare);
  const cropId = useStore((s) => s.ui.cropId);
  const typing = useStore((s) => !!s.ui.editingTextId);
  const count = useStore((s) => s.selection.length);
  const target = usePhotoTarget();
  const props = () => st().setUI({ sheet: "props", sheetSize: "half" });
  const media = () => st().setUI({ leftPanel: "uploads", sheet: "tools", sheetSize: "half" });

  if (typing) {
    return (
      <DockBar label="Text" testId="context-bar">
        <DockButton icon={<Check size={20} />} label="Done" on testId="ctx-done" onClick={() => st().setUI({ editingTextId: null })} />
      </DockBar>
    );
  }

  if (target && (edit || count === 1)) {
    const cropping = cropId === target.elementId;
    return (
      <DockBar label="Photo tools" testId="context-bar">
        {edit
          ? <DockButton icon={<Upload size={20} />} label="Media" testId="ctx-media" onClick={media} />
          : <DockButton icon={<X size={20} />} label="Done" testId="ctx-done" onClick={() => st().clearSelection()} />}
        <span className="my-3 w-px shrink-0 bg-line" />
        {!edit && <DockButton icon={<RefreshCw size={20} />} label="Replace" testId="ctx-replace" onClick={() => {
          const b = document.querySelector("[data-testid=workspace]")?.getBoundingClientRect();
          replacePhoto(target, { x: (b?.left ?? 0) + (b?.width ?? 300) / 2, y: (b?.top ?? 0) + (b?.height ?? 300) / 2 });
        }} />}
        <DockButton icon={cropping ? <Check size={20} /> : <Move size={20} />} label={cropping ? "Done" : "Crop"} on={cropping} testId="ctx-crop" onClick={() => toggleCrop(target)} />
        <DockButton icon={<Palette size={20} />} label="Filters" testId="ctx-filters" onClick={() => st().setUI({ quick: "filters" })} />
        <DockButton icon={<Sun size={20} />} label="Light" testId="ctx-light" onClick={() => st().setUI({ quick: "adjust" })} />
        {edit && <DockButton icon={<SplitSquareHorizontal size={20} />} label="Compare" on={compare} testId="compare" hold={{ down: () => st().setUI({ compare: true }), up: () => st().setUI({ compare: false }) }} />}
        <DockButton icon={<RotateCw size={20} />} label="Turn" testId="ctx-turn" onClick={() => turnPhoto(target)} />
        <DockButton icon={<FlipHorizontal2 size={20} />} label="Flip" testId="ctx-flip" onClick={() => flipPhoto(target)} />
        <DockButton icon={<RotateCcw size={20} />} label="Reset" testId="ctx-reset" onClick={() => resetFraming(target)} />
        <DockButton icon={<SlidersHorizontal size={20} />} label="More" testId="ctx-more" onClick={props} />
      </DockBar>
    );
  }

  return (
    <DockBar label="Selection tools" testId="context-bar">
      <DockButton icon={<X size={20} />} label="Done" testId="ctx-done" onClick={() => st().clearSelection()} />
      <span className="my-3 w-px shrink-0 bg-line" />
      <DockButton icon={<Pencil size={20} />} label="Edit" testId="ctx-edit" onClick={props} />
      <DockButton icon={<Copy size={20} />} label="Duplicate" testId="ctx-duplicate" onClick={() => st().duplicateElements()} />
      <DockButton icon={<Trash2 size={20} />} label="Delete" danger testId="ctx-delete" onClick={() => st().deleteElements()} />
    </DockBar>
  );
}
