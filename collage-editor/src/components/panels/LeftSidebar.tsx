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

// The rail: every tool has its name under its icon, in three titled groups: bring things in, design, manage what's there.
const GROUP_TITLES = ["Add", "Design", "Manage"];
export const GROUPS: { id: PanelId; label: string; short: string; icon: React.ReactNode }[][] = [
  [
    { id: "uploads", label: "Media", short: "Media", icon: <Upload size={19} /> },
    { id: "layouts", label: "Layouts & grids", short: "Layouts", icon: <LayoutGrid size={19} /> },
    { id: "templates", label: "Templates", short: "Templates", icon: <LayoutTemplate size={19} /> },
  ],
  [
    { id: "text", label: "Text", short: "Text", icon: <Type size={19} /> },
    { id: "elements", label: "Elements", short: "Elements", icon: <Shapes size={19} /> },
    { id: "frames", label: "Frames", short: "Frames", icon: <Frame size={19} /> },
    { id: "backgrounds", label: "Backgrounds", short: "Backdrop", icon: <ImageIcon size={19} /> },
    { id: "palettes", label: "Colours", short: "Colours", icon: <Palette size={19} /> },
  ],
  [{ id: "layers", label: "Layers", short: "Layers", icon: <Layers size={19} /> }],
];
export const ALL_TOOLS = GROUPS.flat();
const ALL = ALL_TOOLS;

/** the content of one tool panel; shared by the desktop card and the phone sheet */
export function PanelBody({ panel }: { panel: PanelId | null }) {
  return (
    <>
      {panel === "uploads" && <UploadsPanel />}
      {panel === "templates" && <TemplatesPanel />}
      {panel === "layouts" && <LayoutsPanel />}
      {panel === "text" && <TextPanel />}
      {panel === "elements" && <ElementsPanel />}
      {panel === "backgrounds" && <BackgroundsPanel />}
      {panel === "frames" && <FramesPanel />}
      {panel === "layers" && <LayersPanel />}
      {panel === "palettes" && <PalettesPanel />}
    </>
  );
}

export default function LeftSidebar() {
  const kind = useStore((s) => s.project.kind);
  const edit = kind === "edit";
  const panel = useStore((s) => (kind === "edit" ? (s.ui.leftPanel === "uploads" ? "uploads" : null) : s.ui.leftPanel));
  const set = useStore((s) => s.setUI);
  const current = ALL.find((i) => i.id === panel);
  return (
    <>
      {/* Edit mode has one tool, so the rail is one round button, not a tall card with a lonely icon in it */}
      <nav className={edit ? "card flex h-[72px] w-[72px] shrink-0 items-center justify-center self-start rounded-full" : "card no-scrollbar flex w-[88px] shrink-0 flex-col items-center gap-1 overflow-y-auto py-4"} aria-label="Tools" data-testid="left-rail">
        {(edit ? GROUPS.slice(0, 1).map((g) => g.filter((i) => i.id === "uploads")) : GROUPS).map((g, gi) => (
          <div key={gi} className="flex w-full flex-col items-center gap-1">
            {gi > 0 && <span className="my-2 h-px w-8 bg-line" />}
            {!edit && <span className="mb-1 text-2xs font-semibold text-faint">{GROUP_TITLES[gi]}</span>}
            {g.map((i) => (
              <button key={i.id} type="button" title={i.label} aria-label={i.label} aria-pressed={panel === i.id} data-testid={`rail-${i.id}`} onClick={() => set({ leftPanel: panel === i.id ? null : i.id })}
                className={`flex flex-col items-center justify-center gap-1 text-2xs font-semibold transition-colors ${edit ? "h-14 w-14 rounded-full" : "h-14 w-[72px] rounded-in-8"} ${panel === i.id ? "grad-accent text-white shadow-card" : "text-mute hover:bg-field hover:text-ink"}`}>
                {i.icon}
                <span className="whitespace-nowrap">{i.short}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      {current && (
        <section className="card pop flex w-[344px] shrink-0 flex-col overflow-hidden" data-testid="left-panel" aria-label={current.label}>
          <div className="flex h-[72px] shrink-0 items-center justify-between px-8">
            <h2 className="text-base font-extrabold tracking-tight">{current.label}</h2>
            <button type="button" aria-label="Close panel" title="Close" onClick={() => set({ leftPanel: null })} className="grid h-9 w-9 place-items-center rounded-full text-mute hover:bg-field hover:text-ink"><X size={16} /></button>
          </div>
          <div className="min-h-0 flex-1">
            <PanelBody panel={panel} />
          </div>
        </section>
      )}
    </>
  );
}
