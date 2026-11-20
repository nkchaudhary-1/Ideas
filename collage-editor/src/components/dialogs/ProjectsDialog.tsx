"use client";
import { useEffect, useState } from "react";
import { Copy, FilePlus2, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Empty, IconButton } from "@/components/ui/controls";
import Modal from "@/components/ui/Modal";

const KIND: Record<string, string> = { single: "Single", collage: "Collage", carousel: "Carousel", story: "Story", edit: "Photo & video edit" };

export default function ProjectsDialog() {
  const st = useStore.getState;
  const projects = useStore((s) => s.projects);
  const currentId = useStore((s) => s.project.id);
  const set = useStore((s) => s.setUI);
  const [confirm, setConfirm] = useState<string | null>(null);
  useEffect(() => { void st().refreshProjects(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const list = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <Modal title="Projects" onClose={() => set({ projectsOpen: false })} width={640} testId="projects-dialog"
      footer={<Button variant="primary" onClick={() => set({ projectsOpen: false, newProjectOpen: true })}><FilePlus2 size={13} /> New project</Button>}>
      {list.length === 0 ? <Empty>No saved projects yet. Everything you make is saved automatically on this device.</Empty> : (
        <ul className="grid grid-cols-2 gap-5 px-8 pb-8 pt-2" data-testid="project-list">
          {list.map((p) => (
            <li key={p.id} className={`group overflow-hidden rounded bg-panel2 ${p.id === currentId ? "ring-2 ring-ink/40" : ""}`}>
              <button type="button" className="block w-full text-left" onClick={() => st().openProject(p.id)} data-testid="project-open">
                <div className="flex h-32 items-center justify-center bg-stage">
                  {p.thumb ? <img src={p.thumb} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-faint">{p.ratio}</span>}
                </div>
                <div className="space-y-1 px-5 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold" title={p.name}>{p.name}</span>
                    {p.id === currentId && <span className="shrink-0 rounded-full bg-ink/10 px-2 py-1 text-2xs font-semibold text-ink">Open</span>}
                  </div>
                  <div className="text-xs text-mute">{KIND[p.kind] ?? p.kind} · {p.ratio} · {p.slideCount} {p.kind === "edit" ? (p.slideCount === 1 ? "item" : "items") : p.slideCount === 1 ? "slide" : "slides"} · {new Date(p.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              </button>
              <div className="flex h-12 items-center justify-end gap-1 px-3">
                <IconButton icon={<Copy size={14} />} label="Duplicate project" onClick={() => st().duplicateProject(p.id)} />
                {confirm === p.id ? (
                  <Button variant="danger" onClick={() => { void st().deleteProject(p.id); setConfirm(null); }}>Delete for good?</Button>
                ) : (
                  <IconButton icon={<Trash2 size={14} />} label="Delete project" onClick={() => setConfirm(p.id)} className="hover:!bg-red-500/15 hover:!text-red-500" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
