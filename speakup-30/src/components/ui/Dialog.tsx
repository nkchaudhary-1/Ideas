import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton, cx } from "./controls";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Always dock to the bottom edge, even on a wide screen. */
  sheet?: boolean;
  wide?: boolean;
}

/**
 * Dialogs are 32px corners. On phones they dock to the bottom edge with an 8px margin and a slide-up entrance, with a
 * 24px gutter (32 - 24 = the 8px radius floor). From 640px up the gutter is 32px.
 */
export function Dialog({ open, onClose, title, children, sheet, wide }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement;
    document.body.style.overflow = "hidden";
    const first = ref.current?.querySelector<HTMLElement>("input,textarea,select,button:not([data-close])");
    (first ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) (z.focus(), e.preventDefault());
        else if (!e.shiftKey && document.activeElement === z) (a.focus(), e.preventDefault());
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = "";
      (prev.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  // Portalled to the body so no animated or transformed ancestor can trap it under the navigation.
  return createPortal(
    <div className="fixed inset-0 z-[60] animate-fade" role="presentation">
      <div className="absolute inset-0 bg-black/60" onPointerDown={onClose} />
      <div className={cx("absolute inset-x-0 bottom-0 flex justify-center p-2", !sheet && "sm:inset-0 sm:items-center sm:p-8")} style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cx(
            "relative w-full max-h-[calc(100dvh-16px)] overflow-y-auto rounded-big bg-panel border border-line shadow-pop p-6 sm:p-8 animate-slideup outline-none",
            !sheet && "sm:animate-rise",
            wide ? "max-w-2xl" : "max-w-lg",
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
            <IconButton label="Close" data-close onClick={onClose} className="-mr-2 -mt-1">
              <X size={20} />
            </IconButton>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
