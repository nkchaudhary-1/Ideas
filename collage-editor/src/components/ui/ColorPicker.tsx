"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pipette } from "lucide-react";
import { hexToRgb, hsvToRgb, parseColor, PALETTES, rgbToHex, rgbToHsv, withAlpha, dominantColors } from "@/lib/colors";
import { useStore, useActiveSlide } from "@/lib/store";
import { flatten } from "@/lib/geometry";
import { getAsset, peekImage } from "@/lib/media";
import { clamp } from "@/lib/util";

const photoPaletteCache = new Map<string, string[]>();

function usePhotoPalette(): string[] {
  const slide = useActiveSlide();
  const [, tick] = useState(0);
  const ids: string[] = [];
  const walk = (list: import("@/lib/types").Element[]) => {
    for (const e of flatten(list)) {
      if ((e.type === "image" || e.type === "video") && e.fill?.assetId) ids.push(e.fill.assetId);
      if (e.type === "grid") {
        const cells = (function c(n: import("@/lib/types").GridNode): import("@/lib/types").GridCell[] { return n.kind === "cell" ? [n] : n.children.flatMap(c); })(e.tree);
        cells.forEach((x) => x.fill?.assetId && ids.push(x.fill.assetId));
      }
    }
  };
  walk(slide.elements);
  const first = [...new Set(ids)].find((id) => getAsset(id)?.kind === "image");
  useEffect(() => { if (first && !photoPaletteCache.has(first)) { const t = setInterval(() => { if (peekImage(first, "preview")) { clearInterval(t); tick((x) => x + 1); } }, 200); return () => clearInterval(t); } }, [first]);
  if (!first) return [];
  if (!photoPaletteCache.has(first)) {
    const src = peekImage(first, "preview");
    if (src) photoPaletteCache.set(first, dominantColors(src.img, src.w, src.h, 7));
  }
  return photoPaletteCache.get(first) ?? [];
}

