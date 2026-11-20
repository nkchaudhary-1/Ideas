"use client";
import { useState } from "react";
import { useStore, getSlide } from "@/lib/store";
import type { Background } from "@/lib/types";
import { GRADIENT_PRESETS, SOLID_BACKGROUNDS } from "@/lib/presets";
import { Section, Toggle, Button } from "@/components/ui/controls";
import { newFill } from "@/lib/media-math";
import AssetPicker from "@/components/props/AssetPicker";

const PATTERNS: { id: Extract<Background, { type: "pattern" }>["pattern"]; name: string; bg: string; ink: string; size: number; opacity: number }[] = [
  { id: "dots", name: "Dots", bg: "#f5efe6", ink: "#1c1c1c", size: 28, opacity: 0.25 },
  { id: "grid", name: "Grid", bg: "#ffffff", ink: "#2f80b7", size: 48, opacity: 0.25 },
  { id: "lines", name: "Lines", bg: "#fff7bd", ink: "#1c1c1c", size: 34, opacity: 0.18 },
  { id: "checker", name: "Checker", bg: "#ffffff", ink: "#000000", size: 54, opacity: 0.08 },
  { id: "noise", name: "Noise", bg: "#1c1c1c", ink: "#ffffff", size: 1, opacity: 0.25 },
  { id: "paper", name: "Paper grain", bg: "#f3ecdd", ink: "#5b4636", size: 1, opacity: 0.22 },
];

export default function BackgroundsPanel() {
  const st = useStore.getState;
  const project = useStore((s) => s.project);
  const slide = getSlide(project);
  const [all, setAll] = useState(false);
  const [picker, setPicker] = useState(false);
  const carousel = project.slides.length > 1;
  const apply = (b: Background) => st().setBackground(b, all);
  return (
    <div className="h-full overflow-y-auto" data-testid="backgrounds-panel">
      {carousel && <div className="px-7 pb-4"><Toggle label="Apply to every slide" value={all} onChange={setAll} /></div>}
      <Section title="Solid colours">
        <div className="flex flex-wrap gap-2.5">
          {SOLID_BACKGROUNDS.map((c) => <button key={c} type="button" title={c} onClick={() => apply({ type: "solid", color: c })} className={`h-8 w-8 rounded-lg border ${slide.background.type === "solid" && slide.background.color === c ? "border-ink ring-1 ring-ink/60" : "border-ink/15"}`} style={{ background: c }} />)}
        </div>
      </Section>
      <Section title="Gradients">
        <div className="grid grid-cols-4 gap-3">
          {GRADIENT_PRESETS.map((g) => (
            <button key={g.name} type="button" title={g.name} data-testid={`grad-${g.name.toLowerCase().replace(/\s/g, "-")}`} onClick={() => apply({ type: "gradient", angle: g.angle, stops: [{ offset: 0, color: g.stops[0] }, { offset: 1, color: g.stops[1] }] })} className="h-12 rounded-md border border-ink/10" style={{ background: `linear-gradient(${g.angle}deg, ${g.stops[0]}, ${g.stops[1]})` }} />
          ))}
        </div>
      </Section>
      <Section title="Patterns & textures">
        <div className="grid grid-cols-3 gap-3">
          {PATTERNS.map((p) => (
            <button key={p.id} type="button" data-testid={`pattern-${p.id}`} onClick={() => apply({ type: "pattern", pattern: p.id, color: p.ink, bg: p.bg, size: p.size, opacity: p.opacity })} className="h-14 rounded-md border border-ink/10 text-2xs" style={{ background: p.bg, color: p.ink }}>{p.name}</button>
          ))}
        </div>
      </Section>
      <Section title="Photo background">
        <div className="relative">
          <Button onClick={() => setPicker(!picker)}>Choose a photo</Button>
          {picker && <AssetPicker onClose={() => setPicker(false)} onPick={(a) => { if (a.kind === "image") apply({ type: "image", fill: newFill(a.id, "image"), color: "#111111" }); setPicker(false); }} />}
        </div>
      </Section>
    </div>
  );
}
