"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { clamp, keys } from "@/lib/util";

export function IconButton({ icon, label, onClick, active, disabled, className = "", size = 36, shortcut, testId }: {
  icon: ReactNode; label: string; onClick?: (e: React.MouseEvent) => void; active?: boolean; disabled?: boolean; className?: string; size?: number; shortcut?: string; testId?: string;
}) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${keys(shortcut)})` : label}
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-full transition-colors ${active ? "bg-ink/10 text-ink" : "text-mute hover:bg-ink/[0.07] hover:text-ink"} disabled:opacity-30 disabled:hover:bg-transparent ${className}`}
    >
      {icon}
    </button>
  );
}

export function Button({ children, onClick, variant = "default", disabled, className = "", title, testId, type = "button" }: {
  children: ReactNode; onClick?: () => void; variant?: "default" | "primary" | "ghost" | "danger"; disabled?: boolean; className?: string; title?: string; testId?: string; type?: "button" | "submit";
}) {
  const v = {
    default: "bg-field text-ink hover:bg-raised",
    primary: "grad-pill text-pillink hover:opacity-90 font-semibold",
    ghost: "text-ink/80 hover:bg-ink/[0.07]",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  }[variant];
  return (
    <button type={type} title={title} data-testid={testId} disabled={disabled} onClick={onClick} className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-40 ${v} ${className}`}>
      {children}
    </button>
  );
}

/** a selectable pill: 36px tall, dark when on. `soft` marks an option that is merely switched on (a quiet tint, not the loud primary) */
export function Chip({ active, soft, sm, children, className = "", ...rest }: { active?: boolean; soft?: boolean; sm?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const on = soft ? "bg-ink/10 text-ink ring-1 ring-ink/25" : "bg-pill text-pillink";
  const off = soft ? "bg-field text-faint hover:text-mute" : "bg-field text-mute hover:text-ink";
  return (
    <button type="button" aria-pressed={active} className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors ${sm ? "h-8 px-3 text-2xs" : "h-9 px-4 text-xs"} ${active ? on : off} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** a quiet inline action ("Reset", "All", "None"): 32px tall so it is easy to hit, but visually just text */
export function TextButton({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-2xs font-semibold text-mute transition-colors hover:bg-ink/[0.07] hover:text-ink disabled:opacity-40 ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Section({ title, children, defaultOpen = true, action }: { title: string; children: ReactNode; defaultOpen?: boolean; action?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mx-3 mb-3 rounded-in-12 bg-panel2 px-5 py-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-8 flex-1 items-center justify-between text-left text-sm font-bold text-ink">
          {title}
          <ChevronRight size={14} className={`text-mute transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
        {action}
      </div>
      {open && <div className="mt-5 space-y-4">{children}</div>}
    </section>
  );
}

export function Field({ label, children, className = "" }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && <span className="w-20 shrink-0 text-xs text-mute">{label}</span>}
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

export function NumberField({ value, onChange, step = 1, min, max, unit, label, width = 56, precision = 1, aria }: {
  value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; unit?: string; label?: string; width?: number; precision?: number; aria?: string;
}) {
  const [text, setText] = useState(String(round(value, precision)));
  const focus = useRef(false);
  useEffect(() => { if (!focus.current) setText(String(round(value, precision))); }, [value, precision]);
  const commit = (t: string) => {
    const n = parseFloat(t);
    if (!isNaN(n)) onChange(clamp(n, min ?? -Infinity, max ?? Infinity));
  };
  return (
    <label className="flex shrink-0 items-center gap-1 rounded-full bg-field px-3 text-xs font-medium focus-within:ring-2 focus-within:ring-accent/40" style={{ width }}>
      {label && <span className="shrink-0 text-faint">{label}</span>}
      <input
        value={text}
        inputMode="decimal"
        aria-label={aria ?? label}
        onFocus={(e) => { focus.current = true; e.target.select(); }}
        onBlur={() => { focus.current = false; commit(text); setText(String(round(value, precision))); }}
        onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const d = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? step * 10 : step);
            const n = clamp(value + d, min ?? -Infinity, max ?? Infinity);
            onChange(n);
          }
        }}
        className="h-9 w-full min-w-0 bg-transparent text-ink outline-none"
      />
      {unit && <span className="shrink-0 text-faint">{unit}</span>}
    </label>
  );
}
const round = (v: number, d: number) => { const p = 10 ** d; return Math.round(v * p) / p; };

export type SliderTrack = "temp" | "tint" | "hue" | "sat";
// muted on purpose: these hint at direction, they are not decoration
const TRACKS: Record<SliderTrack, string> = {
  temp: "linear-gradient(90deg, #7d9bc2 0%, #bcc0c7 50%, #e9a867 100%)",
  tint: "linear-gradient(90deg, #7fae93 0%, #c0c2c0 50%, #c58aae 100%)",
  hue: "linear-gradient(90deg, #d7776e, #d7b06e, #c8d76e, #78c88a, #6ec8d7, #6e88d7, #b06ed7, #d76ea6, #d7776e)",
  sat: "linear-gradient(90deg, #9d9d9d, #f08a45)",
};

/**
 * A label and value above, a soft pill below holding a big white knob on a thin track.
 * Sliders that edit a colour (`track`) get a thick gradient pill and a ring knob instead.
 */
