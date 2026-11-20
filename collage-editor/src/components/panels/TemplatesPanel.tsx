"use client";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import { useCompact } from "@/lib/use-media";
import { useStore, getSlide } from "@/lib/store";
import { TEMPLATES, type Template, type TemplateCategory } from "@/lib/templates";
import { layoutGrid } from "@/lib/grid-engine";
import type { Slide } from "@/lib/types";
import { applyTemplate } from "@/lib/workflows";
import { Button, Chip } from "@/components/ui/controls";
import { cloneSlide } from "@/lib/factory";

const CATS: (TemplateCategory | "All" | "Saved")[] = ["All", "Instagram portrait", "Instagram square", "Carousel", "Photo collage", "Editorial", "Typography", "Magazine", "Travel", "Event", "Minimal", "Storytelling", "Poster", "Saved"];
const LS = "collage-studio:templates";

/** a flat schematic of a slide: frames as boxes, text as bars. Cheap, deterministic, always accurate to the layout. */
export function Schematic({ slide, width = 120 }: { slide: Slide; width?: number }) {
  const h = (width * slide.height) / slide.width;
  const k = width / slide.width;
  const bg = slide.background.type === "solid" ? slide.background.color : slide.background.type === "gradient" ? slide.background.stops[0].color : "#ddd";
  const render = (els: Slide["elements"], ox = 0, oy = 0): React.ReactNode =>
    els.map((e) => {
      const x = (ox + e.x) * k, y = (oy + e.y) * k, w = e.width * k, hh = e.height * k;
      const rot = e.rotation ? `rotate(${e.rotation} ${x + w / 2} ${y + hh / 2})` : undefined;
      if (e.type === "group") return <g key={e.id} transform={rot}>{render(e.children, ox + e.x, oy + e.y)}</g>;
      if (e.type === "grid") {
        const { cells } = layoutGrid(e);
        return <g key={e.id} transform={rot}>{cells.map((c) => <rect key={c.id} x={x + c.rect.x * k} y={y + c.rect.y * k} width={c.rect.w * k} height={c.rect.h * k} rx={Math.min(6, (c.cell.radius ?? e.radius) * k)} fill="#7d7d7d" />)}</g>;
      }
      if (e.type === "image" || e.type === "video") return <rect key={e.id} x={x} y={y} width={w} height={hh} rx={Math.min(8, e.radius * k)} fill={e.bg === "#2b2b2b" ? "#7d7d7d" : e.bg} opacity={0.9} transform={rot} />;
      if (e.type === "text") {
        const lines = Math.max(1, Math.min(4, Math.round((e.text.split("\n").length * e.fontSize * e.lineHeight * k) / Math.max(2, e.fontSize * k * 0.8)) || 1));
        const fs = Math.max(1.5, e.fontSize * k * 0.55);
        const col = e.fill.type === "solid" ? e.fill.color : "#fff";
        return <g key={e.id} transform={rot}>{Array.from({ length: Math.min(lines, 3) }, (_, i) => <rect key={i} x={e.align === "right" ? x + w * 0.35 : e.align === "center" ? x + w * 0.1 : x} y={y + i * fs * 1.5} width={Math.min(w, w * (i === 0 ? 0.9 : 0.6))} height={fs} rx={fs / 3} fill={col} opacity={0.85} />)}</g>;
      }
      if (e.type === "shape") return <rect key={e.id} x={x} y={y} width={w} height={Math.max(1, hh)} rx={e.kind === "ellipse" ? w / 2 : 2} fill={e.fill?.type === "solid" ? e.fill.color : "#fff"} opacity={0.8} transform={rot} />;
      return null;
    });
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className="block rounded" style={{ background: bg }}>
      {render(slide.elements)}
    </svg>
  );
}

export default function TemplatesPanel() {
  const st = useStore.getState;
  const project = useStore((s) => s.project);
  const phone = useCompact();
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [saved, setSaved] = useState<{ id: string; name: string; slides: Slide[] }[]>([]);
  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem(LS) || "[]")); } catch { /* ignore */ } }, []);
  const persist = (l: typeof saved) => { setSaved(l); try { localStorage.setItem(LS, JSON.stringify(l)); } catch { st().toast("Couldn't save the template (storage is full or blocked)", "error"); } };

  const list = useMemo<Template[]>(() => {
    if (cat === "Saved") return saved.map((s) => ({ id: s.id, name: s.name, categories: [], description: "Your template", size: { w: s.slides[0].width, h: s.slides[0].height }, kind: s.slides.length > 1 ? "carousel" : "single", build: () => structuredClone(s.slides).map((sl) => cloneSlide(sl, sl.name)) }));
    return TEMPLATES.filter((t) => cat === "All" || t.categories.includes(cat));
  }, [cat, saved]);

  const saveAs = (all: boolean) => {
    const slides = all ? project.slides : [getSlide(project)];
    const entry = { id: "user-" + Date.now().toString(36), name: `${project.name}${all && slides.length > 1 ? ` (${slides.length} slides)` : ""}`, slides: structuredClone(slides) };
    persist([entry, ...saved]);
    st().toast("Saved as a template (Saved tab)", "ok");
  };

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="templates-panel">
      <div className={`flex gap-2 px-8 pb-4 ${phone ? "no-scrollbar overflow-x-auto" : "flex-wrap"}`}>
        {CATS.map((c) => <Chip sm key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-6 pt-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {list.map((t) => {
            const slides = t.build();
            return (
              <div key={t.id} className="group" data-testid="template-card">
                <div className="relative overflow-hidden rounded ring-1 ring-line group-hover:ring-ink/25">
                  <div className="flex min-h-[140px] items-center justify-center bg-stage p-4">
                    <Schematic slide={slides[0]} width={slides[0].width / slides[0].height > 1.3 ? 120 : 96} />
                  </div>
                  {slides.length > 1 && <span className="absolute right-1 top-1 rounded bg-black/70 px-1 text-2xs text-white">{slides.length} slides</span>}
                  <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-1 bg-black/80 p-2 transition-transform group-hover:translate-y-0 touch:translate-y-0 text-white">
                    <Button className="flex-1 !h-7" variant="primary" onClick={() => applyTemplate(t, "replace")} testId={`apply-${t.id}`}>Apply</Button>
                    <Button className="!h-7 !px-2" title="Add as new slides" onClick={() => applyTemplate(t, "append")}><Plus size={12} /></Button>
                    {cat === "Saved" && <Button className="!h-7 !px-2" variant="danger" title="Delete template" onClick={() => persist(saved.filter((s) => s.id !== t.id))}><Trash2 size={12} /></Button>}
                  </div>
                </div>
                <div className="mt-1 truncate text-xs text-ink/90" title={t.name}>{t.name}</div>
                <div className="line-clamp-2 text-2xs leading-3 text-faint" title={t.description}>{t.description}</div>
              </div>
            );
          })}
        </div>
        {list.length === 0 && <div className="p-6 text-center text-xs text-mute">{cat === "Saved" ? "No saved templates yet. Save this slide or the whole carousel below." : "No templates in this category."}</div>}
      </div>
      <div className="flex gap-4 border-t border-line/60 px-8 py-5">
        <Button className="flex-1" onClick={() => saveAs(false)} testId="save-template"><Bookmark size={12} /> Save slide</Button>
        {project.slides.length > 1 && <Button className="flex-1" onClick={() => saveAs(true)}><Bookmark size={12} /> Save all</Button>}
      </div>
    </div>
  );
}
