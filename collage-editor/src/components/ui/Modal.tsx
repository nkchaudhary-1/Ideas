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
      <div role="dialog" aria-modal="true" aria-label={title} style={{ width }} className="flex max-h-[92vh] max-w-full flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
        {!bare && (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
            <h2 className="text-[15px] font-medium">{title}</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="grid h-7 w-7 place-items-center rounded text-mute hover:bg-white/10 hover:text-ink"><X size={16} /></button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
