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
    <div role="status" aria-live="polite" data-testid="toast" className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex justify-center px-4">
      <div className={`pointer-events-auto flex max-w-xl items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-2xl ${t.kind === "error" ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-line bg-raised text-ink"}`}>
        <Icon size={16} className={`mt-0.5 shrink-0 ${t.kind === "error" ? "text-red-300" : t.kind === "ok" ? "text-accent" : "text-mute"}`} />
        <div className="whitespace-pre-line leading-snug">{t.text}</div>
        <button type="button" aria-label="Dismiss" onClick={() => set({ toast: null })} className="ml-1 mt-0.5 text-mute hover:text-ink"><X size={14} /></button>
      </div>
    </div>
  );
}
