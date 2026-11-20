"use client";
import { useRef, useState } from "react";
import { Section, Segmented, Slider, TextButton } from "@/components/ui/controls";
import { HSL_BANDS, IDENTITY_CURVE, NEUTRAL_GRADE, buildLut, curveActive, gradeActive } from "@/lib/filters";
import type { Adjustments, CurvePts, Curves, Grade, HslKey, Tri, Wheel } from "@/lib/types";
import { clamp } from "@/lib/util";
import type { FillTarget } from "./fill-target";

const resetBtn = (onClick: () => void, id: string, on: boolean) => (
  <TextButton data-testid={id} onClick={onClick} className={on ? "" : "invisible"}>Reset</TextButton>
);

// ───────────────────────── HSL colour mix ─────────────────────────

export function HslSection({ target }: { target: FillTarget }) {
  const [band, setBand] = useState<HslKey>("red");
  const hsl = target.fill.adjustments.hsl ?? {};
  const v: Tri = hsl[band] ?? [0, 0, 0];
  const touched = (k: HslKey) => (hsl[k] ?? [0, 0, 0]).some((n) => n !== 0);
  const any = HSL_BANDS.some((b) => touched(b.key));
  const set = (i: 0 | 1 | 2, val: number) =>
    target.update((f) => {
      const a = f.adjustments as Adjustments;
      const next = { ...(a.hsl ?? {}) };
      const cur = [...(next[band] ?? [0, 0, 0])] as Tri;
      cur[i] = val;
      next[band] = cur;
      a.hsl = next;
    }, `hsl-${band}-${i}`);
  return (
    <Section title="Colour mix (HSL)" defaultOpen={false} action={resetBtn(() => target.update((f) => { delete (f.adjustments as Adjustments).hsl; }), "reset-hsl", any)}>
      <div className="flex items-center justify-between" data-testid="hsl-bands" role="group" aria-label="Colour band">
        {HSL_BANDS.map((b) => (
          <button key={b.key} type="button" title={b.label} aria-label={b.label} aria-pressed={band === b.key} data-testid={`hsl-band-${b.key}`} onClick={() => setBand(b.key)}
            className={`relative grid h-8 w-8 place-items-center rounded-full transition ${band === b.key ? "ring-2 ring-ink ring-offset-2 ring-offset-panel2" : "hover:scale-110"}`}>
            <span className="block h-5 w-5 rounded-full" style={{ background: b.swatch }} />
            {touched(b.key) && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-ink" />}
          </button>
        ))}
      </div>
      <Slider testId="hsl-hue" label="Hue" value={Math.round(v[0])} min={-100} max={100} onChange={(x) => set(0, x)} onReset={() => set(0, 0)} />
      <Slider testId="hsl-sat" label="Saturation" value={Math.round(v[1])} min={-100} max={100} onChange={(x) => set(1, x)} onReset={() => set(1, 0)} track="sat" />
      <Slider testId="hsl-lum" label="Luminance" value={Math.round(v[2])} min={-100} max={100} onChange={(x) => set(2, x)} onReset={() => set(2, 0)} />
    </Section>
  );
}

// ───────────────────────── RGB curves ─────────────────────────

type Ch = "m" | "r" | "g" | "b";
const CHANNELS: { id: Ch; label: string; line: string }[] = [
  { id: "m", label: "RGB", line: "rgb(var(--c-ink))" },
  { id: "r", label: "R", line: "#e5483f" },
  { id: "g", label: "G", line: "#34a853" },
  { id: "b", label: "B", line: "#3b82f6" },
];
const PAD = 8, BOX = 256 + PAD * 2;

export function CurvesSection({ target }: { target: FillTarget }) {
  const [ch, setCh] = useState<Ch>("m");
  const [drag, setDrag] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const curves = target.fill.adjustments.curves;
  const pts: CurvePts = curves?.[ch] ?? IDENTITY_CURVE;
  const line = CHANNELS.find((c) => c.id === ch)!.line;
  const lut = buildLut(pts);
  const path = Array.from(lut, (y, x) => `${x ? "L" : "M"}${x} ${(255 - y * 255).toFixed(1)}`).join(" ");

  const write = (next: CurvePts) =>
    target.update((f) => {
      const a = f.adjustments as Adjustments;
      const c: Curves = { ...(a.curves ?? {}) };
      const rounded = next.map((p) => [Math.round(p[0]), Math.round(p[1])] as [number, number]);
      if (curveActive(rounded)) c[ch] = rounded; else delete c[ch];
      if (Object.keys(c).length) a.curves = c; else delete a.curves;
    }, `curve-${ch}`);

  const local = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = svg.current!.getBoundingClientRect();
    return [clamp(((e.clientX - r.left) / r.width) * BOX - PAD, 0, 255), clamp(255 - (((e.clientY - r.top) / r.height) * BOX - PAD), 0, 255)];
  };
  const down = (e: React.PointerEvent) => {
    const [x, y] = local(e);
    let near = -1, best = 14;
    pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < best) { best = d; near = i; } });
    if (near < 0) {
      const next = [...pts, [x, y] as [number, number]].sort((a, b) => a[0] - b[0]);
      near = next.findIndex((p) => p[0] === x && p[1] === y);
      write(next);
    }
    svg.current!.setPointerCapture(e.pointerId);
    setDrag(near);
  };
  const move = (e: React.PointerEvent) => {
    if (drag === null) return;
    const [x, y] = local(e);
    const next = pts.map((p) => [...p] as [number, number]);
    const last = next.length - 1;
    // the end points keep their place on the x axis; inner points stay between their neighbours
    next[drag] = [drag === 0 ? next[0][0] : drag === last ? next[last][0] : clamp(x, next[drag - 1][0] + 2, next[drag + 1][0] - 2), y];
    write(next);
  };
  const up = (e: React.PointerEvent) => { if (drag !== null) svg.current?.releasePointerCapture(e.pointerId); setDrag(null); };
  const remove = (i: number) => { if (i > 0 && i < pts.length - 1) write(pts.filter((_, k) => k !== i)); };

  const any = !!curves && (curveActive(curves.m) || curveActive(curves.r) || curveActive(curves.g) || curveActive(curves.b));
  return (
    <Section title="Curves" defaultOpen={false} action={resetBtn(() => target.update((f) => { delete (f.adjustments as Adjustments).curves; }), "reset-curves", any)}>
      <Segmented value={ch} onChange={setCh} size="sm" options={CHANNELS.map((c) => ({ value: c.id, label: c.label, title: c.id === "m" ? "All channels" : `${c.label} channel` }))} />
      <svg ref={svg} viewBox={`${-PAD} ${-PAD} ${BOX} ${BOX}`} className="mx-auto block w-full max-w-[260px] touch-none select-none rounded bg-field" data-testid="curve-editor"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onDoubleClick={(e) => { // the svg holds pointer capture, so the double-click lands here rather than on the point
          const [x, y] = local(e);
          let near = -1, best = 14;
          pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < best) { best = d; near = i; } });
          if (near >= 0) remove(near);
        }}>
        {[64, 128, 192].map((g) => (
          <g key={g} className="stroke-faint" strokeWidth={2} strokeLinecap="round" strokeDasharray="0.1 6" opacity={0.7}>
            <line x1={g} y1={0} x2={g} y2={255} /><line x1={0} y1={g} x2={255} y2={g} />
          </g>
        ))}
        <line x1={0} y1={255} x2={255} y2={0} className="stroke-faint" strokeWidth={2} strokeLinecap="round" strokeDasharray="0.1 6" opacity={0.7} />
        <path d={path} fill="none" stroke={line} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={255 - p[1]} r={drag === i ? 8 : 6} fill="rgb(var(--c-panel))" stroke={line} strokeWidth={2.5} data-testid="curve-point" className="cursor-grab" />
        ))}
      </svg>
      <p className="text-2xs leading-4 text-faint">Click the line to add a point, drag to bend it, double-click a point to remove it.</p>
    </Section>
  );
}

