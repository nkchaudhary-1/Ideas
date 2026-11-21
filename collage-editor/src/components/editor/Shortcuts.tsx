"use client";
import { DEFAULT_COPY, captureEdit, mediaOf, pasteToSlides, selectSlides, selectWhere } from "@/lib/edit";
import { useEffect } from "react";
import { useStore, getSlide } from "@/lib/store";
import { isTypingTarget } from "@/lib/util";
import { tweenView, zoomAround, viewForRect } from "@/lib/view-math";
import { boundsOf, flatten, unionRects } from "@/lib/geometry";
import { makeText } from "@/lib/factory";
import { inkFor } from "@/lib/presets";

export const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "⌘/Ctrl Z", action: "Undo" },
  { keys: "⇧ ⌘/Ctrl Z  ·  Ctrl Y", action: "Redo" },
  { keys: "⌘/Ctrl C / V", action: "Copy / paste (works across slides)" },
  { keys: "⌘/Ctrl D", action: "Duplicate" },
  { keys: "Delete / Backspace", action: "Delete selection" },
  { keys: "⌘/Ctrl A", action: "Select all" },
  { keys: "Esc", action: "Deselect / leave crop or text edit" },
  { keys: "Arrow keys  ·  ⇧ Arrow", action: "Nudge 1 px  ·  10 px" },
  { keys: "⌘/Ctrl G  ·  ⇧ ⌘/Ctrl G", action: "Group / ungroup" },
  { keys: "⌘/Ctrl ] / [", action: "Bring forward / send backward" },
  { keys: "⇧ ⌘/Ctrl ] / [", action: "Bring to front / send to back" },
  { keys: "+ / −", action: "Zoom in / out" },
  { keys: "⇧ 1  ·  ⇧ 2  ·  0", action: "Fit canvas  ·  zoom to selection  ·  100%" },
  { keys: "Space + drag  ·  middle mouse", action: "Pan" },
  { keys: "Scroll  ·  ⌘/Ctrl scroll", action: "Pan  ·  zoom (scroll zooms the photo in crop mode)" },
  { keys: "Enter  ·  double-click", action: "Edit text / crop a photo or video" },
  { keys: "V  ·  H", action: "Select tool  ·  hand tool" },
  { keys: "T", action: "Add text" },
  { keys: "Alt while dragging", action: "Temporarily disable snapping" },
  { keys: "?", action: "This list" },
];

