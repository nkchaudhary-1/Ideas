import { useRef, useState, type ReactNode } from "react";
import { Download, Mic, Trash2, Upload } from "lucide-react";
import { Badge, Button, Field, Segmented, Select, Switch } from "../components/ui/controls";
import { Card, PageHeader } from "../components/ui/layout";
import { Dialog } from "../components/ui/Dialog";
import { useStore } from "../lib/store";
import { exportJSON, parseImport } from "../lib/storage";
import { useCapture } from "../lib/hooks";
import { supportsRecognition, supportsRecording } from "../lib/speech/capture";
import { DEFAULT_MODEL, testKey, AIError } from "../lib/ai";
import { dateKey } from "../lib/time";
import { DEFAULT_PROMPTER } from "../lib/types";

function Group({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="mt-12 first:mt-0" aria-label={title}>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
      {intro && <p className="mt-2 max-w-2xl text-base text-mute">{intro}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function MicTest() {
  const cap = useCapture();
  const on = cap.status === "recording";
  return (
    <div>
      <Button icon={<Mic size={16} />} onClick={() => (on ? void cap.stop() : void cap.start())} disabled={cap.status === "starting" || cap.status === "stopping"} data-testid="mic-test">
        {on ? "Stop the test" : "Test the microphone"}
      </Button>
      {on && (
        <div role="status" className="mt-3 flex items-center gap-3 text-sm text-mute">
          <span className="text-rec">Recording</span> <span>Say a sentence. The bar should move.</span>
          <span className="h-2 w-40 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-accent transition-[width] duration-75" style={{ width: `${Math.round(cap.level * 100)}%` }} /></span>
        </div>
      )}
      {on && cap.live.finals.length + (cap.live.interim ? 1 : 0) > 0 && <p className="mt-2 text-sm text-ink select-text">{cap.live.finals.join(" ")} {cap.live.interim}</p>}
      {cap.error && <p role="alert" className="mt-3 text-sm text-rec">{cap.error}</p>}
      <p className="mt-2 text-sm text-mute">The test records nothing to disk.</p>
    </div>
  );
}

export function SettingsScreen() {
  const data = useStore((s) => s.data);
  const { settings } = data;
  const setSettings = useStore((s) => s.setSettings);
  const setAi = useStore((s) => s.setAi);
  const setPrompter = useStore((s) => s.setPrompter);
  const importData = useStore((s) => s.importData);
  const clearTranscripts = useStore((s) => s.clearAllTranscripts);
  const clearAudio = useStore((s) => s.clearAllAudio);
  const deleteSessions = useStore((s) => s.deleteAllSessions);
  const resetAll = useStore((s) => s.resetAll);
  const say = useStore((s) => s.say);
  const file = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<null | { title: string; body: string; label: string; run: () => void }>(null);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseImport> | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [keyState, setKeyState] = useState<"idle" | "testing" | "ok" | string>("idle");

  const download = () => {
    const blob = new Blob([exportJSON(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `speakup30-backup-${dateKey(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say("Backup downloaded");
  };
  const pick = async (f?: File) => {
    if (!f) return;
    const r = parseImport(await f.text());
    setImportErr(r.ok ? null : r.error);
    setPendingImport(r.ok ? r : null);
    if (file.current) file.current.value = "";
  };
  const transcripts = data.attempts.filter((a) => a.transcript).length;

  const test = async () => {
    setKeyState("testing");
    try {
      await testKey(settings.ai.apiKey, settings.ai.model);
      setKeyState("ok");
    } catch (e) {
      setKeyState(e instanceof AIError ? e.message : "The test failed.");
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Private by default" title="Settings" intro="Everything is stored on this device. Nothing is uploaded unless you turn on a feature below that says so." />

      <Group title="Appearance">
        <div className="max-w-md">
          <Segmented label="Theme" value={settings.theme} onChange={(v) => setSettings({ theme: v })} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "system", label: "System" }]} />
        </div>
      </Group>

      <Group title="Speaking and recording" intro="Recording and the level meter work in most browsers. Live transcription depends on the browser's own speech service.">
        <div className="max-w-md">
          <label htmlFor="lang" className="mb-2 block text-sm text-mute">Speech recognition language</label>
          <Select id="lang" value={settings.lang} onChange={(e) => setSettings({ lang: e.target.value as typeof settings.lang })}>
            <option value="en-IN">English (India)</option>
            <option value="en-GB">English (UK)</option>
            <option value="en-US">English (US)</option>
          </Select>
        </div>
        <Switch id="live" checked={settings.liveTranscript} onChange={(v) => setSettings({ liveTranscript: v })} label="Live transcription" hint="Uses your browser's speech service. In Chrome and Edge that service sends audio to the browser maker's servers. Turn it off to keep audio entirely on this device and type your transcript instead." />
        <Switch id="count" checked={settings.countdown} onChange={(v) => setSettings({ countdown: v })} label="3-2-1 countdown before recording" />
        <Switch id="keep" checked={settings.keepRecordings} onChange={(v) => setSettings({ keepRecordings: v })} label="Keep recordings on this device" hint="Lets you replay answers later. Recordings are stored in this browser only and are never uploaded. Off by default: you can still replay an answer until you close the page." />
        <div className="flex flex-wrap gap-2" aria-label="What this browser supports">
          <Badge tone={window.isSecureContext ? "accent" : "rec"}>{window.isSecureContext ? "Secure page" : "Not a secure page"}</Badge>
          <Badge tone={supportsRecording() ? "accent" : "rec"}>{supportsRecording() ? "Recording works" : "Recording unavailable"}</Badge>
          <Badge tone={supportsRecognition() ? "accent" : "mute"}>{supportsRecognition() ? "Live transcription available" : "Live transcription unavailable"}</Badge>
        </div>
        <MicTest />
      </Group>

      <Group title="AI review (optional)" intro="The scores and reports work without any account. This adds a written review from Claude. It needs your own Anthropic API key, and it is off until you add one.">
        <Card>
          <Switch id="ai" checked={settings.ai.enabled} onChange={(v) => setAi({ enabled: v })} label="Offer an AI review on each report" hint="Only when you press “Get an AI review” is the transcript text, never the audio, sent from this browser directly to Anthropic." />
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="key" className="mb-2 block text-sm text-mute">Anthropic API key</label>
              <Field id="key" type="password" autoComplete="off" spellCheck={false} placeholder="sk-ant-…" value={settings.ai.apiKey} onChange={(e) => (setAi({ apiKey: e.target.value }), setKeyState("idle"))} data-testid="api-key" />
            </div>
            <div>
              <label htmlFor="model" className="mb-2 block text-sm text-mute">Model</label>
              <Field id="model" spellCheck={false} value={settings.ai.model} onChange={(e) => setAi({ model: e.target.value })} placeholder={DEFAULT_MODEL} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={test} disabled={!settings.ai.apiKey.trim() || keyState === "testing"}>{keyState === "testing" ? "Testing" : "Test the key"}</Button>
            <Button variant="ghost" disabled={!settings.ai.apiKey} onClick={() => (setAi({ apiKey: "", enabled: false }), setKeyState("idle"))}>Remove the key</Button>
            {keyState === "ok" && <span role="status" className="text-sm text-accentfg">The key works.</span>}
            {keyState !== "idle" && keyState !== "ok" && keyState !== "testing" && <span role="alert" className="text-sm text-rec">{keyState}</span>}
          </div>
          <p className="mt-6 text-sm text-mute">The key is saved in this browser on this device and is never included in backups. Anyone who can open this browser profile could read it, so use a key with a spending limit.</p>
        </Card>
      </Group>

      <Group title="Teleprompter">
        <Button onClick={() => (setPrompter({ ...DEFAULT_PROMPTER }), say("Teleprompter preferences reset"))}>Reset teleprompter preferences</Button>
      </Group>

      <Group title="Your data" intro={`${data.sessions.length} sessions, ${data.attempts.length} answers, ${transcripts} transcripts and ${data.reflections.length} reflections are saved on this device.`}>
        <div className="flex flex-wrap gap-3">
          <Button icon={<Download size={16} />} onClick={download} data-testid="export">Export a backup</Button>
          <Button icon={<Upload size={16} />} onClick={() => file.current?.click()}>Restore from a backup</Button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" aria-label="Choose a backup file" onChange={(e) => void pick(e.target.files?.[0])} data-testid="import-file" />
        </div>
        {importErr && <p role="alert" className="text-sm text-rec">{importErr}</p>}
        <p className="max-w-2xl text-sm text-mute">A backup is a single JSON file with your sessions, transcripts, reflections and settings. Recordings and the API key are not included.</p>
        <div className="border-t border-line pt-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">Delete</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirm({ title: "Delete all transcripts?", body: "Every transcript and its report is removed. Session records and reflections stay.", label: "Delete transcripts", run: () => (clearTranscripts(), say("Transcripts deleted")) })}>Delete all transcripts</Button>
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirm({ title: "Delete all recordings?", body: "Every saved recording on this device is removed.", label: "Delete recordings", run: () => (clearAudio(), say("Recordings deleted")) })}>Delete all recordings</Button>
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirm({ title: "Delete session history?", body: "Completed days, streak and reflections are cleared. Answers and transcripts stay.", label: "Delete history", run: () => (deleteSessions(), say("Session history deleted")) })}>Delete session history</Button>
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirm({ title: "Reset everything?", body: "All sessions, answers, transcripts, recordings, reflections and settings are removed and you start from Day 1. Export a backup first if you might want them.", label: "Reset everything", run: () => (resetAll(), say("Everything was reset")) })}>Reset everything</Button>
          </div>
        </div>
      </Group>

      <Group title="How the scores work">
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-base text-mute">
          <li>Pace is words in the transcript divided by the time you spoke. Pauses and the level meter come from your microphone signal.</li>
          <li>Filler words are counted by context, so “I would like to” is not a filler but “it was, like, hard” is.</li>
          <li>Structure and relevance use signal phrases and key ideas for each question. They are prompts, not verdicts.</li>
          <li>Phrasing looks at hedging and apologies in your words. It cannot measure how confident your voice sounds.</li>
          <li>If there is too little speech to score honestly, the score shows as “Not scored” instead of a guess.</li>
        </ul>
      </Group>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title ?? ""}>
        <p className="text-base text-mute">{confirm?.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="danger" onClick={() => (confirm?.run(), setConfirm(null))} data-testid="confirm-delete">{confirm?.label}</Button>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
        </div>
      </Dialog>
      <Dialog open={!!pendingImport && pendingImport.ok} onClose={() => setPendingImport(null)} title="Replace what is on this device?">
        <p className="text-base text-mute">This backup replaces your current sessions, answers, reflections and settings. Your API key stays as it is.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => {
              if (pendingImport && pendingImport.ok) {
                const keep = settings.ai.apiKey;
                importData({ ...pendingImport.data, settings: { ...pendingImport.data.settings, ai: { ...pendingImport.data.settings.ai, apiKey: keep } } });
                say("Backup restored");
              }
              setPendingImport(null);
            }}
            data-testid="confirm-import"
          >
            Restore backup
          </Button>
          <Button onClick={() => setPendingImport(null)}>Cancel</Button>
        </div>
      </Dialog>
    </div>
  );
}
