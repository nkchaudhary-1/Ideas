"use client";
import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { ALL_TOOLS } from "@/components/panels/LeftSidebar";

/** one labelled button in the bottom bar: an icon over a short name. The same shape for tools and for what you can do to the selection. */
export function DockButton({ icon, label, on, onClick, testId, badge, danger, hold }: {
  icon: ReactNode; label: string; on?: boolean; onClick?: () => void; testId?: string; badge?: boolean; danger?: boolean;
  /** press and hold instead of tap (Compare) */
  hold?: { down: () => void; up: () => void };
}) {
  return (
    <button type="button" aria-pressed={on} aria-label={label} data-testid={testId} onClick={hold ? undefined : onClick}
      onPointerDown={hold ? (e) => { e.currentTarget.setPointerCapture(e.pointerId); hold.down(); } : undefined}
      onPointerUp={hold?.up} onPointerCancel={hold?.up}
      className={`relative flex h-14 min-w-16 shrink-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-full px-2 text-2xs font-semibold transition active:scale-95 ${on ? "grad-accent text-white shadow-card" : danger ? "text-red-500" : "text-mute"}`}>
      {icon}
      <span className="max-w-full truncate">{label}</span>
      {badge && <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-bg" />}
    </button>
  );
}

/** the row along the bottom of the phone layout: flat, one line, scrolls sideways when it has more than fits */
export function DockBar({ children, label, testId }: { children: ReactNode; label: string; testId: string }) {
  return (
    <nav className="no-scrollbar flex shrink-0 items-stretch gap-1 overflow-x-auto [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)]" aria-label={label} data-testid={testId}>{children}</nav>
  );
}

/** Phones, nothing selected: the tool rail becomes a row along the bottom. Tap a tool to open its sheet, tap it again to close it. */
export default function Dock() {
  const kind = useStore((s) => s.project.kind);
  const sheet = useStore((s) => s.ui.sheet);
  const panel = useStore((s) => s.ui.leftPanel);
  const hasSelection = useStore((s) => s.selection.length > 0);
  const set = useStore((s) => s.setUI);
  const edit = kind === "edit";
  const tools = edit ? ALL_TOOLS.filter((t) => t.id === "uploads") : ALL_TOOLS;
  return (
    <DockBar label="Tools" testId="dock">
      <DockButton icon={<SlidersHorizontal size={20} />} label={edit ? "Adjust" : "Edit"} on={sheet === "props"} testId="dock-props" badge={!edit && hasSelection && sheet !== "props"}
        onClick={() => set({ sheet: sheet === "props" ? null : "props" })} />
      <span className="my-3 w-px shrink-0 bg-line" />
      {tools.map((t) => {
        const on = sheet === "tools" && panel === t.id;
        return <DockButton key={t.id} icon={t.icon} label={t.short} on={on} testId={`rail-${t.id}`} onClick={() => set(on ? { sheet: null } : { leftPanel: t.id, sheet: "tools" })} />;
      })}
    </DockBar>
  );
}
