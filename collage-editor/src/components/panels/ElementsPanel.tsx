"use client";
import { placeElements, startDrag, endDrag, type ElementsItem } from "@/lib/drop";
import { FRAMES, frameItem, type FramePreset } from "@/lib/frame-presets";
import { ELEMENT_PRESETS, type ElementPreset } from "@/lib/presets";
import type { Element, ShapeEl } from "@/lib/types";
import { useMemo, useState } from "react";
import { Image as ImageIcon, Search } from "lucide-react";
import { ChipRow } from "@/components/ui/controls";

function Preview({ el }: { el: Element }) {
  const sz = 44;
  if (el.type === "group") return <div className="grid h-11 w-11 place-items-center rounded bg-panel2 text-2xs text-mute">{el.name.split(" ")[0]}</div>;
  if (el.type !== "shape") return null;
  const s = el as ShapeEl;
  // elements are authored in white for dark artboards; show white as the theme's ink so it reads on a light card too
  const themed = (c: string) => (/^#f{3}$|^#f{6}$/i.test(c) ? "currentColor" : c);
  const fill = themed(s.fill?.type === "solid" ? s.fill.color : "#ffffff");
  const stroke = s.stroke?.color ? themed(s.stroke.color) : "none";
  const sw = s.stroke ? Math.max(2, Math.min(6, s.stroke.width / 3)) : 0;
  let shape: React.ReactNode = null;
  switch (s.kind) {
    case "rect": shape = <rect x={6} y={10} width={32} height={24} rx={Math.min(8, s.radius / 6)} fill={fill} />; break;
    case "ellipse": shape = <ellipse cx={22} cy={22} rx={s.width === s.height ? 14 : 17} ry={s.width === s.height ? 14 : 11} fill={fill} />; break;
    case "line": shape = <line x1={5} y1={22} x2={39} y2={22} stroke={stroke} strokeWidth={3} strokeLinecap="round" />; break;
    case "arrow": shape = <><line x1={5} y1={22} x2={34} y2={22} stroke={stroke} strokeWidth={3} strokeLinecap="round" /><path d="M30 14 L40 22 L30 30 Z" fill={stroke} /></>; break;
    case "triangle": shape = <path d="M22 8 L38 36 H6 Z" fill={fill} />; break;
    case "polygon": shape = <path d="M22 6 L37 15 V30 L22 38 L7 30 V15 Z" fill={fill} />; break;
    case "star": shape = s.sides > 8 ? <circle cx={22} cy={22} r={15} fill={fill} strokeDasharray="0.1 3.4" strokeLinecap="round" stroke="#000" strokeWidth={2.2} /> : <path d="M22 5 L27 17 L40 18 L30 26 L33 39 L22 32 L11 39 L14 26 L4 18 L17 17 Z" fill={fill} />; break;
    case "path": shape = <path d={s.path} fill={s.fill ? fill : "none"} stroke={s.stroke ? stroke : "none"} strokeWidth={sw * 2.2} strokeLinecap="round" transform="translate(4 4) scale(0.36)" />; break;
  }
  return <svg width={sz} height={sz} viewBox="0 0 44 44" className="text-ink/80">{shape}</svg>;
}

type Cat = "all" | "frames" | ElementPreset["group"];
// shapes, graphics and frames are all things you drop on the slide, so they share one grid; the tabs just narrow it down
const TABS: { id: Cat; label: string }[] = [{ id: "all", label: "All" }, { id: "Basic", label: "Shapes" }, { id: "frames", label: "Frames" }, { id: "Decor", label: "Graphics" }, { id: "Labels", label: "Labels" }, { id: "Icons", label: "Icons" }, { id: "UI", label: "Interface" }];

/** a frame is a window for a photo or video: an outline with a picture mark, so it never reads as the solid shape of the same name */
function FrameGlyph({ f }: { f: FramePreset }) {
  const k = 30 / Math.max(f.w, f.h);
  const w = f.w * k, h = f.h * k;
  return (
    <span className="grid place-items-center border-2 border-ink/70 text-ink/70" data-radius-free style={{ width: w, height: h, borderRadius: f.shape === "circle" ? "50%" : f.shape === "pill" ? 999 : f.shape === "arch" ? `${w}px ${w}px 0 0` : f.shape === "squircle" ? "36%" : Math.min(f.radius * k * 0.9, 8) }}>
      <ImageIcon size={Math.max(8, Math.min(w, h) - 12)} strokeWidth={2.4} />
    </span>
  );
}

interface Tile { key: string; name: string; label: string; cat: Cat; testId: string; glyph: React.ReactNode; item: ElementsItem }

/** one element, built for the area it lands in: centred for shapes and icons, and in the ink that reads on the slide */
const item = (p: ElementPreset): ElementsItem => ({
  kind: "elements",
  build: (w, h, ink) => {
    const el = p.build(w, h, ink);
    if (p.group === "Basic" || p.group === "Icons" || (p.group === "Decor" && p.id !== "divider" && p.id !== "divider2" && p.id !== "photo-border")) { el.x = (w - el.width) / 2; el.y = (h - el.height) / 2; }
    if (el.type === "shape" && el.fill?.type === "solid" && el.fill.color === "#ffffff" && ink !== "#ffffff" && p.group !== "UI") el.fill = { type: "solid", color: ink };
    if (el.type === "shape" && el.stroke?.color === "#ffffff" && ink !== "#ffffff" && p.group !== "UI") el.stroke = { ...el.stroke, color: ink };
    return [el];
  },
});

export default function ElementsPanel() {
  const [cat, setCat] = useState<Cat>("all");
  const [q, setQ] = useState("");
  // shapes first, then frames, then the rest, so the first screen of All shows what people reach for most
  const tiles = useMemo<Tile[]>(() => {
    const els: Tile[] = ELEMENT_PRESETS.map((p) => ({ key: "el-" + p.id, name: p.name, label: p.name, cat: p.group, testId: `el-${p.id}`, glyph: <Preview el={p.build(1080, 1350, "#ffffff")} />, item: item(p) }));
    // a frame that shares its name with a shape says "frame", so two tiles in All never read the same
    const shapeNames = new Set(ELEMENT_PRESETS.map((e) => e.name.toLowerCase()));
    const frames: Tile[] = FRAMES.map((f) => ({ key: "frame-" + f.id, name: shapeNames.has(f.name.toLowerCase()) ? f.name + " frame" : f.name, label: f.name + " frame", cat: "frames", testId: `frame-${f.id}`, glyph: <FrameGlyph f={f} />, item: frameItem(f) }));
    return [...els.filter((t) => t.cat === "Basic"), ...frames, ...els.filter((t) => t.cat !== "Basic")];
  }, []);
  const needle = q.trim().toLowerCase();
  const list = tiles.filter((t) => (cat === "all" || t.cat === cat) && (!needle || t.label.toLowerCase().includes(needle)));
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="elements-panel">
      <label className="mx-8 mb-3 flex h-9 shrink-0 items-center gap-2 rounded-full bg-field px-4 text-xs coarse:h-11 focus-within:ring-2 focus-within:ring-accent/40">
        <Search size={13} className="shrink-0 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="Search elements and frames" aria-label="Search elements and frames" data-testid="el-search" className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-faint" />
      </label>
      <ChipRow testId="element-tabs" items={TABS} value={cat} onChange={setCat} />
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-6">
        {cat === "frames" && <p className="pb-4 text-2xs leading-4 text-faint max-[899px]:hidden" data-testid="frames-hint">Frames are windows for photos and videos. Drop media onto one, then double-click to move or zoom the picture inside it.</p>}
        {list.length === 0 ? (
          <p className="py-8 text-center text-xs leading-5 text-mute">Nothing called “{q.trim()}”. Try another word, or pick All.</p>
        ) : (
          <div className="grid grid-cols-4 gap-x-2 gap-y-4" role="tabpanel">
            {list.map((t) => (
              <button key={t.key} type="button" title={t.label} aria-label={t.label} data-testid={t.testId} draggable onDragStart={(e) => startDrag(e, t.item)} onDragEnd={endDrag} onClick={() => placeElements(t.item)} className="group flex h-20 flex-col items-center justify-center gap-2 rounded p-1 hover:bg-ink/5">
                <span className="grid h-11 w-11 place-items-center rounded bg-panel2 text-ink">{t.glyph}</span>
                <span className="w-full truncate text-center text-2xs text-mute group-hover:text-ink">{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
