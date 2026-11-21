import { useStore } from "@/lib/store";
import { useEditTarget, useFillTarget, type FillTarget } from "@/components/props/fill-target";

/** the photo the controls act on: in Edit mode the open photo, otherwise the selected frame or cell */
export function usePhotoTarget(): FillTarget | null {
  const edit = useStore((s) => s.project.kind === "edit");
  const ft = useFillTarget();
  const et = useEditTarget();
  return edit ? et : ft;
}

// what the photo wheel on a desktop and the toolbar on a phone both do to the photo
export const turnPhoto = (t: FillTarget) => t.update((x) => { x.rotation90 = ((x.rotation90 + 90) % 360) as 0 | 90 | 180 | 270; });
export const flipPhoto = (t: FillTarget) => t.update((x) => { x.flipX = !x.flipX; });
export const resetFraming = (t: FillTarget) => {
  t.update((x) => { x.zoom = 1; x.fx = 0.5; x.fy = 0.5; x.flipX = false; x.flipY = false; x.rotation90 = 0; });
  useStore.getState().setUI({ cropId: null });
};
export const toggleCrop = (t: FillTarget) => { const st = useStore.getState(); st.setUI({ cropId: st.ui.cropId === t.elementId ? null : t.elementId }); };
/** open the "choose a photo or video" picker for this photo, anchored at a point on screen */
export const replacePhoto = (t: FillTarget, at: { x: number; y: number }) =>
  useStore.getState().setUI({ mediaPicker: { x: at.x, y: at.y, ...(t.kind === "cell" ? { gridId: t.elementId, cellId: t.cellId } : { elementId: t.elementId }) } });
