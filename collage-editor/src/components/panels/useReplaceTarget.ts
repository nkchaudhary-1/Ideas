import type { Asset } from "@/lib/types";
import { useStore, useSelectedElements } from "@/lib/store";

/** when a media frame (or grid cell) is selected, clicking library media replaces it; otherwise null */
export function useFillTargetLite(): ((a: Asset) => void) | null {
  const els = useSelectedElements();
  const cell = useStore((s) => s.ui.selectedCell);
  if (els.length !== 1) return null;
  const el = els[0];
  const st = useStore.getState;
  if (el.type === "image" || el.type === "video") return (a) => st().setElementMedia(el.id, a);
  if (el.type === "grid" && cell?.gridId === el.id) return (a) => st().setCellMedia(el.id, cell.cellId, a);
  return null;
}
