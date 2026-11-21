"use client";
import { useEffect, useState } from "react";
import { Copy, LayoutGrid, Moon, SlidersHorizontal, Sun, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { projectSummary } from "@/lib/formats";
import { agoLabel } from "@/lib/util";
import type { ProjectMeta } from "@/lib/types";
import { Button, IconButton } from "@/components/ui/controls";
import Logo from "@/components/ui/Logo";
import Toast from "@/components/ui/Toast";

/** the two ways to start something new */
const STARTS = [
  { id: "create", intent: "collage", title: "Create", blurb: "Collages, carousels, panoramas, stories and single posts.", Icon: LayoutGrid },
  { id: "edit", intent: "edit", title: "Edit photos & videos", blurb: "Colour, light, looks and crops, one at a time or in a batch.", Icon: SlidersHorizontal },
] as const;

function ProjectCard({ p }: { p: ProjectMeta }) {
  const st = useStore.getState;
  const [confirm, setConfirm] = useState(false);
  const summary = projectSummary(p);
  return (
    <li className="flex flex-col rounded-card bg-panel p-3 ring-1 ring-line/70" data-testid="home-project-card">
      <button type="button" onClick={() => void st().openProject(p.id)} data-testid="home-project" aria-label={`Open ${p.name}`}
        className="block w-full rounded-in-12 text-left transition active:scale-[0.99]">
        <span className="flex h-40 items-center justify-center overflow-hidden rounded-in-12 bg-stage">
          {p.thumb ? <img src={p.thumb} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-faint">{p.size}</span>}
        </span>
        <span className="mt-3 block space-y-1 px-1">
          <span className="block truncate text-sm font-semibold" title={p.name}>{p.name}</span>
          <span className="block truncate text-xs text-mute" title={summary}>{summary}</span>
          <span className="block truncate text-2xs text-faint">Edited {agoLabel(p.updatedAt)}</span>
        </span>
      </button>
      <div className="mt-1 flex min-h-12 flex-wrap items-center justify-end gap-1">
        {confirm ? (
          <>
            <Button variant="danger" onClick={() => { void st().deleteProject(p.id); setConfirm(false); }} testId="home-delete-confirm">Delete for good?</Button>
            <IconButton icon={<X size={14} />} label="Keep project" onClick={() => setConfirm(false)} />
          </>
        ) : (
          <>
            <IconButton icon={<Copy size={14} />} label="Duplicate project" onClick={() => void st().duplicateProject(p.id)} testId="home-duplicate" />
            <IconButton icon={<Trash2 size={14} />} label="Delete project" onClick={() => setConfirm(true)} testId="home-delete" className="hover:!bg-red-500/15 hover:!text-red-500" />
          </>
        )}
      </div>
    </li>
  );
}

/** The front page: start something new, or open a saved project. The editor only opens once one of those is chosen. */
export default function Home() {
  const projects = useStore((s) => s.projects);
  const dark = useStore((s) => s.ui.theme === "dark");
  useEffect(() => { void useStore.getState().refreshProjects(); }, []);

  return (
    <div className="relative h-[100dvh] bg-bg text-ink">
      <div className="h-full overflow-y-auto" data-testid="home">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
          <header className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-pill text-pillink"><Logo size={22} /></span>
              <span className="text-sm font-extrabold tracking-tight">Collage Studio</span>
            </div>
            <IconButton icon={dark ? <Sun size={16} /> : <Moon size={16} />} label={dark ? "Light theme" : "Dark theme"} onClick={() => useStore.getState().setTheme(dark ? "light" : "dark")} testId="home-theme" />
          </header>

          <section className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">What do you want to make?</h1>
            <p className="text-sm leading-6 text-mute">Start something new or open a saved project.</p>
          </section>

          <section aria-label="Start something new" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {STARTS.map(({ id, intent, title, blurb, Icon }) => (
              <button key={id} type="button" data-testid={`home-${id}`} onClick={() => useStore.getState().openNewProject(intent)}
                className="flex items-center gap-4 rounded-card bg-panel px-8 py-6 text-left ring-1 ring-line/70 transition hover:ring-ink/30 active:scale-[0.99] sm:flex-col sm:items-start sm:py-8">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pill text-pillink"><Icon size={22} /></span>
                <span className="min-w-0">
                  <span className="block text-lg font-extrabold tracking-tight">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-mute">{blurb}</span>
                </span>
              </button>
            ))}
          </section>

          <section aria-labelledby="home-projects-title" className="space-y-4">
            <div className="flex items-baseline gap-3">
              <h2 id="home-projects-title" className="text-base font-extrabold tracking-tight">Your projects</h2>
              {projects.length > 0 && <span className="text-xs text-mute" data-testid="home-count">{projects.length}</span>}
            </div>
            {projects.length === 0 ? (
              <p className="rounded-card border-2 border-dotted border-faint/60 px-8 py-10 text-center text-xs leading-6 text-mute" data-testid="home-empty">
                Nothing here yet. Everything you make is saved on this device and shows up here.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" data-testid="home-projects">
                {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
              </ul>
            )}
          </section>
        </div>
      </div>
      <Toast />
    </div>
  );
}
