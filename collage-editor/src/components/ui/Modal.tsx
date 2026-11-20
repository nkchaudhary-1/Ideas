"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, width = 560, footer, testId, bare }: { title?: string; onClose: () => void; children: ReactNode; width?: number; footer?: ReactNode; testId?: string; bare?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose]);
  // keyboard users: focus moves into the dialog, Tab stays inside it, and focus returns to where it was on close
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const el = box.current;
    const focusable = () => [...(el?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])].filter((n) => n.offsetParent !== null);
    if (el && !el.contains(document.activeElement)) (focusable()[0] ?? el).focus({ preventScroll: true });
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = focusable();
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    el?.addEventListener("keydown", trap);
    return () => { el?.removeEventListener("keydown", trap); back?.focus?.({ preventScroll: true }); };
  }, []);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 p-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} data-testid={testId}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} style={{ width }} className="sheet-in flex max-h-[92dvh] max-w-full flex-col overflow-hidden rounded-big bg-panel shadow-float outline-none sm:animate-none">
        {!bare && (
          <div className="flex h-16 shrink-0 items-center justify-between px-6 sm:h-20 sm:px-8">
            <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-mute hover:bg-field hover:text-ink"><X size={16} /></button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 px-6 py-4 sm:px-8 sm:py-6">{footer}</div>}
      </div>
    </div>
  );
}
