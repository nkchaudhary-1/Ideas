"use client";
import { useEffect, useRef, useState } from "react";
import { Check, FlipHorizontal2, Minus, Move, Palette, Plus, RefreshCw, RotateCcw, RotateCw, SlidersHorizontal, Sun, ZoomIn, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditTarget, useFillTarget, type FillTarget } from "@/components/props/fill-target";
import { clamp } from "@/lib/util";

/** show a section of the properties card or sheet (opening it first if it is shut) */
function reveal(title: string) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const sec = [...document.querySelectorAll("[data-testid=properties] section, [data-testid=sheet-props] section")].find((s) => s.textContent?.trimStart().startsWith(title));
    sec?.scrollIntoView({ block: "start", behavior: "smooth" });
  }));
}

const C = 110, R = 106, r = 50; // the wheel is drawn in a 220 × 220 box
const polar = (rad: number, deg: number): [number, number] => [+(C + rad * Math.sin((deg * Math.PI) / 180)).toFixed(2), +(C - rad * Math.cos((deg * Math.PI) / 180)).toFixed(2)];
const wedge = (a0: number, a1: number) => {
  const [x0, y0] = polar(R, a0), [x1, y1] = polar(R, a1), [x2, y2] = polar(r, a1), [x3, y3] = polar(r, a0);
  return `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 0 0 ${x3} ${y3} Z`;
};
const rim = (a0: number, a1: number) => { const [x0, y0] = polar(R - 2.5, a0), [x1, y1] = polar(R - 2.5, a1); return `M${x0} ${y0} A${R - 2.5} ${R - 2.5} 0 0 1 ${x1} ${y1}`; };

type Tool = { id: string; label: string; Icon: LucideIcon; run: (e: { x: number; y: number }) => void; on?: boolean };

let remembered: boolean | null = null; // open or shut, kept while the editor stays open
let wheelPos: { x: number; y: number } | null = null; // where you left it, kept while the editor stays open
const HINTS: Record<string, string> = { zoom: "Use + and −", move: "Drag the photo", turn: "90° each tap", flip: "Mirror it", replace: "Pick another", filters: "Looks and tints", light: "Exposure, tone", reset: "Undo all of these" };

/**
 * The photo's own controls as a wheel, always in reach while a photo is selected (or, in Edit mode, open): zoom it, move and crop it inside its
 * frame, turn, flip or reset it, replace it, and jump to its filters and light. The name of the tool under your finger sits in the middle.
 */
