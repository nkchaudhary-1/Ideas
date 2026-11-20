"use client";
import { useState } from "react";
import { useStore, getSlide, useSelectedElements } from "@/lib/store";
import { GRID_PRESETS, layoutGrid, presetCellCount, suggestPresets, treeFromPreset, type GridPreset } from "@/lib/grid-engine";
import { Button, Field, NumberField, Section } from "@/components/ui/controls";
import { createCollageFromAssets } from "@/lib/workflows";
import { makeGrid } from "@/lib/factory";
import { cell } from "@/lib/grid-engine";
import type { GridNode } from "@/lib/types";
import { uid } from "@/lib/util";

export function GridThumb({ preset, w = 54, h = 68, active }: { preset: GridPreset; w?: number; h?: number; active?: boolean }) {
  const { cells } = layoutGrid({ tree: treeFromPreset(preset), width: w, height: h, margin: preset.margin !== undefined ? Math.min(6, preset.margin / 8) : 3, gutter: Math.max(1.5, (preset.gutter ?? 12) / 8) });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={active ? "text-accent" : "text-ink"}>
      <rect width={w} height={h} rx={6} style={{ fill: "rgb(var(--c-field))" }} />
      {cells.map((c, i) => <rect key={i} x={c.rect.x} y={c.rect.y} width={c.rect.w} height={c.rect.h} rx={Math.min(4, (preset.radius ?? 12) / 8)} fill="currentColor" opacity={0.5} />)}
    </svg>
  );
}

export default function LayoutsPanel() {
  const st = useStore.getState;
  const assets = useStore((s) => s.assets);
  const sel = useStore((s) => s.ui.assetSelection);
  const slide = useStore((s) => getSlide(s.project));
  const els = useSelectedElements();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(2);
  const chosen = sel.map((id) => assets.find((a) => a.id === id)).filter(Boolean) as typeof assets;
  const groups = ["From your posts", "Basic", "Asymmetric", "Dense", "Editorial"] as const;
  const activeGrid = els.length === 1 && els[0].type === "grid" ? els[0] : null;
  const suggestions = chosen.length ? suggestPresets(chosen.length, slide.width / slide.height) : [];

  const custom = () => {
    const tree: GridNode = { kind: "split", id: uid("s"), dir: "v", weights: Array(rows).fill(1), children: Array.from({ length: rows }, () => ({ kind: "split", id: uid("s"), dir: "h", weights: Array(cols).fill(1), children: Array.from({ length: cols }, () => cell()) }) as GridNode) };
    const g = makeGrid(undefined, slide.width, slide.height, { tree, name: `Custom ${cols}×${rows}` });
    st().addElement(g);
  };

  return (
    <div className="h-full overflow-y-auto" data-testid="layouts-panel">
      <div className="border-b border-line p-3 text-xs leading-5 text-mute">
        Every layout makes real, editable cells. {activeGrid ? <span className="text-accent">A grid is selected: clicking a layout re-arranges it and keeps your photos.</span> : "Pick one to add it to the slide."}
      </div>
      {chosen.length > 0 && (
        <Section title={`For your ${chosen.length} selected file${chosen.length > 1 ? "s" : ""}`}>
          <div className="grid grid-cols-4 gap-1.5">
            {suggestions.map((p) => <button key={p.id} type="button" title={p.name} onClick={() => { st().applyGridPreset(p); }} className="grid place-items-center rounded-md p-1 hover:bg-ink/5"><GridThumb preset={p} /></button>)}
          </div>
          <Button variant="primary" onClick={() => createCollageFromAssets(chosen)} testId="make-collage">Make a collage from them</Button>
        </Section>
      )}
      {groups.map((g) => (
        <Section key={g} title={g} defaultOpen={g !== "Dense"}>
          <div className="grid grid-cols-4 gap-1.5">
            {GRID_PRESETS.filter((p) => p.group === g).map((p) => (
              <button key={p.id} type="button" title={`${p.name} · ${presetCellCount(p)} cell${presetCellCount(p) > 1 ? "s" : ""}`} data-testid={`grid-${p.id}`} onClick={() => st().applyGridPreset(p)} className="group flex flex-col items-center gap-1 rounded-md p-1 hover:bg-ink/5">
                <GridThumb preset={p} />
                <span className="w-full truncate text-center text-2xs text-mute group-hover:text-ink">{p.name}</span>
              </button>
            ))}
          </div>
        </Section>
      ))}
      <Section title="Custom grid">
        <Field label="Columns"><NumberField width={64} value={cols} min={1} max={8} step={1} precision={0} onChange={(v) => setCols(Math.round(v))} /></Field>
        <Field label="Rows"><NumberField width={64} value={rows} min={1} max={10} step={1} precision={0} onChange={(v) => setRows(Math.round(v))} /></Field>
        <Button onClick={custom} testId="custom-grid">Create {cols} × {rows} grid</Button>
        <p className="text-2xs leading-4 text-faint">Split any cell further, or drag the gaps, once it is on the canvas.</p>
      </Section>
    </div>
  );
}
