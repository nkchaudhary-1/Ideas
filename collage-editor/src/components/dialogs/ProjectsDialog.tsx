"use client";
import { useEffect, useState } from "react";
import { Copy, FilePlus2, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Empty } from "@/components/ui/controls";
import Modal from "@/components/ui/Modal";

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
        <ul className="grid grid-cols-2 gap-3 p-4" data-testid="project-list">
          {list.map((p) => (
            <li key={p.id} className={`group overflow-hidden rounded-lg border ${p.id === currentId ? "border-accent/60" : "border-line"} bg-panel2`}>
              <button type="button" className="block w-full text-left" onClick={() => st().openProject(p.id)} data-testid="project-open">
                <div className="flex h-32 items-center justify-center bg-stage">
                  {p.thumb ? <img src={p.thumb} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-faint">{p.ratio}</span>}
                </div>
                <div className="px-3 pt-2">
                  <div className="truncate text-sm font-medium">{p.name}{p.id === currentId && <span className="ml-1.5 text-xs font-normal text-accent">open</span>}</div>
                  <div className="text-xs text-mute">{p.kind} · {p.ratio} · {p.slideCount} slide{p.slideCount === 1 ? "" : "s"} · {new Date(p.updatedAt).toLocaleDateString()}</div>
                </div>
              </button>
              <div className="flex justify-end gap-1 p-2">
                <button type="button" aria-label="Duplicate project" title="Duplicate" onClick={() => st().duplicateProject(p.id)} className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-ink/10 hover:text-ink"><Copy size={13} /></button>
                {confirm === p.id ? (
                  <button type="button" className="rounded bg-red-500/20 px-2 text-xs text-red-200" onClick={() => { void st().deleteProject(p.id); setConfirm(null); }}>Delete for good?</button>
                ) : (
                  <button type="button" aria-label="Delete project" title="Delete" onClick={() => setConfirm(p.id)} className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-red-500/20 hover:text-red-300"><Trash2 size={13} /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
