"use client";
import { useStore, getSlide } from "@/lib/store";
import { ELEMENT_PRESETS, inkFor, type ElementPreset } from "@/lib/presets";
import type { Element, ShapeEl } from "@/lib/types";
import { Section } from "@/components/ui/controls";

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

export default function ElementsPanel() {
  const st = useStore.getState;
  const sl = useStore((s) => getSlide(s.project));
  const groups = ["Basic", "Decor", "Labels", "Icons", "UI"] as const;
  const add = (p: ElementPreset) => {
    const ink = inkFor(sl);
    const el = p.build(sl.width, sl.height, ink);
    const cx = (sl.width - el.width) / 2, cy = (sl.height - el.height) / 2;
    if (p.group === "Basic" || p.group === "Icons" || (p.group === "Decor" && p.id !== "divider" && p.id !== "divider2" && p.id !== "photo-border")) { el.x = cx; el.y = cy; }
    if (el.type === "shape" && el.fill?.type === "solid" && el.fill.color === "#ffffff" && ink !== "#ffffff" && p.group !== "UI") el.fill = { type: "solid", color: ink };
    if (el.type === "shape" && el.stroke?.color === "#ffffff" && ink !== "#ffffff" && p.group !== "UI") el.stroke = { ...el.stroke, color: ink };
    st().addElement(el);
  };
  return (
    <div className="h-full overflow-y-auto" data-testid="elements-panel">
      {groups.map((g) => (
        <Section key={g} title={{ Basic: "Shapes", Decor: "Graphics & decor", Labels: "Labels & badges", Icons: "Simple icons", UI: "Interface pieces" }[g]}>
          <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {ELEMENT_PRESETS.filter((p) => p.group === g).map((p) => (
              <button key={p.id} type="button" title={p.name} data-testid={`el-${p.id}`} onClick={() => add(p)} className="group flex h-20 flex-col items-center justify-center gap-2 rounded p-1 hover:bg-ink/5">
                <span className="grid h-11 w-11 place-items-center rounded bg-panel2 text-ink"><Preview el={p.build(1080, 1350, "#ffffff")} /></span>
                <span className="w-full truncate text-center text-2xs text-mute group-hover:text-ink">{p.name}</span>
              </button>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
