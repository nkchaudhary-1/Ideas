"use client";
import { Frame, Image as ImageIcon, LayoutGrid, LayoutTemplate, Layers, Palette, Shapes, Type, Upload, X } from "lucide-react";
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

// Icon-only rail in three quiet groups: bring things in, add things, manage what's there.
const GROUPS: { id: PanelId; label: string; icon: React.ReactNode }[][] = [
  [
    { id: "uploads", label: "Media", icon: <Upload size={19} /> },
    { id: "layouts", label: "Layouts & grids", icon: <LayoutGrid size={19} /> },
    { id: "templates", label: "Templates", icon: <LayoutTemplate size={19} /> },
  ],
  [
    { id: "text", label: "Text", icon: <Type size={19} /> },
    { id: "elements", label: "Elements", icon: <Shapes size={19} /> },
    { id: "frames", label: "Frames", icon: <Frame size={19} /> },
    { id: "backgrounds", label: "Backgrounds", icon: <ImageIcon size={19} /> },
    { id: "palettes", label: "Colours", icon: <Palette size={19} /> },
  ],
  [{ id: "layers", label: "Layers", icon: <Layers size={19} /> }],
];
const ALL = GROUPS.flat();

export default function LeftSidebar() {
  const panel = useStore((s) => s.ui.leftPanel);
  const set = useStore((s) => s.setUI);
  const current = ALL.find((i) => i.id === panel);
  return (
    <>
      <nav className="card flex w-[60px] shrink-0 flex-col items-center gap-1 py-3" aria-label="Tools" data-testid="left-rail">
        {GROUPS.map((g, gi) => (
          <div key={gi} className="flex flex-col items-center gap-1">
            {gi > 0 && <span className="my-1.5 h-px w-6 bg-line" />}
            {g.map((i) => (
              <button key={i.id} type="button" title={i.label} aria-label={i.label} aria-pressed={panel === i.id} data-testid={`rail-${i.id}`} onClick={() => set({ leftPanel: panel === i.id ? null : i.id })}
                className={`grid h-11 w-11 place-items-center rounded-2xl transition-colors ${panel === i.id ? "bg-accent text-white shadow-card" : "text-mute hover:bg-field hover:text-ink"}`}>
                {i.icon}
              </button>
            ))}
          </div>
        ))}
      </nav>
      {current && (
        <section className="card pop flex w-[304px] shrink-0 flex-col overflow-hidden" data-testid="left-panel" aria-label={current.label}>
          <div className="flex h-14 shrink-0 items-center justify-between px-5">
            <h2 className="text-base font-extrabold tracking-tight">{current.label}</h2>
            <button type="button" aria-label="Close panel" title="Close" onClick={() => set({ leftPanel: null })} className="grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-field hover:text-ink"><X size={15} /></button>
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
    </>
  );
}
