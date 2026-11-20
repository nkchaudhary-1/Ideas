"use client";
import { SlidersHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { ALL_TOOLS } from "@/components/panels/LeftSidebar";

/** Phones: the tool rail becomes a row along the bottom. Tap a tool to open its sheet, tap it again to close it. */
export default function Dock() {
  const kind = useStore((s) => s.project.kind);
  const sheet = useStore((s) => s.ui.sheet);
  const panel = useStore((s) => s.ui.leftPanel);
  const hasSelection = useStore((s) => s.selection.length > 0);
  const set = useStore((s) => s.setUI);
  const edit = kind === "edit";
  const tools = edit ? ALL_TOOLS.filter((t) => t.id === "uploads") : ALL_TOOLS;
  const item = "relative flex h-14 min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-in-8 px-2 text-2xs font-semibold transition-colors";
  return (
    <nav className="card no-scrollbar flex shrink-0 items-stretch gap-1 overflow-x-auto p-2" aria-label="Tools" data-testid="dock">
      <button type="button" aria-pressed={sheet === "props"} data-testid="dock-props" onClick={() => set({ sheet: sheet === "props" ? null : "props" })}
        className={`${item} ${sheet === "props" ? "grad-accent text-white shadow-card" : "text-mute"}`}>
        <SlidersHorizontal size={20} />
        {edit ? "Adjust" : "Edit"}
        {!edit && hasSelection && sheet !== "props" && <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-panel" />}
      </button>
      <span className="my-3 w-px shrink-0 bg-line" />
      {tools.map((t) => {
        const on = sheet === "tools" && panel === t.id;
        return (
          <button key={t.id} type="button" aria-pressed={on} aria-label={t.label} data-testid={`rail-${t.id}`}
            onClick={() => set(on ? { sheet: null } : { leftPanel: t.id, sheet: "tools" })}
            className={`${item} ${on ? "grad-accent text-white shadow-card" : "text-mute"}`}>
            {t.icon}
            <span className="max-w-full truncate">{SHORT[t.id] ?? t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** the rail's long names do not fit under a dock icon */
const SHORT: Partial<Record<string, string>> = { layouts: "Layouts", backgrounds: "Backdrop", palettes: "Colours", templates: "Templates" };
