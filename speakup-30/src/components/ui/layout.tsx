import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "./controls";

/** Cards are 24px (32px on very large screens) with a 32px gutter. Use them sparingly. */
export function Card({ children, className, as: Tag = "section", ...p }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cx("rounded-card bg-panel border border-line p-8", className)} {...p}>
      {children}
    </Tag>
  );
}

export function PageHeader({ eyebrow, title, intro, actions, compact }: { eyebrow?: string; title: string; intro?: string; actions?: ReactNode; compact?: boolean }) {
  return (
    <header className={cx(compact ? "mb-6" : "mb-10", "flex flex-wrap items-end justify-between gap-x-6 gap-y-4")}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="text-sm text-mute mb-2">{eyebrow}</p>}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">{title}</h1>
        {intro && <p className="mt-3 text-base text-mute">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function ProgressBar({ value, className, label }: { value: number; className?: string; label?: string }) {
  const v = Math.min(1, Math.max(0, value));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} className={cx("h-1 rounded-full bg-line overflow-hidden", className)}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${v * 100}%` }} />
    </div>
  );
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div>
      <p className="text-sm text-mute">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tnum text-ink">{value}</p>
      {note && <p className="mt-1 text-sm text-mute">{note}</p>}
    </div>
  );
}

export function Disclosure({ title, meta, children, defaultOpen = false }: { title: string; meta?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 py-4 min-h-11 text-left">
        <span className="min-w-0 truncate text-base text-ink" title={title}>{title}</span>
        <span className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm text-mute">
          {meta}
          <ChevronDown size={18} className={cx("transition-transform duration-200", open && "rotate-180")} />
        </span>
      </button>
      {open && <div className="pb-6 animate-fade">{children}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="text-lg font-medium text-ink">{title}</p>
      <p className="mt-2 text-base text-mute max-w-md mx-auto">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/** A visible recording indicator. Recording is never hidden. */
export function RecDot({ className }: { className?: string }) {
  return <span aria-hidden className={cx("inline-block h-2 w-2 rounded-full bg-rec animate-pulse2", className)} />;
}
