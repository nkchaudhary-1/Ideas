"use client";
import { useRef } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { IconButton } from "@/components/ui/controls";
import { ALL_TOOLS, PanelBody } from "@/components/panels/LeftSidebar";
import PropertiesPanel from "@/components/props/PropertiesPanel";

/**
 * Phones: tool panels and properties open as a sheet above the dock instead of beside the canvas.
 * The canvas stays visible above it. Drag the handle up for a tall sheet, down to shrink or dismiss it.
 */
export default function BottomSheet() {
  const sheet = useStore((s) => s.ui.sheet);
  const size = useStore((s) => s.ui.sheetSize);
  const panel = useStore((s) => s.ui.leftPanel);
  const set = useStore((s) => s.setUI);
  const start = useRef<{ y: number; moved: boolean } | null>(null);
  if (!sheet) return null;
  const tool = ALL_TOOLS.find((t) => t.id === panel);
  const title = sheet === "props" ? "Edit" : tool?.label ?? "";
  const full = size === "full";
  const close = () => set({ sheet: null });
  const grow = () => set({ sheetSize: full ? "half" : "full" });

  const down = (e: React.PointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = { y: e.clientY, moved: false }; };
  const move = (e: React.PointerEvent) => { if (start.current && Math.abs(e.clientY - start.current.y) > 6) start.current.moved = true; };
  const up = (e: React.PointerEvent) => {
    const s = start.current; start.current = null;
    if (!s) return;
    const dy = e.clientY - s.y;
    if (!s.moved) { grow(); return; }
    if (dy < -24) set({ sheetSize: "full" });
    else if (dy > 24) { if (full) set({ sheetSize: "half" }); else close(); }
  };

  return (
    <section className="card pop sheet-in relative flex shrink-0 flex-col overflow-hidden" style={{ height: full ? "max(38dvh, min(76dvh, 100dvh - 384px))" : "38dvh" }}
      data-testid={sheet === "tools" ? "left-panel" : "sheet-props"} aria-label={title}>
      <div className="relative flex h-8 shrink-0 touch-none cursor-grab items-center justify-center" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { start.current = null; }} data-testid="sheet-handle">
        <span className="h-1 w-10 rounded-full bg-faint/60" />
      </div>
      <div className="absolute right-2 top-1 z-10 flex items-center gap-1">
        <IconButton icon={full ? <ChevronDown size={16} /> : <ChevronUp size={16} />} label={full ? "Make the panel shorter" : "Make the panel taller"} onClick={grow} testId="sheet-grow" />
        <IconButton icon={<X size={16} />} label="Close panel" onClick={close} testId="sheet-close" />
      </div>
      {sheet === "tools" && (
        <h2 className="flex h-12 shrink-0 items-center px-8 text-base font-extrabold tracking-tight">{title}</h2>
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        {sheet === "tools" ? <div className="min-h-0 flex-1"><PanelBody panel={panel} /></div> : <PropertiesPanel sheet />}
      </div>
    </section>
  );
}