export default function PhotoWheel({ compact }: { compact: boolean }) {
  const st = useStore.getState;
  const edit = useStore((s) => s.project.kind === "edit");
  const ft = useFillTarget();
  const et = useEditTarget();
  const cropId = useStore((s) => s.ui.cropId);
  const sheet = useStore((s) => s.ui.sheet);
  const stage = useStore((s) => s.ui.canvasSize);
  // on a narrow stage the open wheel would sit on top of the photo, so it starts folded there (unless you chose otherwise)
  const [choice, setChoice] = useState<boolean | null>(remembered);
  const open = choice ?? (!compact && stage.w >= 720);
  const [pos, setPosState] = useState(wheelPos);
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const flash = useRef<ReturnType<typeof setTimeout>>();
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const setOpen = (v: boolean) => { remembered = v; setChoice(v); };
  const target: FillTarget | null = edit ? et : ft;
  const key = target?.elKey;
  useEffect(() => { setActive(null); }, [key]);
  useEffect(() => () => clearTimeout(flash.current), []);
  if (!target || (compact && sheet)) return null;
  const f = target.fill;
  const cropping = cropId === target.elementId;
  const zoomBy = (d: number) => target.update((x) => { x.zoom = clamp(Math.round((x.zoom + d) * 100) / 100, 1, 8); }, "zoom");
  const openCard = () => { if (compact) st().setUI({ sheet: "props", sheetSize: "half" }); else st().setUI({ rightOpen: true }); };
  const tell = (id: string) => { setActive(id); clearTimeout(flash.current); };
  const quick = (id: string) => { setHover(id); clearTimeout(flash.current); flash.current = setTimeout(() => setHover(null), 1200); };

  const tools: Tool[] = [
    { id: "zoom", label: "Zoom", Icon: ZoomIn, on: active === "zoom", run: () => tell(active === "zoom" ? "" : "zoom") },
    { id: "move", label: cropping ? "Done" : "Move & crop", Icon: cropping ? Check : Move, on: cropping, run: () => { st().setUI({ cropId: cropping ? null : target.elementId }); tell("move"); } },
    { id: "turn", label: "Turn", Icon: RotateCw, run: () => { target.update((x) => { x.rotation90 = ((x.rotation90 + 90) % 360) as 0 | 90 | 180 | 270; }); quick("turn"); } },
    { id: "flip", label: "Flip", Icon: FlipHorizontal2, run: () => { target.update((x) => { x.flipX = !x.flipX; }); quick("flip"); } },
    ...(edit ? [] : [{ id: "replace", label: "Replace", Icon: RefreshCw, run: (p: { x: number; y: number }) => st().setUI({ mediaPicker: { x: p.x, y: p.y, ...(target.kind === "cell" ? { gridId: target.elementId, cellId: target.cellId } : { elementId: target.elementId }) } }) } as Tool]),
    { id: "filters", label: "Filters", Icon: Palette, run: () => { openCard(); reveal("Filters"); tell("filters"); } },
    { id: "light", label: "Light & colour", Icon: Sun, run: () => { openCard(); reveal("Adjustments"); tell("light"); } },
    { id: "reset", label: "Reset", Icon: RotateCcw, run: () => { target.update((x) => { x.zoom = 1; x.fx = 0.5; x.fy = 0.5; x.flipX = false; x.flipY = false; x.rotation90 = 0; }); st().setUI({ cropId: null }); quick("reset"); } },
  ];
  const n = tools.length, step = 360 / n;
  const shown = hover ?? (active || null) ?? (cropping ? "move" : null);
  const label = tools.find((t) => t.id === shown)?.label ?? "Photo";
  const size = compact ? 184 : 220;

  // anchored at the bottom centre of the stage until you move it; kept inside the stage wherever you drop it
  const dim = open ? size : 56;
  const fit = (p: { x: number; y: number }) => ({ x: clamp(p.x, 8, Math.max(8, stage.w - dim - 8)), y: clamp(p.y, 8, Math.max(8, stage.h - dim - 8)) });
  const home = { x: (stage.w - dim) / 2, y: stage.h - (compact ? 84 : 92) - dim };
  const at = fit(pos ?? home);
  const grab = (onTap: () => void) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { sx: e.clientX, sy: e.clientY, ox: at.x, oy: at.y, moved: false };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current; if (!d) return;
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (!d.moved && Math.hypot(dx, dy) < 5) return;
      d.moved = true; setDragging(true);
      setPosState(fit({ x: d.ox + dx, y: d.oy + dy }));
    },
    onPointerUp: () => {
      const d = drag.current; drag.current = null; setDragging(false);
      if (!d) return;
      if (d.moved) { wheelPos = pos ?? at; setPosState(wheelPos); } else onTap();
    },
    onPointerCancel: () => { drag.current = null; setDragging(false); },
  });
  const frame = { left: at.x, top: at.y, width: dim, height: dim };

  if (!open) {
    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        <button type="button" aria-label="Photo tools: zoom, crop, turn, filters. Drag to move" title="Photo tools (drag to move)" data-testid="photo-wheel-toggle" style={frame} {...grab(() => setOpen(true))}
          className={`pointer-events-auto absolute grid touch-none place-items-center rounded-full bg-[#111] text-white shadow-float ring-1 ring-white/10 hover:bg-[#1c1c1c] ${dragging ? "cursor-grabbing scale-105" : "cursor-grab"}`}>
          <SlidersHorizontal size={20} />
        </button>
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className={`wheel-pop pointer-events-auto absolute rounded-full bg-[#111] ring-1 ring-white/10 ${dragging ? "shadow-[0_24px_60px_rgb(0_0_0/0.45)]" : "shadow-float"}`} style={frame} role="toolbar" aria-label="Photo controls" data-testid="photo-toolbar">
        <svg viewBox="0 0 220 220" width={size} height={size} className="block select-none">
          {tools.map((t, i) => {
            const a0 = i * step - step / 2, a1 = i * step + step / 2;
            const [ix, iy] = polar((R + r) / 2 + 2, i * step);
            const lit = t.on || shown === t.id;
            return (
              <g key={t.id} role="button" tabIndex={0} aria-label={t.label} aria-pressed={t.on ?? undefined} className="wheel-seg cursor-pointer outline-none"
                onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(t.id); }} onPointerLeave={(e) => { if (e.pointerType === "mouse") setHover(null); }}
                onFocus={() => setHover(t.id)} onBlur={() => setHover(null)}
                onClick={(e) => t.run({ x: e.clientX, y: e.clientY })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const b = (e.currentTarget as SVGGElement).getBoundingClientRect(); t.run({ x: b.x + b.width / 2, y: b.y }); } }}>
                <path d={wedge(a0, a1)} fill={lit ? "#262626" : "transparent"} className="wheel-wedge" />
                {t.on && <path d={rim(a0 + 1, a1 - 1)} fill="none" stroke="rgb(var(--accent))" strokeWidth={4} strokeLinecap="round" />}
                <g className="wheel-icon" style={{ transformOrigin: `${ix}px ${iy}px` }}><t.Icon x={ix - 11} y={iy - 11} size={22} className="text-white" /></g>
                <circle cx={ix} cy={iy} r={22} fill="transparent" data-testid={`wheel-${t.id}`} />
              </g>
            );
          })}
          <circle cx={C} cy={C} r={r - 2} fill="#222" pointerEvents="none" />
        </svg>
        <div {...grab(() => setOpen(false))} data-testid="photo-wheel-close" title="Drag to move, tap to hide" aria-label="Photo tools: drag to move, tap to hide"
          className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full text-center text-white ${dragging ? "cursor-grabbing" : "cursor-grab"}`} style={{ width: (r - 6) * 2 * (size / 220), height: (r - 6) * 2 * (size / 220) }}>
          {active === "zoom" ? (
            <div className="flex flex-col items-center gap-1" data-nodrag>
              <button type="button" title="Back to 100%" aria-label={`Photo zoom ${Math.round(f.zoom * 100)} percent, click to reset`} data-testid="photo-zoom-pct" onClick={() => target.update((x) => { x.zoom = 1; x.fx = 0.5; x.fy = 0.5; })} className="rounded-full px-2 text-sm font-semibold tabular-nums hover:bg-white/10">{Math.round(f.zoom * 100)}%</button>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Zoom photo out" data-testid="photo-zoom-out" disabled={f.zoom <= 1} onClick={() => zoomBy(-0.1)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 coarse:h-9 coarse:w-9"><Minus size={14} /></button>
                <button type="button" aria-label="Zoom photo in" data-testid="photo-zoom-in" disabled={f.zoom >= 8} onClick={() => zoomBy(0.1)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 coarse:h-9 coarse:w-9"><Plus size={14} /></button>
              </div>
            </div>
          ) : (
            <span className="pointer-events-none flex flex-col items-center px-2">
              <span className="text-xs font-semibold leading-4">{dragging ? "Moving" : label}</span>
              <span className="mt-0.5 text-2xs leading-3 text-white/55">{dragging ? "Drop it anywhere" : shown ? HINTS[shown] : "Drag me anywhere"}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
