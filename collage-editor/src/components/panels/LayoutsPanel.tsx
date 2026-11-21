"use client";
import { useEffect, useState } from "react";
import { useStore, getSlide, useSelectedElements } from "@/lib/store";
import { GRID_PRESETS, layoutGrid, presetCellCount, suggestPresets, treeFromPreset, type GridPreset } from "@/lib/grid-engine";
import { Button, ChipRow, Field, NumberField, Section, Segmented } from "@/components/ui/controls";
import { firstEmptySegment } from "@/lib/store";
import { panoramaCount } from "@/lib/formats";
import { createCollageFromAssets } from "@/lib/workflows";
import { cell } from "@/lib/grid-engine";
import type { GridNode } from "@/lib/types";
import { uid } from "@/lib/util";
import { PresetActions, RenameLabel } from "@/components/ui/SavePreset";

export function GridThumb({ preset, tree, w = 54, h = 68, active }: { preset?: GridPreset; tree?: GridNode; w?: number; h?: number; active?: boolean }) {
  const { cells } = layoutGrid({ tree: tree ?? treeFromPreset(preset!), width: w, height: h, margin: preset?.margin !== undefined ? Math.min(6, preset.margin / 8) : 3, gutter: Math.max(1.5, (preset?.gutter ?? 12) / 8) });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={active ? "text-ink" : "text-ink"}>
      <rect width={w} height={h} rx={6} style={{ fill: "rgb(var(--c-field))" }} />
      {cells.map((c, i) => <rect key={i} x={c.rect.x} y={c.rect.y} width={c.rect.w} height={c.rect.h} rx={Math.min(4, (preset?.radius ?? 12) / 8)} fill="currentColor" opacity={0.5} />)}
    </svg>
  );
}

const TABS = ["All", "My layouts", "Cards", "Basic", "Asymmetric", "Dense", "Editorial"] as const;
/** a layout's name: a pill over the tile on hover or keyboard focus, or under it on a touch screen where nothing can hover */
const NAME = "pointer-events-none absolute inset-x-1 bottom-1 truncate rounded-full bg-pill px-2 py-1 text-center text-2xs font-semibold text-pillink opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 touch:static touch:w-full touch:bg-transparent touch:p-0 touch:font-medium touch:text-mute touch:opacity-100";
const TILE = "relative flex h-[104px] w-full items-center justify-center rounded p-2 hover:bg-ink/5 touch:h-32 touch:flex-col touch:gap-2";

