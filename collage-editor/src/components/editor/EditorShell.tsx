"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import StageChrome from "./StageChrome";
import SlideStrip from "./SlideStrip";
import useShortcuts from "./Shortcuts";
import LeftSidebar from "@/components/panels/LeftSidebar";
import Workspace from "@/components/canvas/Workspace";
import PropertiesPanel from "@/components/props/PropertiesPanel";
import Toast from "@/components/ui/Toast";
import ImportDialog from "@/components/dialogs/ImportDialog";
import NewProjectDialog from "@/components/dialogs/NewProjectDialog";
import ProjectsDialog from "@/components/dialogs/ProjectsDialog";
import ShortcutsDialog from "@/components/dialogs/ShortcutsDialog";
import PreviewDialog from "@/components/dialogs/PreviewDialog";
import ExportDialog from "@/components/dialogs/ExportDialog";

export default function EditorShell() {
  const ready = useStore((s) => s.ready);
  const ui = useStore((s) => s.ui);
  useShortcuts();

  useEffect(() => {
    void useStore.getState().init();
    // on small windows the properties card starts closed so the canvas keeps room; the top-bar toggle opens it
    if (window.innerWidth < 1500) useStore.getState().setUI({ rightOpen: false });
  }, []);

  // theme + accent are CSS variables, so every control follows them
  useEffect(() => {
    document.documentElement.dataset.theme = ui.theme;
    document.documentElement.style.setProperty("--accent", ui.accent);
  }, [ui.theme, ui.accent]);

  // paste images/videos from the clipboard straight into the library
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
      if (!files.length) return;
      e.preventDefault();
      const st = useStore.getState();
      if (files.length === 1) void st.importMedia(files).then((a) => a[0] && st.addMediaToCanvas(a[0]));
      else st.setUI({ importOpen: true, importQueue: files });
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // warn before closing while the last change is still being written
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      const s = useStore.getState().saveStatus;
      if (s === "unsaved" || s === "saving") { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  if (!ready) return <div className="grid h-screen place-items-center bg-bg text-sm text-mute" data-testid="loading">Loading editor…</div>;

  return (
    <div className="flex h-screen min-h-0 gap-4 bg-bg p-4 text-ink" data-testid="editor-root">
      <LeftSidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[32px] bg-stage ring-1 ring-line/70">
          <Workspace />
          <StageChrome />
        </div>
        <SlideStrip />
      </div>
      {ui.rightOpen && <PropertiesPanel />}
      <Toast />
      {ui.importOpen && <ImportDialog />}
      {ui.newProjectOpen && <NewProjectDialog />}
      {ui.projectsOpen && <ProjectsDialog />}
      {ui.shortcutsOpen && <ShortcutsDialog />}
      {ui.previewOpen && <PreviewDialog />}
      {ui.exportOpen && <ExportDialog />}
    </div>
  );
}
