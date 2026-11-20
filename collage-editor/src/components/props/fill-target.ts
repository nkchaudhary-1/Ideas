import type { Draft } from "immer";
import type { Element, GridEl, MediaEl, MediaFill } from "@/lib/types";
import { useStore, useSelectedElements, getSlide } from "@/lib/store";
import { mediaOf } from "@/lib/edit";
import { findCell, layoutGrid, updateCell } from "@/lib/grid-engine";

export interface FillTarget {
  fill: MediaFill;
  frame: { w: number; h: number };
  label: string;
  kind: "element" | "cell";
  elementId: string;
  cellId?: string;
  elKey: string;
  update: (fn: (f: Draft<MediaFill>) => void, key?: string) => void;
  clear: () => void;
}

/** the photo/video being edited: a selected image/video frame, or the selected cell of a selected grid */
export function useFillTarget(): FillTarget | null {
  const els = useSelectedElements();
  const selectedCell = useStore((s) => s.ui.selectedCell);
  if (els.length !== 1) return null;
  const el: Element = els[0];
  const st = useStore.getState;
  if ((el.type === "image" || el.type === "video") && el.fill) {
    const m = el as MediaEl;
    return {
      fill: m.fill!,
      frame: { w: el.width, h: el.height },
      label: el.name,
      kind: "element",
      elementId: el.id,
      elKey: el.id,
      update: (fn, key) => st().updateElement(el.id, (e) => { const f = (e as MediaEl).fill; if (f) fn(f); }, { key }),
      clear: () => st().updateElement(el.id, (e) => { (e as MediaEl).fill = null; e.type = "image"; }),
    };
  }
  if (el.type === "grid" && selectedCell?.gridId === el.id) {
    const cell = findCell(el.tree, selectedCell.cellId);
    const rect = layoutGrid(el).cells.find((c) => c.id === selectedCell.cellId)?.rect;
    if (cell?.fill && rect) {
      return {
        fill: cell.fill,
        frame: { w: rect.w, h: rect.h },
        label: `${el.name} · cell`,
        kind: "cell",
        elementId: el.id,
        cellId: cell.id,
        elKey: `${el.id}:${cell.id}`,
        update: (fn, key) => st().gridOp(el.id, (g) => { const c = findCell((g as GridEl).tree, cell.id); if (c?.fill) fn(c.fill as Draft<MediaFill>); }, { key }),
        clear: () => st().gridOp(el.id, (g) => { g.tree = updateCell((g as GridEl).tree, cell.id, { fill: null }) as GridEl["tree"]; }),
      };
    }
  }
  return null;
}

/** Edit mode: the active photo/video, or every selected one at once (batch). `slideIds` is who an edit applies to. */
export interface EditTarget extends FillTarget { /** like update, but only the active photo/video (trim, cover frame…) */ solo: FillTarget["update"]; slideId: string; slideIds: string[]; slide: { width: number; height: number; name: string } }

export function useEditTarget(): EditTarget | null {
  const project = useStore((s) => s.project);
  const sel = useStore((s) => s.ui.mediaSel);
  const slide = getSlide(project);
  const el = mediaOf(slide);
  if (!el?.fill) return null;
  const st = useStore.getState;
  const valid = sel.filter((id) => project.slides.some((s) => s.id === id));
  const ids = valid.length > 1 && valid.includes(slide.id) ? valid : [slide.id];
  return {
    fill: el.fill,
    frame: { w: el.width, h: el.height },
    label: slide.name,
    kind: "element",
    elementId: el.id,
    elKey: slide.id,
    slideId: slide.id,
    slideIds: ids,
    slide: { width: slide.width, height: slide.height, name: slide.name },
    // one history step per gesture, for the whole selection
    update: (fn, key) => st().commit((p) => {
      for (const sl of p.slides) {
        if (!ids.includes(sl.id)) continue;
        const f = (mediaOf(sl as never)?.fill) as Draft<MediaFill> | undefined;
        if (f) fn(f);
      }
    }, { key: key ? `${key}|${ids.length > 1 ? ids.join(",") : slide.id}` : undefined }),
    solo: (fn, key) => st().commit((p) => {
      const f = (mediaOf(p.slides.find((x) => x.id === slide.id) as never)?.fill) as Draft<MediaFill> | undefined;
      if (f) fn(f);
    }, { key: key ? `${key}|${slide.id}` : undefined }),
    clear: () => st().removeEditSlides(ids),
  };
}