export default function LayoutsPanel() {
  const st = useStore.getState;
  const assets = useStore((s) => s.assets);
  const sel = useStore((s) => s.ui.assetSelection);
  const slide = useStore((s) => getSlide(s.project));
  const els = useSelectedElements();
  const presets = useStore((s) => s.presets);
  const pin = useStore((s) => s.ui.pinSegment);
  const layoutMode = useStore((s) => s.ui.layoutMode);
  const [renaming, setRenaming] = useState<string | null>(null);
  const myLayouts = presets.filter((p) => p.kind === "layout");
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(2);
  const chosen = sel.map((id) => assets.find((a) => a.id === id)).filter(Boolean) as typeof assets;
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const groups = TABS.slice(2) as readonly GridPreset["group"][];
  const activeGrid = els.length === 1 && els[0].type === "grid" ? els[0] : null;
  const n = panoramaCount(slide.width);
  const free = firstEmptySegment(slide);
  const next = pin ?? free;
  // what a click does when a grid is selected: on a panorama with a free slide, add; otherwise re-shape the selected grid
  const resolved: "add" | "replace" = !activeGrid ? "add" : layoutMode !== "auto" ? layoutMode : n >= 2 && next !== null ? "add" : "replace";
  useEffect(() => { st().setUI({ layoutMode: "auto" }); }, [activeGrid?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const drag = (id: string) => ({ draggable: true, onDragStart: (e: React.DragEvent) => { e.dataTransfer.setData("application/x-layout", id); e.dataTransfer.effectAllowed = "copy"; } });
  const suggestions = chosen.length ? suggestPresets(chosen.length, slide.width / slide.height) : [];

  const custom = () => {
    const tree: GridNode = { kind: "split", id: uid("s"), dir: "v", weights: Array(rows).fill(1), children: Array.from({ length: rows }, () => ({ kind: "split", id: uid("s"), dir: "h", weights: Array(cols).fill(1), children: Array.from({ length: cols }, () => cell()) }) as GridNode) };
    st().addGridTree(tree, `Custom ${cols}×${rows}`);
  };

  return (
    <div className="h-full overflow-y-auto" data-testid="layouts-panel">
      <div className={`space-y-4 px-8 pb-5 ${activeGrid || n >= 2 ? "" : "max-[899px]:pb-0"}`} data-testid="layout-target">
        {n >= 2 ? (
          <>
            <p className="text-xs leading-5 text-mute">
              {resolved === "replace" ? "Clicking a layout re-arranges the selected grid." : <>Next layout goes to <b className="text-ink">slide {next !== null ? next + 1 : n}</b>. Pick a layout, or drag one onto any slide.</>}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose slide">
              {Array.from({ length: n }, (_, i) => (
                <button key={i} type="button" data-testid={`layout-slide-${i + 1}`} aria-pressed={pin === i} onClick={() => st().setUI({ pinSegment: pin === i ? null : i })}
                  className={`h-8 min-w-8 rounded-full px-3 text-xs font-bold transition-colors ${pin === i ? "bg-pill text-pillink" : next === i ? "bg-field text-ink ring-1 ring-ink/40" : "bg-field text-mute hover:text-ink"}`}>{i + 1}</button>
              ))}
            </div>
          </>
        ) : (
          <p className={`text-xs leading-5 text-mute ${activeGrid ? "" : "max-[899px]:hidden"}`}>
            Every layout makes real, editable cells. {activeGrid ? (resolved === "replace" ? "A grid is selected: clicking a layout re-arranges it and keeps your photos." : "Clicking a layout adds it as a new grid.") : "Pick one to add it to the slide, or drag it onto the canvas."}
          </p>
        )}
        {activeGrid && (
          <Segmented size="sm" value={resolved} onChange={(v) => st().setUI({ layoutMode: v })} options={[{ value: "add", label: "Add new" }, { value: "replace", label: "Replace selected" }]} />
        )}
      </div>
      {chosen.length > 0 && (
        <Section title={`For your ${chosen.length} selected file${chosen.length > 1 ? "s" : ""}`}>
          <div className="grid grid-cols-3 gap-3">
            {suggestions.map((p) => <button key={p.id} type="button" title={p.name} {...drag(p.id)} onClick={() => { st().applyGridPreset(p); }} className="grid place-items-center rounded-in-12 p-2 hover:bg-ink/5"><GridThumb preset={p} w={72} h={88} /></button>)}
          </div>
          <Button variant="primary" onClick={() => createCollageFromAssets(chosen)} testId="make-collage">Make a collage from them</Button>
        </Section>
      )}
      {/* every layout in one grid: pick a tab to narrow it down. Names appear on hover. */}
      <ChipRow testId="layout-tabs" items={TABS.map((t) => ({ id: t, label: t }))} value={tab} onChange={setTab} />
      <div className="px-8 pb-6" data-testid="layout-grid">
        {tab === "My layouts" && myLayouts.length === 0 && (
          <p className="pb-2 text-xs leading-5 text-mute">Shape a collage, then choose “Save layout” in its properties. Your layouts appear here.</p>
        )}
        <div className="grid grid-cols-3 gap-3" data-testid={tab === "My layouts" || tab === "All" ? "my-layouts" : undefined}>
          {(tab === "All" || tab === "My layouts") && myLayouts.map((p) => (
            p.kind === "layout" ? (
              <div key={p.id} className="group relative" data-testid="layout-tile">
                <button type="button" title={`Apply “${p.name}”`} {...drag(p.id)} onClick={() => st().applyLayoutPreset(p.id)} className={TILE}>
                  <GridThumb tree={p.data.tree} w={72} h={88} />
                  <RenameLabel id={p.id} name={p.name} editing={renaming === p.id} setEditing={(v) => setRenaming(v ? p.id : null)} className={NAME} />
                </button>
                <PresetActions id={p.id} name={p.name} onRename={() => setRenaming(p.id)} />
              </div>
            ) : null
          ))}
          {GRID_PRESETS.filter((p) => tab === "All" ? groups.includes(p.group) : p.group === tab).sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group)).map((p) => {
            const cells = presetCellCount(p);
            return (
              <button key={p.id} type="button" title={`${p.name} · ${cells} cell${cells > 1 ? "s" : ""}`} aria-label={`${p.name}, ${cells} cell${cells > 1 ? "s" : ""}`} data-testid={`grid-${p.id}`} {...drag(p.id)} onClick={() => st().applyGridPreset(p)} className={`group ${TILE}`}>
                <GridThumb preset={p} w={72} h={88} />
                <span className={NAME}>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <Section title="Custom grid">
        <Field label="Columns"><NumberField width={64} value={cols} min={1} max={8} step={1} precision={0} onChange={(v) => setCols(Math.round(v))} /></Field>
        <Field label="Rows"><NumberField width={64} value={rows} min={1} max={10} step={1} precision={0} onChange={(v) => setRows(Math.round(v))} /></Field>
        <Button onClick={custom} testId="custom-grid">Create {cols} × {rows} grid</Button>
        <p className="text-2xs leading-4 text-faint">Split any cell further, or drag the gaps, once it is on the canvas.</p>
      </Section>
    </div>
  );
}
