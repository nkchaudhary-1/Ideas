"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { clamp } from "@/lib/util";

export function IconButton({ icon, label, onClick, active, disabled, className = "", size = 28, shortcut, testId }: {
  icon: ReactNode; label: string; onClick?: (e: React.MouseEvent) => void; active?: boolean; disabled?: boolean; className?: string; size?: number; shortcut?: string; testId?: string;
}) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-md transition-colors ${active ? "bg-accent/20 text-accent" : "text-ink/80 hover:bg-white/10 hover:text-ink"} disabled:opacity-30 disabled:hover:bg-transparent ${className}`}
    >
      {icon}
    </button>
  );
}

export function Button({ children, onClick, variant = "default", disabled, className = "", title, testId, type = "button" }: {
  children: ReactNode; onClick?: () => void; variant?: "default" | "primary" | "ghost" | "danger"; disabled?: boolean; className?: string; title?: string; testId?: string; type?: "button" | "submit";
}) {
  const v = {
    default: "bg-raised hover:bg-[#383838] text-ink border border-line",
    primary: "bg-accent text-black hover:brightness-110 font-medium",
    ghost: "hover:bg-white/10 text-ink/90",
    danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30",
  }[variant];
  return (
    <button type={type} title={title} data-testid={testId} disabled={disabled} onClick={onClick} className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm transition-colors disabled:opacity-40 ${v} ${className}`}>
      {children}
    </button>
  );
}

export function Section({ title, children, defaultOpen = true, action }: { title: string; children: ReactNode; defaultOpen?: boolean; action?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line/70">
      <div className="flex h-8 items-center justify-between px-3">
        <button type="button" onClick={() => setOpen(!open)} className="flex flex-1 items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-mute hover:text-ink">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {title}
        </button>
        {action}
      </div>
      {open && <div className="space-y-2.5 px-3 pb-3">{children}</div>}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="w-[72px] shrink-0 text-xs text-mute">{label}</span>}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
    </div>
  );
}

export function NumberField({ value, onChange, step = 1, min, max, unit, label, width = 56, precision = 1 }: {
  value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; unit?: string; label?: string; width?: number; precision?: number;
}) {
  const [text, setText] = useState(String(round(value, precision)));
  const focus = useRef(false);
  useEffect(() => { if (!focus.current) setText(String(round(value, precision))); }, [value, precision]);
  const commit = (t: string) => {
    const n = parseFloat(t);
    if (!isNaN(n)) onChange(clamp(n, min ?? -Infinity, max ?? Infinity));
  };
  return (
    <label className="flex items-center gap-1 rounded-md bg-panel2 px-1.5 text-xs ring-1 ring-line focus-within:ring-accent/70" style={{ width }}>
      {label && <span className="text-faint">{label}</span>}
      <input
        value={text}
        inputMode="decimal"
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
        className="h-6 w-full min-w-0 bg-transparent text-ink outline-none"
      />
      {unit && <span className="text-faint">{unit}</span>}
    </label>
  );
}
const round = (v: number, d: number) => { const p = 10 ** d; return Math.round(v * p) / p; };

export function Slider({ label, value, min, max, step = 1, onChange, onReset, neutral = 0, unit, testId }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; onReset?: () => void; neutral?: number; unit?: string; testId?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const changed = Math.abs(value - neutral) > 0.001;
  return (
    <div className="flex items-center gap-2" data-testid={testId}>
      <button type="button" onDoubleClick={onReset} title={onReset ? "Double-click to reset" : undefined} className="w-[72px] shrink-0 truncate text-left text-xs text-mute">
        {label}
      </button>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        style={{ ["--p" as string]: `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onDoubleClick={onReset}
        aria-label={label}
      />
      <NumberField value={value} onChange={onChange} min={min} max={max} step={step} width={50} unit={unit} />
      {onReset && (
        <button type="button" onClick={onReset} title="Reset" aria-label={`Reset ${label}`} className={`grid h-5 w-5 place-items-center rounded text-mute hover:text-ink ${changed ? "" : "invisible"}`}>
          <RotateCcw size={11} />
        </button>
      )}
    </div>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, size = "md" }: {
  value: T; options: { value: T; label?: ReactNode; title?: string }[]; onChange: (v: T) => void; size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-md bg-panel2 p-0.5 ring-1 ring-line">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`grid place-items-center rounded px-2 ${size === "sm" ? "h-5" : "h-6"} text-xs ${o.value === value ? "bg-raised text-ink" : "text-mute hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-ink/90">
      <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} className={`h-4 w-7 rounded-full p-0.5 transition-colors ${value ? "bg-accent" : "bg-[#444]"}`}>
        <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${value ? "translate-x-3" : ""}`} />
      </button>
      {label}
    </label>
  );
}

export function Select<T extends string>({ value, options, onChange, width, className = "" }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; width?: number; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} style={{ width }} className={`h-6 min-w-0 rounded-md bg-panel2 px-1.5 text-xs text-ink outline-none ring-1 ring-line focus:ring-accent/70 ${className}`}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function TextInput({ value, onChange, placeholder, className = "", onCommit, testId }: { value: string; onChange?: (v: string) => void; placeholder?: string; className?: string; onCommit?: (v: string) => void; testId?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      data-testid={testId}
      placeholder={placeholder}
      onChange={(e) => { setV(e.target.value); onChange?.(e.target.value); }}
      onBlur={() => onCommit?.(v)}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={`h-6 min-w-0 rounded-md bg-panel2 px-2 text-xs text-ink outline-none ring-1 ring-line placeholder:text-faint focus:ring-accent/70 ${className}`}
    />
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-xs leading-5 text-mute">{children}</div>;
}
