"use client";
import { Film, Image as ImageIcon, RotateCcw, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { getAsset } from "@/lib/media";
import { formatTime } from "@/lib/util";
import { resetEdits } from "@/lib/edit";
import { fillIsNeutral } from "@/lib/filters";
import { Button } from "@/components/ui/controls";
import MediaProps from "./MediaProps";
import { CopyPasteSection, MatchSection } from "./EditSections";
import { useEditTarget } from "./fill-target";

/** The properties card in "Edit photos & videos" mode: one photo or video, or a whole selection at once. */
export default function EditPanel() {
  const target = useEditTarget();
  const st = useStore.getState;
  const refId = useStore((s) => s.ui.refSlideId);
  const asset = target ? getAsset(target.fill.assetId) : undefined;
  const n = target?.slideIds.length ?? 0;
  const batch = n > 1;
  const edited = target ? !fillIsNeutral(target.fill) || !!target.fill.match : false;

  return (
    <aside className="card pop flex w-[344px] shrink-0 flex-col overflow-hidden" data-testid="properties">
      <div className="flex h-[72px] shrink-0 items-center gap-3 px-8">
        {target && (target.fill.kind === "video" ? <Film size={16} className="text-mute" /> : <ImageIcon size={16} className="text-mute" />)}
        <h2 className="min-w-0 flex-1 truncate text-base font-extrabold tracking-tight" data-testid="edit-title">{batch ? `${n} selected` : target?.slide.name ?? "Edit"}</h2>
        {target && refId === target.slideId && <span className="rounded-full bg-field px-2 py-0.5 text-2xs font-semibold text-mute">Reference</span>}
        {target && <span className="rounded-full bg-field px-2 py-0.5 text-2xs font-semibold text-mute">{batch ? "Batch" : target.fill.kind === "video" ? "Video" : "Photo"}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6" data-testid="properties-scroll">
        {!target ? (
          <div className="mx-3 mb-3 rounded-in-12 bg-panel2 px-5 py-5 text-xs leading-5 text-mute">
            <div className="mb-1 text-sm font-bold text-ink">Nothing to edit yet</div>
            Add photos or videos to start. Every one is edited on its own, or together with a selection.
          </div>
        ) : (
          <>
            <div className="mx-3 mb-3 flex items-center gap-3 rounded-in-12 bg-panel2 px-5 py-4" data-testid="edit-file">
              {asset ? <img src={asset.thumb} alt="" className="h-11 w-11 rounded object-cover" /> : <span className="h-11 w-11 rounded-in-12 bg-raised" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-ink">{batch ? `${n} items · edits apply to all` : asset?.name ?? "Missing media"}</div>
                <div className="text-2xs text-mute">{batch ? "Click one in the strip to edit it alone" : asset ? `${target.slide.width}×${target.slide.height}${asset.duration ? ` · ${formatTime(asset.duration)}` : ""}` : "Re-import this file"}</div>
              </div>
              <button type="button" title={batch ? "Remove the selection from the editor" : "Remove from the editor"} aria-label="Remove from editor" data-testid="remove-from-edit" onClick={() => target.clear()}
                className="grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-red-500/10 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
            <CopyPasteSection target={target} />
            <MatchSection target={target} />
            <MediaProps target={target} edit={target} />
            <div className="px-8 pt-2"><Button variant="ghost" className="w-full" disabled={!edited && !batch} testId="reset-edits" onClick={() => { resetEdits(target.slideIds); st().toast(`Edits reset on ${n} ${n === 1 ? "item" : "items"}`, "ok"); }}><RotateCcw size={12} /> Reset {batch ? "selected" : "all edits"}</Button></div>
          </>
        )}
      </div>
    </aside>
  );
}
