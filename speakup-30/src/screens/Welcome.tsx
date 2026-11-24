import { useRef, useState } from "react";
import { Button } from "../components/ui/controls";
import { Logo } from "../components/Shell";
import { go } from "../lib/router";
import { useStore } from "../lib/store";
import { parseImport } from "../lib/storage";

export function Welcome() {
  const welcome = useStore((s) => s.welcome);
  const start = useStore((s) => s.startSession);
  const importData = useStore((s) => s.importData);
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);

  const begin = () => {
    welcome();
    start(1);
    go("/practice/1/run");
  };
  const restore = async (f: File | undefined) => {
    if (!f) return;
    const r = parseImport(await f.text());
    if (!r.ok) return setErr(r.error);
    importData(r.data);
    go("/");
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16 animate-rise" style={{ paddingTop: "max(4rem, env(safe-area-inset-top))" }}>
      <Logo size={40} />
      <h1 className="mt-10 text-4xl sm:text-5xl font-semibold tracking-tight text-ink">Welcome to SpeakUp 30.</h1>
      <p className="mt-4 text-2xl text-ink">30 days to become a more confident communicator.</p>
      <div className="mt-10 space-y-2 text-xl text-mute">
        <p>This isn't about perfect English.</p>
        <p>It's about expressing your thoughts clearly, confidently and naturally.</p>
      </div>
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Button variant="primary" onClick={begin} data-testid="start-day-1" className="!h-12 px-8 text-base coarse:!h-12">
          Start Day 1
        </Button>
        <Button variant="ghost" onClick={() => file.current?.click()}>
          Restore a backup
        </Button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" aria-label="Choose a backup file" onChange={(e) => restore(e.target.files?.[0])} />
      </div>
      {err && (
        <p role="alert" className="mt-6 rounded bg-rec/10 p-4 text-sm text-ink">
          {err}
        </p>
      )}
      <p className="mt-16 text-sm text-mute">A private programme for one person. Your recordings, transcripts and progress stay on this device. Twenty minutes a day, growing to thirty.</p>
    </main>
  );
}
