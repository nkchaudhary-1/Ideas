"use client";
import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Toast() {
  const t = useStore((s) => s.ui.toast);
  const set = useStore((s) => s.setUI);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => set({ toast: null }), t.kind === "error" ? 9000 : 3200);
    return () => clearTimeout(h);
  }, [t, set]);
  if (!t) return null;
  const Icon = t.kind === "error" ? AlertTriangle : t.kind === "ok" ? CheckCircle2 : Info;
  return (
    <div role="status" aria-live="polite" data-testid="toast" className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex justify-center px-6">
      <div data-surface className={`pointer-events-auto flex max-w-xl items-start gap-3 rounded-card border px-4 py-3 text-sm shadow-float ${t.kind === "error" ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-line bg-raised text-ink"}`}>
        <Icon size={16} className={`mt-0.5 shrink-0 ${t.kind === "error" ? "text-red-300" : t.kind === "ok" ? "text-ink" : "text-mute"}`} />
        <div className="whitespace-pre-line leading-snug">{t.text}</div>
        <button type="button" aria-label="Dismiss" onClick={() => set({ toast: null })} className="-my-1 -mr-2 ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute hover:bg-ink/[0.07] hover:text-ink"><X size={14} /></button>
      </div>
    </div>
  );
}
