import { useRef, useState } from "react";
import { cx } from "./controls";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Where a double-click or Delete puts it back. */
  reset: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

/**
 * A capsule slider (44px tall, as the design rules ask): a light track, an accent fill that stops at the knob's centre,
 * and a round knob that finishes the fill. The value sits beside the label and can be typed. Double-click or Delete resets.
 */
export function Slider({ label, value, min, max, step = 1, reset, unit, onChange, format }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const pct = (value - min) / (max - min);
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const decimals = (String(step).split(".")[1] ?? "").length;
  const fmt = (v: number) => (format ? format(v) : v.toFixed(decimals));

  const fromPointer = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const knob = 44;
    const p = (clientX - r.left - knob / 2) / (r.width - knob);
    onChange(snap(min + Math.min(1, Math.max(0, p)) * (max - min)));
  };
  const commit = () => {
    if (draft === null) return;
    const n = parseFloat(draft);
    if (!Number.isNaN(n)) onChange(snap(n));
    setDraft(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-2">
        <label className="text-sm text-mute" htmlFor={`sl-${label}`}>
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            id={`sl-${label}`}
            inputMode="decimal"
            aria-label={`${label} value`}
            value={draft ?? fmt(value)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setDraft(null);
            }}
            className="h-9 coarse:h-11 w-16 rounded-full bg-panel2 border border-line px-3 text-right text-sm tnum text-ink focus:border-accentfg focus:outline-none"
          />
          {unit && <span className="text-sm text-mute w-8">{unit}</span>}
        </div>
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${fmt(value)}${unit ? " " + unit : ""}`}
        className="relative h-11 rounded-full bg-panel2 touch-none cursor-pointer select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && fromPointer(e.clientX)}
        onDoubleClick={() => onChange(reset)}
        onKeyDown={(e) => {
          const big = step * 10;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(snap(value + step)), e.preventDefault();
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(snap(value - step)), e.preventDefault();
          else if (e.key === "PageUp") onChange(snap(value + big)), e.preventDefault();
          else if (e.key === "PageDown") onChange(snap(value - big)), e.preventDefault();
          else if (e.key === "Home") onChange(min), e.preventDefault();
          else if (e.key === "End") onChange(max), e.preventDefault();
          else if (e.key === "Delete" || e.key === "Backspace") onChange(reset), e.preventDefault();
        }}
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `calc(22px + (100% - 44px) * ${pct})` }} />
        <div
          className={cx("absolute top-0 h-11 w-11 rounded-full bg-ink flex items-center justify-center shadow-pop")}
          style={{ left: `calc((100% - 44px) * ${pct})` }}
        >
          <span className="h-4 w-0.5 rounded-full bg-bg" />
        </div>
      </div>
    </div>
  );
}