export function ColorPopover({ value, onChange, onClose, anchor, alpha }: {
  value: string; onChange: (c: string) => void; onClose: () => void; anchor: DOMRect; alpha?: boolean;
}) {
  const { hex, alpha: a0 } = parseColor(value);
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const [hsv, setHsv] = useState(() => rgbToHsv(rgb));
  const [alphaV, setAlphaV] = useState(a0);
  const [hexText, setHexText] = useState(hex);
  const recent = useStore((s) => s.ui.recentColors);
  const addRecent = useStore((s) => s.addRecentColor);
  const photo = usePhotoPalette();
  const ref = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);

  const emit = useCallback((h: typeof hsv, al: number) => {
    const c = rgbToHex(hsvToRgb(h));
    setHexText(c);
    onChange(alpha ? withAlpha(c, al) : c);
  }, [alpha, onChange]);

  useEffect(() => {
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("[data-color-trigger]")) { addRecent(rgbToHex(hsvToRgb(hsv))); onClose(); } };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("mousedown", down); window.removeEventListener("keydown", key); };
  }, [hsv, onClose, addRecent]);

  const dragSV = (e: React.PointerEvent) => {
    const el = svRef.current!;
    const upd = (ev: PointerEvent | React.PointerEvent) => {
      const r = el.getBoundingClientRect();
      const s = clamp((ev.clientX - r.left) / r.width, 0, 1), v = 1 - clamp((ev.clientY - r.top) / r.height, 0, 1);
      const nh = { ...hsv, s, v };
      setHsv(nh); emit(nh, alphaV);
    };
    upd(e);
    const mv = (ev: PointerEvent) => upd(ev);
    const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
  };

  const setHex = (t: string) => {
    setHexText(t);
    const r = hexToRgb(t);
    if (r) { const nh = rgbToHsv(r); setHsv(nh); onChange(alpha ? withAlpha(rgbToHex(r), alphaV) : rgbToHex(r)); }
  };
  const cur = hsvToRgb(hsv);
  const pick = (c: string) => { const r = hexToRgb(c); if (!r) return; setHsv(rgbToHsv(r)); setHexText(c); onChange(alpha ? withAlpha(c, alphaV) : c); };
  const left = clamp(anchor.left - 250, 8, window.innerWidth - 260);
  const top = clamp(anchor.bottom + 6, 8, window.innerHeight - 420);
  const hasEyedropper = typeof window !== "undefined" && "EyeDropper" in window;

  return createPortal(
    <div ref={ref} className="fixed z-[200] w-[244px] rounded-lg border border-line bg-panel p-3 shadow-2xl" style={{ left, top }} data-testid="color-popover">
      <div
        ref={svRef}
        onPointerDown={dragSV}
        className="relative h-32 w-full cursor-crosshair rounded-md"
        style={{ background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${hsv.h},100%,50%))` }}
      >
        <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: rgbToHex(cur) }} />
      </div>
      <input
        type="range" min={0} max={360} value={hsv.h} aria-label="Hue" className="mt-2"
        style={{ ["--p" as string]: "0%", background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)", borderRadius: 4, height: 8 }}
        onChange={(e) => { const nh = { ...hsv, h: +e.target.value }; setHsv(nh); emit(nh, alphaV); }}
      />
      {alpha && (
        <input type="range" min={0} max={100} value={Math.round(alphaV * 100)} aria-label="Opacity" className="mt-2" style={{ ["--p" as string]: `${alphaV * 100}%` }}
          onChange={(e) => { const al = +e.target.value / 100; setAlphaV(al); emit(hsv, al); }} />
      )}
      <div className="mt-2 flex items-center gap-1.5">
        <input value={hexText} onChange={(e) => setHex(e.target.value)} onKeyDown={(e) => e.stopPropagation()} aria-label="Hex colour" className="h-6 w-[78px] rounded-md bg-panel2 px-1.5 text-xs uppercase outline-none ring-1 ring-line focus:ring-accent/70" />
        {(["r", "g", "b"] as const).map((k) => (
          <input key={k} value={Math.round(cur[k])} aria-label={k.toUpperCase()} onChange={(e) => { const n = clamp(+e.target.value || 0, 0, 255); const r = { ...cur, [k]: n }; pick(rgbToHex(r)); }} onKeyDown={(e) => e.stopPropagation()} className="h-6 w-9 rounded-md bg-panel2 px-1 text-center text-xs outline-none ring-1 ring-line focus:ring-accent/70" />
        ))}
        {hasEyedropper && (
          <button type="button" title="Pick from screen" className="grid h-6 w-6 place-items-center rounded-md hover:bg-white/10" onClick={async () => {
            try { const r = await new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper().open(); pick(r.sRGBHex); } catch { /* cancelled */ }
          }}><Pipette size={13} /></button>
        )}
      </div>
      {recent.length > 0 && <Swatches title="Recent" colors={recent} onPick={pick} />}
      {photo.length > 0 && <Swatches title="From your photo" colors={photo} onPick={pick} />}
      <div className="mt-2 max-h-28 space-y-1.5 overflow-y-auto">
        {PALETTES.slice(0, 5).map((p) => <Swatches key={p.name} title={p.name} colors={p.colors} onPick={pick} compact />)}
      </div>
    </div>,
    document.body,
  );
}

function Swatches({ title, colors, onPick, compact }: { title: string; colors: string[]; onPick: (c: string) => void; compact?: boolean }) {
  return (
    <div className={compact ? "" : "mt-2"}>
      <div className="mb-1 text-2xs uppercase tracking-wide text-faint">{title}</div>
      <div className="flex flex-wrap gap-1">
        {colors.map((c, i) => (
          <button key={c + i} type="button" title={c} onClick={() => onPick(c)} className="h-5 w-5 rounded border border-white/15" style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

/** swatch + hex that opens the popover */
export function ColorField({ value, onChange, alpha, testId }: { value: string; onChange: (c: string) => void; alpha?: boolean; testId?: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const { hex } = parseColor(value);
  const text = useMemo(() => hex.toUpperCase().replace("#", ""), [hex]);
  return (
    <>
      <button
        ref={btn}
        type="button"
        data-color-trigger
        data-testid={testId}
        onClick={() => { setRect(btn.current!.getBoundingClientRect()); setOpen((o) => !o); }}
        className="flex h-6 min-w-0 items-center gap-1.5 rounded-md bg-panel2 pl-1 pr-2 text-xs ring-1 ring-line hover:ring-accent/50"
      >
        <span className="checker h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/20"><span className="block h-full w-full" style={{ background: value }} /></span>
        <span className="truncate uppercase text-ink/90">{text}</span>
      </button>
      {open && rect && <ColorPopover value={value} alpha={alpha} onChange={onChange} onClose={() => setOpen(false)} anchor={rect} />}
    </>
  );
}