export function Slider({ label, value, min, max, step = 1, onChange, onReset, neutral = 0, unit, testId, track }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; onReset?: () => void; neutral?: number; unit?: string; testId?: string; track?: SliderTrack;
}) {
  const span = max - min || 1;
  const pct = clamp(((value - min) / span) * 100, 0, 100);
  const nPct = clamp(((neutral - min) / span) * 100, 0, 100);
  // a neutral point inside the range (brightness, tint…) fills outward from it; otherwise fill from the start
  const bipolar = nPct > 1 && nPct < 99;
  const from = bipolar ? Math.min(pct, nPct) : 0;
  const to = bipolar ? Math.max(pct, nPct) : pct;
  const changed = Math.abs(value - neutral) > 0.001;
  const pill = (
    <div className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-field px-4">
      <input
        type="range"
        className={track ? "rs-color" : undefined}
        min={min} max={max} step={step} value={value}
        style={{ ["--a" as string]: `${from}%`, ["--b" as string]: `${to}%`, ["--track" as string]: track ? TRACKS[track] : undefined }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onDoubleClick={onReset}
        aria-label={label}
      />
    </div>
  );
  const num = <NumberField value={value} onChange={onChange} min={min} max={max} step={step} width={unit ? 72 : 56} unit={unit} aria={label || undefined} />;
  if (!label) return <div className="flex items-center gap-3" data-testid={testId}>{pill}{num}</div>;
  return (
    <div data-testid={testId}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span onDoubleClick={onReset} title={onReset ? `${label} (double-click to reset)` : label} className="min-w-0 truncate text-left text-xs font-semibold text-ink/80">{label}</span>
        <div className="flex items-center gap-2">
          {onReset && (
            <button type="button" onClick={onReset} title="Reset" aria-label={`Reset ${label}`} className={`grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-field hover:text-ink ${changed ? "" : "invisible"}`}>
              <RotateCcw size={11} />
            </button>
          )}
          {num}
        </div>
      </div>
      {pill}
    </div>
  );
}

/**
 * A ruler for angles: the ticks slide under a fixed marker as you drag. Double-click to reset, arrows to nudge.
 */
export function TickSlider({ label, value, onChange, min = -180, max = 180, unit = "°", testId }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string; testId?: string;
}) {
  const PX = 10; // pixels per 5 units
  const drag = useRef<{ x: number; v: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(260);
  useEffect(() => { const r = box.current?.getBoundingClientRect(); if (r) setW(r.width); }, []);
  const set = (v: number) => onChange(clamp(Math.round(v), min, max));
  const center = w / 2;
  const first = Math.floor((value - center / PX * 5) / 5) - 1;
  const last = Math.ceil((value + center / PX * 5) / 5) + 1;
  const ticks: number[] = [];
  for (let k = first; k <= last; k++) ticks.push(k * 5);
  return (
    <div data-testid={testId}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink/80">{label}</span>
        <NumberField value={value} onChange={(v) => set(v)} min={min} max={max} step={1} width={68} unit={unit} />
      </div>
      <div
        ref={box}
        data-allow-clip
        role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(value)}
        className="relative h-14 cursor-ew-resize touch-none select-none overflow-hidden rounded-full bg-field outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, v: value }; }}
        onPointerMove={(e) => { if (drag.current) set(drag.current.v - ((e.clientX - drag.current.x) / PX) * 5); }}
        onPointerUp={() => { drag.current = null; }}
        onDoubleClick={() => set(0)}
        onKeyDown={(e) => { e.stopPropagation(); const d = e.shiftKey ? 10 : 1; if (e.key === "ArrowLeft") { e.preventDefault(); set(value - d); } if (e.key === "ArrowRight") { e.preventDefault(); set(value + d); } }}
      >
        <span className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
        {ticks.map((t) => {
          const x = center + ((t - value) / 5) * PX;
          const major = t % 45 === 0, mid = t % 15 === 0;
          return <span key={t} className={`absolute bottom-4 w-px -translate-x-1/2 rounded-full ${major ? "h-5 bg-ink" : mid ? "h-4 bg-ink/60" : "h-3 bg-ink/25"}`} style={{ left: x }} />;
        })}
        <span className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-field to-transparent" />
        <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-field to-transparent" />
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, size = "md", block }: {
  value: T; options: { value: T; label?: ReactNode; title?: string }[]; onChange: (v: T) => void; size?: "sm" | "md"; /** stretch to the full width, options sharing it equally */ block?: boolean;
}) {
  return (
    <div className={`${block ? "flex w-full" : "inline-flex"} gap-1 rounded-full bg-field p-1`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`grid place-items-center whitespace-nowrap rounded-full font-medium transition-colors ${block ? "flex-1 px-2" : "px-4"} ${size === "sm" ? "h-6" : "h-7"} text-xs ${o.value === value ? "bg-seg text-ink shadow-sm" : "text-mute hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-xs text-ink">
      <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} className={`h-6 w-10 shrink-0 rounded-full p-0.5 transition-colors ${value ? "grad-accent" : "bg-faint/40"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : ""}`} />
      </button>
      {label}
    </label>
  );
}

export function Select<T extends string>({ value, options, onChange, width, className = "" }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; width?: number; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} style={{ width }} className={`h-9 min-w-0 rounded-full bg-field px-4 text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-accent/40 ${className}`}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function TextInput({ value, onChange, placeholder, className = "", onCommit, testId, aria }: { value: string; onChange?: (v: string) => void; placeholder?: string; className?: string; onCommit?: (v: string) => void; testId?: string; aria?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      data-testid={testId}
      aria-label={aria ?? placeholder}
      placeholder={placeholder}
      onChange={(e) => { setV(e.target.value); onChange?.(e.target.value); }}
      onBlur={() => onCommit?.(v)}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={`h-9 min-w-0 rounded-full bg-field px-4 text-xs font-medium text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/40 ${className}`}
    />
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-8 py-10 text-center text-xs leading-6 text-mute">{children}</div>;
}
