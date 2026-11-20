"use client";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, width = 560, footer, testId, bare }: { title?: string; onClose: () => void; children: ReactNode; width?: number; footer?: ReactNode; testId?: string; bare?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} data-testid={testId}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ width }} className="flex max-h-[92vh] max-w-full flex-col overflow-hidden rounded-[28px] bg-panel shadow-float">
        {!bare && (
          <div className="flex h-20 shrink-0 items-center justify-between px-8">
            <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-field hover:text-ink"><X size={16} /></button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex shrink-0 items-center justify-end gap-3 px-8 py-6">{footer}</div>}
      </div>
    </div>
  );
}
