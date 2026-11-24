import { useState, type ReactNode } from "react";
import { AudioLines, CalendarDays, Home, LineChart, MessagesSquare, MoreHorizontal, ScrollText, Settings, Timer } from "lucide-react";
import { Dialog } from "./ui/Dialog";
import { cx } from "./ui/controls";
import { ProgressBar } from "./ui/layout";
import { href } from "../lib/router";
import { useStore } from "../lib/store";
import { currentDay, completedDays } from "../lib/stats";
import { PROGRAMME_DAYS } from "../content/curriculum";

const NAV = [
  { id: "", label: "Dashboard", short: "Dashboard", icon: Home },
  { id: "practice", label: "Daily practice", short: "Practice", icon: Timer },
  { id: "teleprompter", label: "Teleprompter", short: "Teleprompter", icon: ScrollText },
  { id: "challenge", label: "Interview challenge", short: "Challenge", icon: MessagesSquare },
  { id: "analysis", label: "Speaking analysis", short: "Analysis", icon: AudioLines },
  { id: "progress", label: "Progress & analytics", short: "Progress", icon: LineChart },
  { id: "curriculum", label: "30-day curriculum", short: "Curriculum", icon: CalendarDays },
  { id: "settings", label: "Settings", short: "Settings", icon: Settings },
] as const;
const PRIMARY = ["", "practice", "challenge", "progress"];

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="rgb(var(--c-panel))" />
      <g fill="rgb(var(--c-accent))">
        <rect x="14" y="26" width="6" height="12" rx="3" />
        <rect x="24" y="18" width="6" height="28" rx="3" />
        <rect x="34" y="12" width="6" height="40" rx="3" />
        <rect x="44" y="22" width="6" height="20" rx="3" />
      </g>
    </svg>
  );
}

export function Shell({ route, focus, children }: { route: string; focus: boolean; children: ReactNode }) {
  const [more, setMore] = useState(false);
  const data = useStore((s) => s.data);
  const toast = useStore((s) => s.toast);
  const saveFailed = useStore((s) => s.saveFailed);
  const day = currentDay(data);
  const done = completedDays(data).size;

  const banner = saveFailed && (
    <p role="alert" className="mx-auto mb-6 max-w-[960px] rounded-full bg-rec/10 px-5 py-3 text-sm text-ink">
      This browser could not save your progress. Export a backup in Settings so nothing is lost.
    </p>
  );
  const toastEl = toast && (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8">
      <p key={toast.id} className="animate-rise rounded-full bg-ink px-5 py-3 text-sm text-bg shadow-pop">
        {toast.text}
      </p>
    </div>
  );

  if (focus)
    return (
      <div className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">Skip to content</a>
        <main id="main" className="mx-auto max-w-[960px] px-4 sm:px-8 pt-4 pb-16" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
          {banner}
          {children}
        </main>
        {toastEl}
      </div>
    );

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-line px-4 py-8 lg:flex" aria-label="Main">
        <a href={href("/")} className="mb-10 flex items-center gap-3 px-3" aria-label="SpeakUp 30, dashboard">
          <Logo />
          <span className="text-lg font-semibold tracking-tight text-ink">SpeakUp 30</span>
        </a>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = route === n.id;
            return (
              <a
                key={n.id}
                href={href("/" + n.id)}
                aria-current={active ? "page" : undefined}
                className={cx("flex h-9 items-center gap-3 rounded-full px-4 text-sm transition-colors duration-150", active ? "bg-panel text-ink border border-line" : "text-mute hover:text-ink hover:bg-panel2 border border-transparent")}
              >
                <Icon size={18} aria-hidden />
                <span className="whitespace-nowrap">{n.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="mt-auto px-3">
          <p className="text-sm text-mute tnum">Day {day} of {PROGRAMME_DAYS}</p>
          <ProgressBar value={done / PROGRAMME_DAYS} className="mt-3" label="Programme progress" />
          <p className="mt-3 text-xs text-mute">Everything stays on this device.</p>
        </div>
      </aside>

      <main id="main" className="mx-auto max-w-[960px] px-4 sm:px-8 pt-8 pb-32 lg:pb-16 lg:pt-12" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
        {banner}
        <div key={route} className="animate-rise">
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur lg:hidden" aria-label="Main" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="mx-auto flex max-w-xl items-stretch justify-around px-2">
          {NAV.filter((n) => PRIMARY.includes(n.id)).map((n) => {
            const Icon = n.icon;
            const active = route === n.id;
            return (
              <li key={n.id} className="flex-1">
                <a href={href("/" + n.id)} aria-current={active ? "page" : undefined} className={cx("flex h-16 flex-col items-center justify-center gap-1 text-xs", active ? "text-ink" : "text-mute")}>
                  <Icon size={22} aria-hidden className={active ? "text-accentfg" : ""} />
                  <span>{n.short}</span>
                </a>
              </li>
            );
          })}
          <li className="flex-1">
            <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" className={cx("flex h-16 w-full flex-col items-center justify-center gap-1 text-xs", !PRIMARY.includes(route) ? "text-ink" : "text-mute")}>
              <MoreHorizontal size={22} aria-hidden className={!PRIMARY.includes(route) ? "text-accentfg" : ""} />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>
      <Dialog open={more} onClose={() => setMore(false)} title="More" sheet>
        <nav aria-label="More" className="flex flex-col gap-1">
          {NAV.filter((n) => !PRIMARY.includes(n.id)).map((n) => {
            const Icon = n.icon;
            return (
              <a key={n.id} href={href("/" + n.id)} onClick={() => setMore(false)} className="flex h-11 items-center gap-4 rounded-full px-4 text-base text-ink hover:bg-panel2">
                <Icon size={20} aria-hidden className="text-mute" /> {n.label}
              </a>
            );
          })}
        </nav>
      </Dialog>
      {toastEl}
    </div>
  );
}
