import type { Draft } from "immer";
import type { Element, GridEl, MediaEl, MediaFill } from "@/lib/types";
import { useStore, useSelectedElements } from "@/lib/store";
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
