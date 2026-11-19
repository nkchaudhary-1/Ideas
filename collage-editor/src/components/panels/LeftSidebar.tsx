"use client";
import { Frame, Image as ImageIcon, LayoutGrid, LayoutTemplate, Layers, Palette, PanelLeftClose, Shapes, Type, Upload, X } from "lucide-react";
import { useStore, type PanelId } from "@/lib/store";
import UploadsPanel from "./UploadsPanel";
import TemplatesPanel from "./TemplatesPanel";
import LayoutsPanel from "./LayoutsPanel";
import TextPanel from "./TextPanel";
import ElementsPanel from "./ElementsPanel";
import BackgroundsPanel from "./BackgroundsPanel";
import FramesPanel from "./FramesPanel";
import LayersPanel from "./LayersPanel";
import PalettesPanel from "./PalettesPanel";

const ITEMS: { id: PanelId; label: string; icon: React.ReactNode }[] = [
  { id: "templates", label: "Templates", icon: <LayoutTemplate size={18} /> },
  { id: "layouts", label: "Layouts & grids", icon: <LayoutGrid size={18} /> },
  { id: "uploads", label: "Uploads", icon: <Upload size={18} /> },
  { id: "text", label: "Text", icon: <Type size={18} /> },
  { id: "elements", label: "Elements", icon: <Shapes size={18} /> },
  { id: "backgrounds", label: "Backgrounds", icon: <ImageIcon size={18} /> },
  { id: "frames", label: "Frames", icon: <Frame size={18} /> },
  { id: "layers", label: "Layers", icon: <Layers size={18} /> },
  { id: "palettes", label: "Colours", icon: <Palette size={18} /> },
];

export default function LeftSidebar() {
  const panel = useStore((s) => s.ui.leftPanel);
  const set = useStore((s) => s.setUI);
  const current = ITEMS.find((i) => i.id === panel);
  return (
    <>
      <nav className="flex w-[54px] shrink-0 flex-col items-center gap-0.5 border-r border-line bg-panel py-2" aria-label="Tools" data-testid="left-rail">
        {ITEMS.map((i) => (
          <button key={i.id} type="button" title={i.label} aria-label={i.label} data-testid={`rail-${i.id}`} onClick={() => set({ leftPanel: panel === i.id ? null : i.id })} className={`flex w-[46px] flex-col items-center gap-0.5 rounded-md py-1.5 ${panel === i.id ? "bg-accent/15 text-accent" : "text-ink/75 hover:bg-white/8 hover:text-ink"}`}>
            {i.icon}
            <span className="text-[9px] leading-none">{i.label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
      {current && (
        <section className="flex w-[292px] shrink-0 flex-col border-r border-line bg-panel" data-testid="left-panel" aria-label={current.label}>
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-line px-3">
            <h2 className="text-sm font-medium">{current.label}</h2>
            <button type="button" aria-label="Collapse panel" title="Collapse" onClick={() => set({ leftPanel: null })} className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-white/10 hover:text-ink"><PanelLeftClose size={14} /></button>
          </div>
          <div className="min-h-0 flex-1">
            {panel === "uploads" && <UploadsPanel />}
            {panel === "templates" && <TemplatesPanel />}
            {panel === "layouts" && <LayoutsPanel />}
            {panel === "text" && <TextPanel />}
            {panel === "elements" && <ElementsPanel />}
            {panel === "backgrounds" && <BackgroundsPanel />}
            {panel === "frames" && <FramesPanel />}
            {panel === "layers" && <LayersPanel />}
            {panel === "palettes" && <PalettesPanel />}
          </div>
        </section>
      )}
      <span className="sr-only"><X /></span>
    </>
  );
}
