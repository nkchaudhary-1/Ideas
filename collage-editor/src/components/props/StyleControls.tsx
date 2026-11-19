"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import type { Paint, Shadow, Stroke } from "@/lib/types";
import { ColorField } from "@/components/ui/ColorPicker";
import { Field, NumberField, Segmented, Slider, Toggle } from "@/components/ui/controls";
import { FONTS, FONT_CATEGORIES, fontStack, loadFont } from "@/lib/fonts";

export function PaintField({ label = "Fill", paint, onChange, alpha = true }: { label?: string; paint: Paint | null; onChange: (p: Paint | null) => void; alpha?: boolean }) {
  const p = paint ?? { type: "solid" as const, color: "#ffffff" };
  return (
    <div className="space-y-1.5">
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
      {paint?.type === "solid" && <Field label=""><span className="w-[72px]" /><ColorField value={paint.color} alpha={alpha} onChange={(c) => onChange({ type: "solid", color: c })} /></Field>}
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
    <div className="space-y-1.5">
      <Field label={label}>
        <Toggle label={stroke ? "On" : "Off"} value={!!stroke} onChange={(v) => onChange(v ? { color: "#ffffff", width: 4 } : null)} />
      </Field>
      {stroke && (
        <Field label="">
          <span className="w-[72px]" />
          <ColorField value={stroke.color} onChange={(c) => onChange({ ...stroke, color: c })} />
          <NumberField value={stroke.width} min={0} max={max} width={56} unit="px" onChange={(w) => onChange({ ...stroke, width: w })} />
        </Field>
      )}
    </div>
  );
}

const DEFAULT_SHADOW: Shadow = { color: "#000000", blur: 24, x: 0, y: 8, opacity: 0.35 };
export function ShadowField({ shadow, onChange }: { shadow: Shadow | null; onChange: (s: Shadow | null) => void }) {
  return (
    <div className="space-y-1.5">
      <Field label="Shadow"><Toggle label={shadow ? "On" : "Off"} value={!!shadow} onChange={(v) => onChange(v ? { ...DEFAULT_SHADOW } : null)} /></Field>
      {shadow && (
        <>
          <Field label=""><span className="w-[72px]" /><ColorField value={shadow.color} onChange={(c) => onChange({ ...shadow, color: c })} /></Field>
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
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const list = useMemo(() => FONTS.filter((f) => (cat === "All" || f.category === cat) && f.family.toLowerCase().includes(q.toLowerCase())), [cat, q]);

  useEffect(() => { if (open) list.slice(0, 40).forEach((f) => void loadFont(f.family, 400, false)); }, [open, list]);
  useEffect(() => {
    if (!open) return;
    const f = (e: MouseEvent) => { if (!pop.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("mousedown", f);
    return () => window.removeEventListener("mousedown", f);
  }, [open]);

  return (
    <>
      <button ref={btn} type="button" data-testid="font-picker" onClick={() => { setRect(btn.current!.getBoundingClientRect()); setOpen(!open); }} className="flex h-7 w-full items-center justify-between rounded-md bg-panel2 px-2 text-sm ring-1 ring-line hover:ring-accent/50" style={{ fontFamily: fontStack(family) }}>
        <span className="truncate">{family}</span><ChevronDown size={12} className="text-mute" />
      </button>
      {open && rect && createPortal(
        <div ref={pop} className="fixed z-[200] flex h-[380px] w-[280px] flex-col rounded-lg border border-line bg-panel shadow-2xl" style={{ left: Math.max(8, rect.left - 140), top: Math.min(rect.bottom + 4, window.innerHeight - 390) }}>
          <input autoFocus placeholder="Search fonts" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} className="m-2 h-7 rounded-md bg-panel2 px-2 text-xs outline-none ring-1 ring-line focus:ring-accent/70" />
          <div className="flex flex-wrap gap-1 px-2 pb-2">
            {["All", ...FONT_CATEGORIES].map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} className={`rounded px-1.5 py-0.5 text-2xs ${cat === c ? "bg-accent/20 text-accent" : "bg-panel2 text-mute hover:text-ink"}`}>{c}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
            {list.map((f) => (
              <button key={f.id} type="button" data-testid={`font-${f.id}`} onMouseEnter={() => void loadFont(f.family, 400, false)} onClick={() => { onChange(f.family); setOpen(false); }} className={`flex w-full items-baseline justify-between rounded px-2 py-1.5 text-left hover:bg-white/5 ${f.family === family ? "bg-accent/15" : ""}`}>
                <span className="truncate text-[15px]" style={{ fontFamily: fontStack(f.family) }}>{f.family}</span>
                <span className="ml-2 shrink-0 text-2xs text-faint">{f.category}</span>
              </button>
            ))}
            {list.length === 0 && <div className="p-4 text-center text-xs text-mute">No fonts match.</div>}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
