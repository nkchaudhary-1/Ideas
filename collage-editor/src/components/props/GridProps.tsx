"use client";
import { Columns2, Eraser, Rows2, Trash2, Unlink2, LayoutGrid } from "lucide-react";
import type { GridEl } from "@/lib/types";
import { useStore, getSlide } from "@/lib/store";
import { SavePreset } from "@/components/ui/SavePreset";
import { captureLayout, defaultName } from "@/lib/user-presets";
import { findCell, removeCell, splitCell, updateCell, layoutGrid, cellsOf } from "@/lib/grid-engine";
import { ColorField } from "@/components/ui/ColorPicker";
import { Button, Field, Section, Slider } from "@/components/ui/controls";
import { makeMedia } from "@/lib/factory";
import { StrokeField, ShadowField } from "./StyleControls";
import { getAsset } from "@/lib/media";

export default function GridProps({ el }: { el: GridEl }) {
  const st = useStore.getState;
  const selectedCell = useStore((s) => s.ui.selectedCell);
  const set = (fn: (g: GridEl) => void, key?: string) => st().gridOp(el.id, (g) => fn(g as GridEl), { key });
  const cellId = selectedCell?.gridId === el.id ? selectedCell.cellId : null;
  const cell = cellId ? findCell(el.tree, cellId) : null;
  const count = cellsOf(el.tree).length;

  const explode = () => {
    const { cells } = layoutGrid(el);
    const frames = cells.map((c) => {
      const f = c.cell.fill;
      return makeMedia(f?.kind === "video" ? "video" : "image", c.rect.w, c.rect.h, f ? structuredClone(f) : null, { radius: c.cell.radius ?? el.radius, bg: c.cell.bg ?? el.cellBg, name: "Frame" }, el.x + c.rect.x, el.y + c.rect.y);
    });
    st().commit((p) => {
      const s = p.slides.find((x) => x.id === p.activeSlideId)!;
      const i = s.elements.findIndex((e) => e.id === el.id);
      s.elements.splice(i, 1, ...(frames as never[]));
    });
    st().select(frames.map((f) => f.id));
  };

  return (
    <>
      <Section title="Grid layout">
        <div className="flex items-center justify-between text-xs text-mute">
          <span data-testid="grid-count">{count} cell{count === 1 ? "" : "s"}</span>
          <Button variant="ghost" onClick={() => st().setUI({ leftPanel: "layouts" })}><LayoutGrid size={12} /> Change layout</Button>
        </div>
        <SavePreset label="Save layout" testId="save-layout" placeholder="Layout name" defaultName={() => defaultName(useStore.getState().presets, "layout")}
          onSave={(name) => { st().addPreset({ kind: "layout", name, data: captureLayout(el, getSlide(st().project)) }); st().toast(`Saved layout “${name}”`, "ok"); }} />
        <Slider label="Outer margin" value={Math.round(el.margin)} min={0} max={200} unit="px" onChange={(v) => set((g) => { g.margin = v; }, "margin")} testId="grid-margin" />
        <Slider label="Gutter" value={Math.round(el.gutter)} min={0} max={120} unit="px" onChange={(v) => set((g) => { g.gutter = v; }, "gutter")} testId="grid-gutter" />
        <Slider label="Corner" value={Math.round(el.radius)} min={0} max={200} unit="px" onChange={(v) => set((g) => { g.radius = v; }, "gradius")} testId="grid-radius" />
        <Field label="Cell colour"><ColorField value={el.cellBg} onChange={(c) => set((g) => { g.cellBg = c; }, "cellbg")} /></Field>
        <StrokeField label="Cell border" stroke={el.cellStroke} onChange={(s) => set((g) => { g.cellStroke = s; })} />
        <ShadowField shadow={el.shadow} onChange={(s) => st().updateElement(el.id, { shadow: s })} />
        <p className="text-2xs leading-4 text-faint">Drag a gap between cells to resize. Click a cell to edit its photo or video; drag a filled cell onto another to swap them.</p>
      </Section>

      <Section title={cell ? "Selected cell" : "Cells"}>
        {!cell && <p className="text-xs text-mute">Click a cell on the canvas to edit it, split it, or change its media.</p>}
        {cell && cellId && (
          <>
            <div className="flex flex-wrap gap-1">
              <Button onClick={() => set((g) => { g.tree = splitCell(g.tree, cellId, "h") as GridEl["tree"]; })} testId="split-h"><Columns2 size={12} /> Split ↔</Button>
              <Button onClick={() => set((g) => { g.tree = splitCell(g.tree, cellId, "v") as GridEl["tree"]; })} testId="split-v"><Rows2 size={12} /> Split ↕</Button>
              <Button variant="danger" disabled={count <= 1} onClick={() => { set((g) => { g.tree = removeCell(g.tree, cellId) as GridEl["tree"]; }); st().setUI({ selectedCell: null }); }} testId="remove-cell"><Trash2 size={12} /> Remove</Button>
              {cell.fill && <Button variant="ghost" onClick={() => set((g) => { g.tree = updateCell(g.tree, cellId, { fill: null }) as GridEl["tree"]; })}><Eraser size={12} /> Empty</Button>}
            </div>
            <Field label="Cell colour">
              <ColorField value={cell.bg ?? el.cellBg} onChange={(c) => set((g) => { g.tree = updateCell(g.tree, cellId, { bg: c }) as GridEl["tree"]; }, "cellbg-" + cellId)} />
              {cell.bg && <button type="button" className="text-2xs text-mute hover:text-ink" onClick={() => set((g) => { g.tree = updateCell(g.tree, cellId, { bg: null }) as GridEl["tree"]; })}>Reset</button>}
            </Field>
            <Slider label="Cell corner" value={Math.round(cell.radius ?? el.radius)} min={0} max={200} unit="px" neutral={el.radius} onChange={(v) => set((g) => { g.tree = updateCell(g.tree, cellId, { radius: v }) as GridEl["tree"]; }, "cr-" + cellId)} onReset={() => set((g) => { g.tree = updateCell(g.tree, cellId, { radius: null }) as GridEl["tree"]; })} />
            {!cell.fill && <p className="text-xs text-mute">Empty cell. Drag a photo or video here, or pick one from the Uploads panel.</p>}
          </>
        )}
        <Button variant="ghost" onClick={explode} testId="explode-grid" title="Turn each cell into a free frame you can move and overlap"><Unlink2 size={12} /> Convert to free frames</Button>
        {void getAsset}
      </Section>
    </>
  );
}