// ───────────────────────── colour grading ─────────────────────────

const ZONES = [{ id: "sh", label: "Shadows" }, { id: "mid", label: "Midtones" }, { id: "hi", label: "Highlights" }] as const;
type Zone = (typeof ZONES)[number]["id"];
const WHEEL = 156;
const HUES = "conic-gradient(from 0deg, hsl(0 80% 56%), hsl(60 80% 52%), hsl(120 65% 46%), hsl(180 70% 46%), hsl(240 80% 62%), hsl(300 70% 56%), hsl(360 80% 56%))";

function ColorWheel({ value, onChange, testId }: { value: Wheel; onChange: (w: Wheel) => void; testId: string }) {
  const [hue, sat] = value;
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    const s = Math.min(100, (Math.hypot(dx, dy) / (r.width / 2)) * 100);
    onChange([Math.round(deg), Math.round(s), value[2]]);
  };
  const a = (hue * Math.PI) / 180;
  return (
    <div className="relative mx-auto touch-none select-none rounded-full shadow-inner" data-testid={testId} style={{ width: WHEEL, height: WHEEL, background: `radial-gradient(circle closest-side, rgb(150 150 150), rgb(150 150 150 / 0)), ${HUES}` }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
      onPointerMove={(e) => { if (e.buttons) pick(e); }}
      onDoubleClick={() => onChange([0, 0, value[2]])}
      title="Drag to tint · double-click to centre">
      <span className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-md ring-1 ring-black/30"
        style={{ left: `${50 + (sat / 100) * 50 * Math.sin(a)}%`, top: `${50 - (sat / 100) * 50 * Math.cos(a)}%` }} />
    </div>
  );
}

