"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Pos = { left: number; top?: number; bottom?: number; maxH: number };

/**
 * An anchored menu. The panel is rendered in a portal with fixed positioning, so no scrolling or
 * overflow-hidden ancestor (the canvas card, the slide strip) can ever clip it. Closes on outside
 * click, Escape, or when the window changes size.
 */
export default function Popover({ trigger, children, placement = "bottom", align = "center", width = 320, className = "", testId }: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  placement?: "bottom" | "top";
  align?: "left" | "center" | "right";
  width?: number;
  className?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !anchor.current) { setPos(null); return; }
    const r = anchor.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(width, vw - 32);
    let left = align === "left" ? r.left : align === "right" ? r.right - w : r.left + r.width / 2 - w / 2;
    left = Math.max(16, Math.min(left, vw - w - 16));
    // open on the side that has room: the asked-for side if it fits a normal menu, else whichever side is roomier (never off-screen)
    const below = vh - r.bottom - 28, above = r.top - 28;
    const side = placement === "bottom" ? (below >= 300 || below >= above ? "bottom" : "top") : (above >= 300 || above >= below ? "top" : "bottom");
    setPos(side === "bottom"
      ? { left, top: r.bottom + 12, maxH: Math.max(120, below) }
      : { left, bottom: vh - r.top + 12, maxH: Math.max(120, above) });
  }, [open, width, align, placement]);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!anchor.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    const close = () => setOpen(false);
    window.addEventListener("mousedown", down);
    window.addEventListener("keydown", key, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("mousedown", down); window.removeEventListener("keydown", key, true); window.removeEventListener("resize", close); };
  }, [open]);

  return (
    <div ref={anchor} className="relative">
      {trigger(open, () => setOpen((o) => !o))}
      {open && pos && typeof document !== "undefined" && createPortal(
        <div ref={panel} data-testid={testId} style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, width: Math.min(width, window.innerWidth - 32), maxHeight: pos.maxH }}
          className={`pop card z-[60] overflow-y-auto p-6 shadow-float ${className}`}>
          {children(() => setOpen(false))}
        </div>,
        document.body,
      )}
    </div>
  );
}
