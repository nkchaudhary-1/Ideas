"use client";
import { useState } from "react";
import { useStore, getSlide, useActiveSlide } from "@/lib/store";
import { CUSTOM_FORMAT, FORMATS, PANORAMA_FORMATS, ratioLabel } from "@/lib/formats";
import type { Background, Format, LayoutGrid } from "@/lib/types";
import { ColorField } from "@/components/ui/ColorPicker";
import { Button, Field, NumberField, Section, Segmented, Select, Slider, Toggle } from "@/components/ui/controls";
import { PaintField } from "./StyleControls";
import { PALETTES } from "@/lib/colors";
import AssetPicker from "./AssetPicker";
import { newFill } from "@/lib/media-math";
import { flatten } from "@/lib/geometry";
import { formatTime } from "@/lib/util";
import { effectiveTrim, getAsset } from "@/lib/media";

export function RatioButton({ f, active, onClick }: { f: Format; active: boolean; onClick: () => void }) {
  const k = 26 / Math.max(f.width, f.height);
  return (
    <button type="button" onClick={onClick} title={`${f.label} · ${f.width}×${f.height}`} data-testid={`format-${f.id}`} className={`flex flex-col items-center gap-1 rounded-md p-1.5 ${active ? "bg-accent/20 ring-1 ring-accent" : "hover:bg-ink/5"}`}>
      <span className="grid h-7 w-7 place-items-center"><span className="rounded-[2px] border border-ink/70" style={{ width: Math.max(8, f.width * k), height: Math.max(8, f.height * k) }} /></span>
      <span className={`text-2xs ${active ? "text-accent" : "text-mute"}`}>{f.ratio}</span>
    </button>
  );
}

const LAYOUT_PRESETS: { name: string; grid: Partial<LayoutGrid> }[] = [
  { name: "Swiss editorial", grid: { kind: "columns", columns: 12, gutter: 20, margin: 60 } },
  { name: "Magazine", grid: { kind: "columns", columns: 6, gutter: 24, margin: 48 } },
  { name: "Asymmetric", grid: { kind: "columns", columns: 5, gutter: 16, margin: 56 } },
  { name: "Modular 4×6", grid: { kind: "modular", columns: 4, rows: 6, gutter: 24, margin: 48 } },
  { name: "Baseline 24", grid: { kind: "baseline", baseline: 24, margin: 48 } },
  { name: "Poster 2-col", grid: { kind: "columns", columns: 2, gutter: 32, margin: 64 } },
];