/** global keyboard shortcuts; they never fire while a text field or the text editor has focus */
export default function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      // a focused slider is not a text field: ⌘Z, ⌘C and ⌘V should still work right after dragging one
      if (isTypingTarget(e.target) && !((mod || e.key === "\\") && (e.target as HTMLInputElement).type === "range")) return;
      const st = useStore.getState();
      const k = e.key.toLowerCase();
      const ui = st.ui;
      if (ui.home || ui.importOpen || ui.newProjectOpen || ui.exportOpen || ui.previewOpen) return;
      const size = ui.canvasSize;
      const handled = () => { e.preventDefault(); e.stopPropagation(); };

      if (mod && k === "z") { handled(); e.shiftKey ? st.redo() : st.undo(); return; }
      if (st.project.kind === "edit") {
        // photo & video editor: ⌘A selects every item, ⌘C / ⌘V copy and paste edit settings, arrows step through the strip
        const sl = getSlide(st.project);
        const ids = ui.mediaSel.length > 1 && ui.mediaSel.includes(sl.id) ? ui.mediaSel : [sl.id];
        if (mod && k === "a") { handled(); selectWhere("all"); return; }
        if (mod && k === "c") { const f = mediaOf(sl)?.fill; if (f) { handled(); st.setEditClip(captureEdit(f, sl, DEFAULT_COPY)); st.toast(`Copied edit settings from “${sl.name}”`, "ok"); } return; }
        if (mod && k === "v") {
          if (!st.editClip) return; // nothing copied: let the browser paste an image from the clipboard
          handled();
          const n = pasteToSlides(ids, st.editClip);
          st.toast(n ? `Pasted onto ${n} ${n === 1 ? "item" : "items"}` : "Select a different photo or video to paste onto", n ? "ok" : "info");
          return;
        }
        if (!mod && (k === "delete" || k === "backspace")) { handled(); st.removeEditSlides(ids); return; }
        if (!mod && (k === "arrowleft" || k === "arrowright")) {
          handled();
          const i = st.project.slides.findIndex((x) => x.id === sl.id);
          const next = st.project.slides[i + (k === "arrowright" ? 1 : -1)];
          if (next) selectSlides([next.id], next.id);
          return;
        }
        if (!mod && e.key === "\\") { handled(); if (!ui.compare) st.setUI({ compare: true }); return; }
        if (mod && (k === "d" || k === "g")) { handled(); return; }
      }
      if (mod && k === "y") { handled(); st.redo(); return; }
      if (mod && k === "c") { handled(); st.copy(); return; }
      if (mod && k === "v") { handled(); st.paste(); return; }
      if (mod && k === "d") { handled(); st.duplicateElements(); return; }
      if (mod && k === "a") { handled(); st.selectAll(); return; }
      if (mod && k === "g") { handled(); e.shiftKey ? st.ungroup() : st.group(); return; }
      if (mod && (k === "]" || e.code === "BracketRight")) { handled(); st.reorder(e.shiftKey ? "front" : "forward"); return; }
      if (mod && (k === "[" || e.code === "BracketLeft")) { handled(); st.reorder(e.shiftKey ? "back" : "backward"); return; }
      if (mod && k === "'") { handled(); st.commit((p) => { const s = p.slides.find((x) => x.id === p.activeSlideId)!; s.grid.visible = !s.grid.visible; }); return; }
      if (mod) return;

      if (k === "delete" || k === "backspace") { handled(); st.deleteElements(); return; }
      if (k === "escape") {
        if (ui.cropId || ui.editingTextId) st.setUI({ cropId: null, editingTextId: null });
        else if (ui.selectedCell) st.setUI({ selectedCell: null });
        else st.clearSelection();
        return;
      }
      if (k === "enter") {
        const sl = getSlide(st.project);
        const el = flatten(sl.elements).find((x) => x.id === st.selection[0]);
        if (el?.type === "text") { handled(); st.setUI({ editingTextId: el.id }); }
        else if ((el?.type === "image" || el?.type === "video") && el.fill?.assetId) { handled(); st.setUI({ cropId: el.id }); }
        return;
      }
      if (k.startsWith("arrow") && st.selection.length) {
        handled();
        const d = e.shiftKey ? 10 : 1;
        st.nudge(k === "arrowleft" ? -d : k === "arrowright" ? d : 0, k === "arrowup" ? -d : k === "arrowdown" ? d : 0);
        return;
      }
      if (e.key === "+" || e.key === "=") { handled(); tweenView(ui.view, zoomAround(ui.view, 1.25, size.w / 2, size.h / 2), (n) => st.setView(n)); return; }
      if (e.key === "-" || e.key === "_") { handled(); tweenView(ui.view, zoomAround(ui.view, 1 / 1.25, size.w / 2, size.h / 2), (n) => st.setView(n)); return; }
      if (e.key === "!" || (e.shiftKey && e.code === "Digit1")) { handled(); st.requestFit(); return; }
      if (e.key === "@" || (e.shiftKey && e.code === "Digit2")) {
        handled();
        const sel = flatten(getSlide(st.project).elements).filter((x) => st.selection.includes(x.id));
        const r = unionRects(sel.map(boundsOf));
        if (r) st.setView(viewForRect(size, r));
        return;
      }
      if (k === "0" && !e.shiftKey) { handled(); st.setView(zoomAround(ui.view, 1 / ui.view.scale, size.w / 2, size.h / 2)); return; }
      if (k === "t" && !e.shiftKey) {
        handled();
        const sl = getSlide(st.project);
        const t = makeText({ text: "Heading", fontSize: Math.round(sl.width / 10), fontWeight: 700, fill: { type: "solid", color: inkFor(sl) } }, 0, 0);
        t.width = Math.round(sl.width * 0.7);
        t.x = Math.round((sl.width - t.width) / 2);
        t.y = Math.round(sl.height / 2 - t.fontSize / 2);
        st.addElement(t);
        st.setUI({ editingTextId: t.id });
        return;
      }
      if (k === "v") { st.setUI({ tool: "select" }); return; }
      if (k === "h") { st.setUI({ tool: "hand" }); return; }
      if (e.key === "?") { st.setUI({ shortcutsOpen: true }); return; }
    };
    const onUp = (e: KeyboardEvent) => { if (e.key === "\\" && useStore.getState().ui.compare) useStore.getState().setUI({ compare: false }); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onUp); };
  }, []);
}
