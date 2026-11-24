import { ChevronDown } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

// Controls are 36px tall (44px on touch) and capsules, per the repo's design rules.
const base =
  "inline-flex items-center justify-center gap-2 h-9 coarse:h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap select-none transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-onaccent hover:brightness-95 active:brightness-90",
  secondary: "bg-panel2 text-ink hover:bg-raised border border-line",
  ghost: "text-mute hover:text-ink hover:bg-panel2",
  danger: "bg-rec/10 text-rec hover:bg-rec/20",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "secondary", icon, className, children, type = "button", ...p }, ref) {
  return (
    <button ref={ref} type={type} className={cx(base, variants[variant], className)} {...p}>
      {icon}
      {children}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ink";
  active?: boolean;
}
const iconVariants = {
  primary: "bg-accent text-onaccent hover:brightness-95",
  secondary: "bg-panel2 text-ink hover:bg-raised border border-line",
  ghost: "text-mute hover:text-ink hover:bg-panel2",
  danger: "bg-rec text-white hover:brightness-95",
  ink: "bg-ink text-bg hover:opacity-90",
};
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, variant = "ghost", active, className, children, type = "button", ...p }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cx(
        "inline-flex items-center justify-center h-9 w-9 coarse:h-11 coarse:w-11 rounded-full shrink-0 transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none",
        iconVariants[variant],
        active && "bg-panel2 text-accentfg",
        className,
      )}
      {...p}
    >
      {children}
    </button>
  );
});

/** A toggle chip. 36px tall (44px on touch). */
export function Chip({ active, children, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        "inline-flex items-center gap-2 h-9 coarse:h-11 px-4 rounded-full text-sm whitespace-nowrap border transition-colors duration-150",
        active ? "bg-ink text-bg border-ink" : "bg-transparent text-mute border-line hover:text-ink hover:border-mute",
        className,
      )}
      {...p}
    >
      {children}
    </button>
  );
}

/** A small non-interactive label. */
export function Badge({ children, tone = "mute", className }: { children: ReactNode; tone?: "mute" | "accent" | "blue" | "rec"; className?: string }) {
  const tones = {
    mute: "bg-panel2 text-mute",
    accent: "bg-accent/15 text-accentfg",
    blue: "bg-blue/15 text-blue",
    rec: "bg-rec/15 text-rec",
  };
  return <span className={cx("inline-flex items-center gap-1 h-6 px-3 rounded-full text-xs font-medium whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("inline-flex w-full p-0.5 rounded-full bg-panel2 border border-line", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "flex-1 h-8 coarse:h-10 px-3 rounded-full text-sm whitespace-nowrap transition-colors duration-150",
            value === o.value ? "bg-ink text-bg font-medium" : "text-mute hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, hint, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; id?: string }) {
  return (
    <div className="flex items-start gap-3 min-h-9">
      <button id={id} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="flex h-9 w-12 shrink-0 items-center justify-center coarse:h-11">
        <span className={cx("relative block h-6 w-10 rounded-full transition-colors duration-150", checked ? "bg-accent" : "bg-raised border border-line")}>
          <span className={cx("absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform duration-150", checked ? "translate-x-4 bg-onaccent" : "bg-mute")} />
        </span>
      </button>
      <label htmlFor={id} className="cursor-pointer py-2">
        <span className="block text-base text-ink">{label}</span>
        {hint && <span className="block text-sm text-mute">{hint}</span>}
      </label>
    </div>
  );
}

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Field({ className, ...p }, ref) {
  return (
    <input
      ref={ref}
      className={cx(
        "h-9 coarse:h-11 w-full rounded-full bg-panel2 border border-line px-4 text-sm text-ink placeholder:text-faint focus:border-accentfg focus:outline-none",
        className,
      )}
      {...p}
    />
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...p }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx("w-full rounded bg-panel2 border border-line p-4 text-base text-ink placeholder:text-faint focus:border-accentfg focus:outline-none resize-y select-text", className)}
      {...p}
    />
  );
});

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full">
      <select
        className={cx("h-9 coarse:h-11 w-full appearance-none rounded-full bg-panel2 border border-line pl-4 pr-10 text-sm text-ink focus:border-accentfg focus:outline-none", className)}
        {...p}
      >
        {children}
      </select>
      <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mute" />
    </div>
  );
}