export default function CanvasProps() {
  const st = useStore.getState;
  const project = useStore((s) => s.project);
  const slide = useActiveSlide();
  const [content, setContent] = useState<"stretch" | "fit" | "none">("stretch");
  const [cw, setCw] = useState(slide.width);
  const [ch, setCh] = useState(slide.height);
  const [bgPicker, setBgPicker] = useState(false);
  const carousel = project.kind === "carousel" || project.slides.length > 1;
  const bg = slide.background;
  const g = slide.grid;
  const setBg = (b: Background, key = "bg") => st().commit((p) => { for (const s of p.slides) if (s.id === p.activeSlideId || (carousel && applyAll)) s.background = structuredClone(b) as never; }, { key });
  const [applyAll, setApplyAll] = useState(false);
  const setGrid = (patch: Partial<LayoutGrid>, key = "grid") => st().commit((p) => { Object.assign(p.slides.find((s) => s.id === p.activeSlideId)!.grid, patch); }, { key });
  const videos = flatten(slide.elements).filter((e) => (e.type === "video") && e.fill);
  const clip = videos.reduce((m, e) => { const f = (e as import("@/lib/types").MediaEl).fill!; const a = getAsset(f.assetId); return Math.max(m, a ? effectiveTrim(f, a.duration ?? 0).length : 0); }, 0);

  return (
    <>
      <Section title="Background">
        <Segmented
          value={bg.type}
          options={[{ value: "solid", label: "Solid" }, { value: "gradient", label: "Gradient" }, { value: "pattern", label: "Pattern" }, { value: "image", label: "Photo" }]}
          onChange={(t) => {
            if (t === "solid") setBg({ type: "solid", color: bg.type === "solid" ? bg.color : "#ffffff" });
            if (t === "gradient") setBg({ type: "gradient", angle: 160, stops: [{ offset: 0, color: "#f5efe6" }, { offset: 1, color: "#ce6161" }] });
            if (t === "pattern") setBg({ type: "pattern", pattern: "dots", color: "#000000", bg: "#f5efe6", size: 28, opacity: 0.25 });
            if (t === "image") setBgPicker(true);
          }}
        />
        {bg.type === "solid" && (
          <>
            <Field label="Colour"><ColorField value={bg.color} onChange={(c) => setBg({ type: "solid", color: c })} testId="bg-color" /></Field>
            <div className="flex flex-wrap gap-1">
              {PALETTES[0].colors.concat(PALETTES[1].colors.slice(0, 3)).map((c) => <button key={c} type="button" title={c} onClick={() => setBg({ type: "solid", color: c })} className="h-5 w-5 rounded border border-ink/20" style={{ background: c }} />)}
            </div>
          </>
        )}
        {bg.type === "gradient" && <PaintField label="Gradient" paint={{ type: "gradient", angle: bg.angle, stops: bg.stops }} alpha={false} onChange={(p) => p?.type === "gradient" && setBg({ type: "gradient", angle: p.angle, stops: p.stops })} />}
        {bg.type === "pattern" && (
          <>
            <Field label="Pattern"><Select width={110} value={bg.pattern} options={[{ value: "dots", label: "Dots" }, { value: "grid", label: "Grid" }, { value: "lines", label: "Lines" }, { value: "checker", label: "Checker" }, { value: "noise", label: "Noise" }, { value: "paper", label: "Paper grain" }]} onChange={(v) => setBg({ ...bg, pattern: v })} /></Field>
            <Field label="Ink"><ColorField value={bg.color} onChange={(c) => setBg({ ...bg, color: c })} /></Field>
            <Field label="Paper"><ColorField value={bg.bg} onChange={(c) => setBg({ ...bg, bg: c })} /></Field>
            <Slider label="Size" value={bg.size} min={6} max={120} onChange={(v) => setBg({ ...bg, size: v }, "bgsize")} />
            <Slider label="Strength" value={Math.round(bg.opacity * 100)} min={2} max={100} unit="%" onChange={(v) => setBg({ ...bg, opacity: v / 100 }, "bgop")} />
          </>
        )}
        {bg.type === "image" && (
          <>
            <Field label="Zoom"><Slider label="" value={Math.round(bg.fill.zoom * 100)} min={100} max={400} unit="%" onChange={(v) => setBg({ ...bg, fill: { ...bg.fill, zoom: v / 100 } }, "bgzoom")} /></Field>
            <Field label="Behind"><ColorField value={bg.color} onChange={(c) => setBg({ ...bg, color: c })} /></Field>
          </>
        )}
        <div className="relative">
          {bg.type === "image" && <Button onClick={() => setBgPicker(true)}>Choose photo</Button>}
          {bgPicker && <AssetPicker onClose={() => setBgPicker(false)} onPick={(a) => { if (a.kind === "image") setBg({ type: "image", fill: newFill(a.id, "image"), color: "#111111" }); setBgPicker(false); }} />}
        </div>
        {carousel && <Toggle label="Apply to every slide" value={applyAll} onChange={setApplyAll} />}
      </Section>

      <Section title="Layout grid" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1">
          {LAYOUT_PRESETS.map((p) => <button key={p.name} type="button" onClick={() => setGrid({ ...p.grid, visible: true })} className="h-6 truncate rounded bg-panel2 px-1.5 text-2xs text-mute ring-1 ring-line hover:text-ink" data-testid={`layout-${p.name.replace(/\W+/g, "-").toLowerCase()}`}>{p.name}</button>)}
        </div>
        <Toggle label="Show grid" value={g.visible} onChange={(v) => setGrid({ visible: v })} />
        <Field label="Type"><Select width={110} value={g.kind} options={[{ value: "none", label: "None" }, { value: "columns", label: "Columns" }, { value: "modular", label: "Modular" }, { value: "baseline", label: "Baseline" }]} onChange={(v) => setGrid({ kind: v, visible: v !== "none" })} /></Field>
        {(g.kind === "columns" || g.kind === "modular") && <Slider label="Columns" value={g.columns} min={1} max={12} onChange={(v) => setGrid({ columns: v }, "gcols")} testId="grid-columns" />}
        {g.kind === "modular" && <Slider label="Rows" value={g.rows} min={1} max={16} onChange={(v) => setGrid({ rows: v }, "grows")} />}
        {g.kind !== "baseline" && <Slider label="Gutter" value={g.gutter} min={0} max={120} unit="px" onChange={(v) => setGrid({ gutter: v }, "ggut")} />}
        <Slider label="Margin" value={g.margin} min={0} max={240} unit="px" onChange={(v) => setGrid({ margin: v }, "gmar")} />
        {g.kind === "baseline" && <Slider label="Baseline" value={g.baseline} min={4} max={96} unit="px" onChange={(v) => setGrid({ baseline: v }, "gbase")} />}
        <Field label="Colour"><ColorField value={g.color} onChange={(c) => setGrid({ color: c }, "gcol")} /></Field>
        <Toggle label="Snap elements to grid" value={g.snap} onChange={(v) => setGrid({ snap: v })} />
        <p className="text-2xs leading-4 text-faint">The grid is a guide. It is never part of exported images.</p>
      </Section>

      <Section title="Guides" defaultOpen={false}>
        <div className="text-xs text-mute">{slide.guides.x.length + slide.guides.y.length} guides · drag from the rulers to add (⇧R shows rulers)</div>
        <Button variant="ghost" disabled={!slide.guides.x.length && !slide.guides.y.length} onClick={() => st().commit((p) => { const s = p.slides.find((x) => x.id === p.activeSlideId)!; s.guides = { x: [], y: [] }; })}>Clear guides</Button>
      </Section>

      {videos.length > 0 && (
        <Section title="Video slide">
          <Field label="Duration">
            <NumberField width={72} value={slide.duration ?? +clip.toFixed(1)} min={0.5} max={600} unit="s" step={0.5} onChange={(v) => st().commit((p) => { p.slides.find((s) => s.id === p.activeSlideId)!.duration = v; })} />
            {slide.duration !== null && <button type="button" className="text-2xs text-mute hover:text-ink" onClick={() => st().commit((p) => { p.slides.find((s) => s.id === p.activeSlideId)!.duration = null; })}>Auto</button>}
          </Field>
          <p className="text-2xs leading-4 text-faint">Auto = the longest trimmed clip ({formatTime(clip)}). Shorter clips loop or hold their last frame.</p>
        </Section>
      )}
      {void getSlide}
    </>
  );
}
