"use client";
import { Suspense, lazy, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import StageChrome from "./StageChrome";
import SlideStrip from "./SlideStrip";
import EditStrip from "./EditStrip";
import EditEmpty from "./EditEmpty";
import { EmptyCanvas } from "./ModeGuide";
import useShortcuts from "./Shortcuts";
import LeftSidebar from "@/components/panels/LeftSidebar";
import Workspace from "@/components/canvas/Workspace";
import PropertiesPanel from "@/components/props/PropertiesPanel";
import Toast from "@/components/ui/Toast";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import MediaPicker from "@/components/canvas/MediaPicker";
import NewProjectDialog from "@/components/dialogs/NewProjectDialog";
import CompactShell from "./CompactShell";
import { useCompact } from "@/lib/use-media";

// Dialogs the user opens on demand load as their own chunks, so the editor starts faster (the video encoder lives in Export).
const ImportDialog = lazy(() => import("@/components/dialogs/ImportDialog"));
const ProjectsDialog = lazy(() => import("@/components/dialogs/ProjectsDialog"));
const ShortcutsDialog = lazy(() => import("@/components/dialogs/ShortcutsDialog"));
const PreviewDialog = lazy(() => import("@/components/dialogs/PreviewDialog"));
const ExportDialog = lazy(() => import("@/components/dialogs/ExportDialog"));

export default function EditorShell() {
  return <ErrorBoundary><Shell /></ErrorBoundary>;
}

function Shell() {
  const ready = useStore((s) => s.ready);
  // one narrow subscription each: panning and zooming change `ui` constantly and must not re-render the whole shell
  const kind = useStore((s) => s.project.kind);
  const theme = useStore((s) => s.ui.theme);
  const accent = useStore((s) => s.ui.accent);
  const rightOpen = useStore((s) => s.ui.rightOpen);
  const importOpen = useStore((s) => s.ui.importOpen);
  const newProjectOpen = useStore((s) => s.ui.newProjectOpen);
  const projectsOpen = useStore((s) => s.ui.projectsOpen);
  const shortcutsOpen = useStore((s) => s.ui.shortcutsOpen);
  const previewOpen = useStore((s) => s.ui.previewOpen);
  const exportOpen = useStore((s) => s.ui.exportOpen);
  const compact = useCompact();
  const projectId = useStore((s) => s.project.id);
  useShortcuts();

  // Editing photos and videos IS the properties card (filters, adjustments, crop). On a smaller window it starts shut like the other modes,
  // so open it whenever an Edit project opens; on a narrow window close the media panel to give the canvas its room back.
  const openedFor = useRef<string | null>(null);
  useEffect(() => {
    if (compact || kind !== "edit" || openedFor.current === projectId) return;
    openedFor.current = projectId;
    useStore.getState().setUI(window.innerWidth < 1500 ? { rightOpen: true, leftPanel: null } : { rightOpen: true });
  }, [compact, kind, projectId]);

  useEffect(() => {
    void useStore.getState().init();
    // on small windows the properties card starts closed so the canvas keeps room; the top-bar toggle opens it
    if (window.innerWidth < 1500) useStore.getState().setUI({ rightOpen: false });
  }, []);

  // theme + accent are CSS variables, so every control follows them
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--accent", accent);
    // the browser bar / status bar follows the app's ground colour
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#080808" : "#eaeaea");
  }, [theme, accent]);

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

  if (!ready) return <div className="grid h-[100dvh] place-items-center bg-bg text-sm text-mute" data-testid="loading">Loading editor…</div>;

  return (
    <>
      {compact ? (
        <CompactShell />
      ) : (
        <div className="flex h-[100dvh] min-h-0 gap-4 bg-bg p-4 text-ink" data-testid="editor-root">
          <LeftSidebar />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-big bg-stage ring-1 ring-line/70">
              <Workspace />
              <EditEmpty />
              <EmptyCanvas />
              <StageChrome />
              <Toast />
            </div>
            {kind === "edit" ? <EditStrip /> : <SlideStrip />}
          </div>
          {rightOpen && <PropertiesPanel />}
        </div>
      )}
      <MediaPicker />
      {newProjectOpen && <NewProjectDialog />}
      <Suspense fallback={null}>
        {importOpen && <ImportDialog />}
        {projectsOpen && <ProjectsDialog />}
        {shortcutsOpen && <ShortcutsDialog />}
        {previewOpen && <PreviewDialog />}
        {exportOpen && <ExportDialog />}
      </Suspense>
    </>
  );
}
