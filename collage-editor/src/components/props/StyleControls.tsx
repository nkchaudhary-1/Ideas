"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Paint, Shadow, Stroke } from "@/lib/types";
import { ColorField } from "@/components/ui/ColorPicker";
import { Chip, Field, Segmented, Slider, TextInput, Toggle } from "@/components/ui/controls";
import Popover from "@/components/ui/Popover";
import { FONTS, FONT_CATEGORIES, fontStack, loadFont } from "@/lib/fonts";

export function PaintField({ label = "Fill", paint, onChange, alpha = true }: { label?: string; paint: Paint | null; onChange: (p: Paint | null) => void; alpha?: boolean }) {
  const p = paint ?? { type: "solid" as const, color: "#ffffff" };
  return (
    <div className="space-y-4">
      <Field label={label}>
        <Segmented
          size="sm"
          value={paint ? p.type : "none"}
          options={[{ value: "none", label: "None" }, { value: "solid", label: "Solid" }, { value: "gradient", label: "Gradient" }] as { value: string; label: string }[]}
          onChange={(v) => {
            if (v === "none") onChange(null);
            else if (v === "solid") onChange({ type: "solid", color: p.type === "solid" ? p.color : p.stops[0].color });
            else onChange(p.type === "gradient" ? p : { type: "gradient", angle: 90, stops: [{ offset: 0, color: p.color }, { offset: 1, color: "#000000" }] });
          }}
        />
      </Field>
      {paint?.type === "solid" && <Field label="Colour"><ColorField value={paint.color} alpha={alpha} onChange={(c) => onChange({ type: "solid", color: c })} /></Field>}
      {paint?.type === "gradient" && (
        <>
          <Field label="Colours">
            <ColorField value={paint.stops[0].color} alpha={alpha} onChange={(c) => onChange({ ...paint, stops: [{ ...paint.stops[0], color: c }, ...paint.stops.slice(1)] })} />
            <ColorField value={paint.stops[paint.stops.length - 1].color} alpha={alpha} onChange={(c) => onChange({ ...paint, stops: [...paint.stops.slice(0, -1), { ...paint.stops[paint.stops.length - 1], color: c }] })} />
          </Field>
          <Slider label="Angle" value={paint.angle} min={0} max={360} unit="°" onChange={(v) => onChange({ ...paint, angle: v })} />
        </>
      )}
    </div>
  );
}

export function StrokeField({ label = "Border", stroke, onChange, max = 80 }: { label?: string; stroke: Stroke | null; onChange: (s: Stroke | null) => void; max?: number }) {
  return (
    <div className="space-y-4">
      <Toggle label={label} value={!!stroke} onChange={(v) => onChange(v ? { color: "#ffffff", width: 4 } : null)} />
      {stroke && (
        <>
          <Field label="Colour"><ColorField value={stroke.color} onChange={(c) => onChange({ ...stroke, color: c })} /></Field>
          <Slider label="Width" value={stroke.width} min={0} max={max} unit="px" onChange={(w) => onChange({ ...stroke, width: w })} />
        </>
      )}
    </div>
  );
}

const DEFAULT_SHADOW: Shadow = { color: "#000000", blur: 24, x: 0, y: 8, opacity: 0.35 };
export function ShadowField({ shadow, onChange }: { shadow: Shadow | null; onChange: (s: Shadow | null) => void }) {
  return (
    <div className="space-y-4">
      <Toggle label="Shadow" value={!!shadow} onChange={(v) => onChange(v ? { ...DEFAULT_SHADOW } : null)} />
      {shadow && (
        <>
          <Field label="Colour"><ColorField value={shadow.color} onChange={(c) => onChange({ ...shadow, color: c })} /></Field>
          <Slider label="Blur" value={shadow.blur} min={0} max={120} onChange={(v) => onChange({ ...shadow, blur: v })} />
          <Slider label="Offset X" value={shadow.x} min={-80} max={80} onChange={(v) => onChange({ ...shadow, x: v })} />
          <Slider label="Offset Y" value={shadow.y} min={-80} max={80} onChange={(v) => onChange({ ...shadow, y: v })} />
          <Slider label="Opacity" value={Math.round(shadow.opacity * 100)} min={0} max={100} unit="%" onChange={(v) => onChange({ ...shadow, opacity: v / 100 })} />
        </>
      )}
    </div>
  );
}

export function FontPicker({ family, onChange }: { family: string; onChange: (f: string) => void }) {
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const list = useMemo(() => FONTS.filter((f) => (cat === "All" || f.category === cat) && f.family.toLowerCase().includes(q.toLowerCase())), [cat, q]);
  useEffect(() => { list.slice(0, 40).forEach((f) => void loadFont(f.family, 400, false)); }, [list]);
  return (
    <Popover align="left" width={320} trigger={(open, toggle) => (
      <button type="button" data-testid="font-picker" aria-label="Font" aria-expanded={open} onClick={toggle} className={`flex h-9 w-full items-center justify-between gap-2 rounded-full bg-field px-4 text-sm transition-colors hover:bg-raised ${open ? "ring-2 ring-ink/20" : ""}`} style={{ fontFamily: fontStack(family) }}>
        <span className="truncate">{family}</span><ChevronDown size={14} className="shrink-0 text-mute" />
      </button>
    )}>
      {(close) => (
        <div className="flex h-[360px] flex-col gap-4" data-testid="font-list">
          <TextInput value={q} onChange={setQ} placeholder="Search fonts" className="w-full" />
          <div className="flex flex-wrap gap-2">
            {["All", ...FONT_CATEGORIES].map((c) => <Chip sm key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.map((f) => (
              <button key={f.id} type="button" data-testid={`font-${f.id}`} onMouseEnter={() => void loadFont(f.family, 400, false)} onClick={() => { onChange(f.family); close(); }}
                className={`flex h-10 w-full items-center justify-between gap-3 rounded px-3 text-left hover:bg-ink/5 ${f.family === family ? "bg-ink/10" : ""}`}>
                <span className="truncate text-[15px]" title={f.family} style={{ fontFamily: fontStack(f.family) }}>{f.family}</span>
                <span className="shrink-0 text-2xs text-faint">{f.category}</span>
              </button>
            ))}
            {list.length === 0 && <div className="p-4 text-center text-xs text-mute">No fonts match.</div>}
          </div>
        </div>
      )}
    </Popover>
  );
}