export function GradeSection({ target }: { target: FillTarget }) {
  const [zone, setZone] = useState<Zone>("sh");
  const grade: Grade = target.fill.adjustments.grade ?? NEUTRAL_GRADE;
  const w = grade[zone];
  const setWheel = (next: Wheel) =>
    target.update((f) => {
      const a = f.adjustments as Adjustments;
      const g = a.grade ?? structuredClone(NEUTRAL_GRADE);
      a.grade = { ...g, [zone]: next } as Grade;
    }, `grade-${zone}`);
  const setBal = (bal: number) => target.update((f) => { const a = f.adjustments as Adjustments; a.grade = { ...(a.grade ?? structuredClone(NEUTRAL_GRADE)), bal } as Grade; }, "grade-bal");
  const zoneOn = (z: Zone) => grade[z].some((n) => n !== 0);
  return (
    <Section title="Colour grading" defaultOpen={false} action={resetBtn(() => target.update((f) => { delete (f.adjustments as Adjustments).grade; }), "reset-grade", gradeActive(target.fill.adjustments.grade))}>
      <div className="inline-flex w-full gap-0.5 rounded-full bg-field p-1" role="group" aria-label="Tonal range">
        {ZONES.map((z) => (
          <button key={z.id} type="button" aria-pressed={zone === z.id} data-testid={`grade-zone-${z.id}`} onClick={() => setZone(z.id)}
            className={`relative flex h-7 flex-1 items-center justify-center rounded-full text-xs font-medium transition-colors ${zone === z.id ? "bg-seg text-ink shadow-sm" : "text-mute hover:text-ink"}`}>
            {z.label}
            {zoneOn(z.id) && <span className="absolute right-2 top-2 h-1 w-1 rounded-full bg-ink" />}
          </button>
        ))}
      </div>
      <ColorWheel value={w} onChange={setWheel} testId="grade-wheel" />
      <Slider testId="grade-sat" label="Strength" value={Math.round(w[1])} min={0} max={100} onChange={(s) => setWheel([w[0], s, w[2]])} onReset={() => setWheel([w[0], 0, w[2]])} />
      <Slider testId="grade-lum" label="Luminance" value={Math.round(w[2])} min={-100} max={100} onChange={(l) => setWheel([w[0], w[1], l])} onReset={() => setWheel([w[0], w[1], 0])} />
      <Slider testId="grade-bal" label="Balance" value={Math.round(grade.bal)} min={-100} max={100} onChange={setBal} onReset={() => setBal(0)} />
    </Section>
  );
}
