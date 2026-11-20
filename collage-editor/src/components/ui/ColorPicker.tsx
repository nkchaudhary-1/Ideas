"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pipette } from "lucide-react";
import { hexToRgb, hsvToRgb, parseColor, PALETTES, rgbToHex, rgbToHsv, withAlpha, dominantColors } from "@/lib/colors";
import { useStore, useActiveSlide } from "@/lib/store";
import { flatten } from "@/lib/geometry";
import { getAsset, peekImage } from "@/lib/media";
import { clamp } from "@/lib/util";
import { IconButton } from "@/components/ui/controls";

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
  const left = clamp(anchor.left - 264, 8, window.innerWidth - 304);
  const top = clamp(anchor.bottom + 8, 8, window.innerHeight - 520);
  const hasEyedropper = typeof window !== "undefined" && "EyeDropper" in window;

  return createPortal(
    <div ref={ref} className="card pop fixed z-[200] w-[288px] space-y-4 p-5 shadow-float" style={{ left, top }} data-testid="color-popover" role="dialog" aria-label="Colour picker">
      <div
        ref={svRef}
        onPointerDown={dragSV}
        className="relative h-36 w-full cursor-crosshair rounded-in-20"
        style={{ background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${hsv.h},100%,50%))` }}
      >
        <span className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: rgbToHex(cur) }} />
      </div>
      <input
        type="range" min={0} max={360} value={hsv.h} aria-label="Hue" className="rs-color"
        style={{ ["--track" as string]: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
        onChange={(e) => { const nh = { ...hsv, h: +e.target.value }; setHsv(nh); emit(nh, alphaV); }}
      />
      {alpha && (
        <input type="range" min={0} max={100} value={Math.round(alphaV * 100)} aria-label="Opacity" style={{ ["--a" as string]: "0%", ["--b" as string]: `${alphaV * 100}%` }}
          onChange={(e) => { const al = +e.target.value / 100; setAlphaV(al); emit(hsv, al); }} />
      )}
      <div className="flex items-center gap-2">
        <input value={hexText} onChange={(e) => setHex(e.target.value)} onKeyDown={(e) => e.stopPropagation()} aria-label="Hex colour" className="h-9 min-w-0 flex-1 rounded-full bg-field px-4 text-xs font-medium uppercase outline-none focus:ring-2 focus:ring-accent/40" />
        {hasEyedropper && (
          <IconButton icon={<Pipette size={15} />} label="Pick from screen" onClick={async () => {
            try { const r = await new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper().open(); pick(r.sRGBHex); } catch { /* cancelled */ }
          }} />
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["r", "g", "b"] as const).map((k) => (
          <input key={k} value={Math.round(cur[k])} aria-label={k.toUpperCase()} inputMode="numeric" onChange={(e) => { const n = clamp(+e.target.value || 0, 0, 255); const r = { ...cur, [k]: n }; pick(rgbToHex(r)); }} onKeyDown={(e) => e.stopPropagation()} className="h-9 min-w-0 rounded-full bg-field px-3 text-center text-xs font-medium outline-none focus:ring-2 focus:ring-accent/40" />
        ))}
      </div>
      {recent.length > 0 && <Swatches title="Recent" colors={recent} onPick={pick} />}
      {photo.length > 0 && <Swatches title="From your photo" colors={photo} onPick={pick} />}
      <div className="max-h-32 space-y-3 overflow-y-auto">
        {PALETTES.slice(0, 5).map((p) => <Swatches key={p.name} title={p.name} colors={p.colors} onPick={pick} />)}
      </div>
    </div>,
    document.body,
  );
}

function Swatches({ title, colors, onPick }: { title: string; colors: string[]; onPick: (c: string) => void }) {
  return (
    <div>
      <div className="mb-2 text-2xs font-semibold text-faint">{title}</div>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <button key={c + i} type="button" title={c} aria-label={c} onClick={() => onPick(c)} className="h-6 w-6 rounded-full ring-1 ring-inset ring-ink/15 transition-transform hover:scale-110" style={{ background: c }} />
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
        className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-field pl-2 pr-3 text-xs font-medium transition-colors hover:bg-raised"
      >
        <span className="checker h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-inset ring-ink/20"><span className="block h-full w-full" style={{ background: value }} /></span>
        <span className="truncate uppercase text-ink/90">{text}</span>
      </button>
      {open && rect && <ColorPopover value={value} alpha={alpha} onChange={onChange} onClose={() => setOpen(false)} anchor={rect} />}
    </>
  );
}
