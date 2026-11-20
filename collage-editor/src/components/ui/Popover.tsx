"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** A small anchored menu: closes on outside click or Escape. `trigger` gets the open state and a toggle. */
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
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    window.addEventListener("mousedown", down);
    window.addEventListener("keydown", key, true);
    return () => { window.removeEventListener("mousedown", down); window.removeEventListener("keydown", key, true); };
  }, [open]);
  const pos = `${placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"} ${align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"}`;
  return (
    <div ref={ref} className="relative">
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div data-testid={testId} style={{ width }} className={`pop card pointer-events-auto absolute z-50 max-h-[70vh] overflow-y-auto p-3 shadow-float ${pos} ${className}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
