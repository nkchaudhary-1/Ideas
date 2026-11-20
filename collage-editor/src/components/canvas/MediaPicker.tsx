"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/controls";
import { Film, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { ACCEPT } from "@/lib/media";
import { cellsOf } from "@/lib/grid-engine";
import type { Asset, GridEl } from "@/lib/types";
import { formatTime } from "@/lib/util";

let hinted = false;

/**
 * "Add a photo or video" for an empty tile. Opens where you clicked: upload from your device or pick from the library.
 * The choice fills the tile and drops straight into reposition mode (drag to move, scroll to zoom).
 */
export default function MediaPicker() {
  const mp = useStore((s) => s.ui.mediaPicker);
  const assets = useStore((s) => s.assets);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => useStore.getState().setUI({ mediaPicker: null });

  useEffect(() => {
    if (!mp) return;
    const down = (e: PointerEvent) => { if (!panel.current?.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    // pointerdown, not mousedown: a touch gesture on the canvas does not produce a mouse event
    const t = setTimeout(() => window.addEventListener("pointerdown", down), 0);
    window.addEventListener("keydown", key, true);
    return () => { clearTimeout(t); window.removeEventListener("pointerdown", down); window.removeEventListener("keydown", key, true); };
  }, [mp]);

  if (!mp || typeof document === "undefined") return null;
  // fits any screen: never wider or taller than the viewport minus a 16px margin
  const W = Math.min(332, window.innerWidth - 32), H = Math.min(392, window.innerHeight - 32);
  const left = Math.max(16, Math.min(mp.x - 24, window.innerWidth - W - 16));
  const top = mp.y + 18 + H > window.innerHeight ? Math.max(16, mp.y - H - 18) : mp.y + 18;

  const place = (list: Asset[]) => {
    const st = useStore.getState();
    const [first, ...rest] = list;
    if (!first || !mp) return;
    if (mp.gridId && mp.cellId) {
      st.setCellMedia(mp.gridId, mp.cellId, first);
      // extra files go into the grid's other empty tiles, in order
      const g = st.project.slides.flatMap((s) => s.elements).find((e) => e.id === mp.gridId) as GridEl | undefined;
      if (g && rest.length) {
        const empties = cellsOf(g.tree).filter((c) => !c.fill && c.id !== mp.cellId);
        rest.slice(0, empties.length).forEach((a, i) => useStore.getState().setCellMedia(mp.gridId!, empties[i].id, a));
      }
      st.select([mp.gridId]);
      st.setUI({ selectedCell: { gridId: mp.gridId, cellId: mp.cellId }, cropId: mp.gridId, mediaPicker: null });
    } else if (mp.elementId) {
      st.setElementMedia(mp.elementId, first);
      st.select([mp.elementId]);
      st.setUI({ cropId: mp.elementId, mediaPicker: null });
    }
    if (!hinted) { hinted = true; st.toast("Drag to reposition, scroll to zoom. Press Esc when you're done.", "info"); }
  };

  const upload = async (files: File[]) => {
    if (!files.length) return;
    const got = await useStore.getState().importMedia(files);
    place(got);
  };

  const ready = assets.filter((a) => a.status === "ready");
  return createPortal(
    <div ref={panel} data-testid="media-picker" role="dialog" aria-label="Add photo or video" style={{ position: "fixed", left, top, width: W, maxHeight: H }}
      className="pop card z-[70] flex flex-col overflow-hidden p-5 shadow-float">
      <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="media-picker-input" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; void upload(f); }} />
      <Button variant="primary" className="w-full" onClick={() => input.current?.click()} testId="media-picker-upload"><Upload size={15} /> Upload photo or video</Button>
      <div className="mb-3 mt-5 flex items-center justify-between">
        <span className="text-xs font-bold text-ink">From your library</span>
        <span className="text-2xs text-mute">{ready.length} item{ready.length === 1 ? "" : "s"}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {ready.length === 0 ? (
          <p className="py-6 text-center text-xs leading-5 text-mute">Nothing in the library yet. Upload something above and it will appear here next time.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2" data-testid="media-picker-grid">
            {ready.map((a) => (
              <button key={a.id} type="button" title={a.name} onClick={() => place([a])} className="relative aspect-square overflow-hidden rounded-in-20 bg-field ring-1 ring-line transition hover:ring-2 hover:ring-ink/40">
                <img src={a.thumb} alt={a.name} className="h-full w-full object-cover" draggable={false} />
                {a.kind === "video" && <span className="absolute bottom-0.5 left-0.5 flex items-center gap-0.5 rounded bg-black/70 px-1 text-2xs text-white"><Film size={9} />{formatTime(a.duration ?? 0)}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
