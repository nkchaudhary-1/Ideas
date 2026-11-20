"use client";
import dynamic from "next/dynamic";

// Konva needs the browser; the whole editor is client-only.
const EditorShell = dynamic(() => import("@/components/editor/EditorShell"), {
  ssr: false,
  loading: () => <div className="h-[100dvh] w-screen grid place-items-center text-mute text-sm">Loading editor…</div>,
});

export default function Page() {
  return <EditorShell />;
}
