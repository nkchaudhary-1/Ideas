"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./controls";

/** If anything throws while rendering, show a calm recovery screen instead of a blank page. Projects autosave, so reloading is safe. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; copied: boolean }> {
  state = { error: null as Error | null, copied: false };

  static getDerivedStateFromError(error: Error) { return { error, copied: false }; }

  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Editor crashed:", error, info.componentStack); }

  render() {
    const { error, copied } = this.state;
    if (!error) return this.props.children;
    const details = `${error.name}: ${error.message}\n${(error.stack ?? "").split("\n").slice(0, 6).join("\n")}`;
    return (
      <div className="grid h-[100dvh] place-items-center bg-bg p-8 text-ink" role="alert">
        <div className="card w-full max-w-[480px] space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-lg font-extrabold tracking-tight">Something went wrong</h1>
            <p className="text-sm leading-6 text-mute">Your project is saved automatically on this device. Reload to pick up where you left off. If it keeps happening, copy the details below and share them.</p>
          </div>
          <pre className="max-h-32 overflow-auto rounded bg-field px-4 py-3 text-2xs leading-4 text-mute" data-testid="error-details">{details}</pre>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { void navigator.clipboard?.writeText(details).then(() => this.setState({ copied: true })); }}>{copied ? "Copied" : "Copy details"}</Button>
            <Button variant="primary" onClick={() => location.reload()} testId="error-reload">Reload editor</Button>
          </div>
        </div>
      </div>
    );
  }
}
