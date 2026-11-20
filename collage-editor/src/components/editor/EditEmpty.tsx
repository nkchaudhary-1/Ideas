"use client";
import { useRef } from "react";
import { Images, SlidersHorizontal, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { ACCEPT } from "@/lib/media";
import { addAssetsToEdit, isEmptyEdit } from "@/lib/edit";
import { Button } from "@/components/ui/controls";

/** shown over the stage while an Edit project has no photo or video yet */
export default function EditEmpty() {
  const st = useStore.getState;
  const show = useStore((s) => s.project.kind === "edit" && s.project.slides.every(isEmptyEdit));
  const input = useRef<HTMLInputElement>(null);
  if (!show) return null;
  const add = async (files: File[]) => { if (!files.length) return; const a = await st().importMedia(files); if (a.length) addAssetsToEdit(a); };
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-stage p-8" data-testid="edit-empty"
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); void add([...e.dataTransfer.files]); }}>
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded border-2 border-dotted border-faint/60 px-10 py-14 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-field text-mute"><SlidersHorizontal size={22} /></span>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">Add photos or videos to edit</h2>
          <p className="mt-2 text-sm text-mute">Edit one, or bring in a few and edit them together. Nothing is combined into a collage.</p>
        </div>
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="edit-empty-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; void add(f); }} />
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => input.current?.click()} testId="edit-empty-add"><Upload size={14} /> Add from device</Button>
          <Button onClick={() => st().setUI({ leftPanel: "uploads" })}><Images size={14} /> From library</Button>
        </div>
      </div>
    </div>
  );
}
