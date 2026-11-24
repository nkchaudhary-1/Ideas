// Speech input for the artifact build. The artifact sandbox refuses the microphone, but the viewer offers a "dictation"
// capability that turns the viewer's speech into text. It gives words, not audio, so there is no replay and no pause
// measurement here: pace comes from the transcript and the clock only.
import { MicError, type CaptureOptions, type CaptureResult } from "./capture";

interface DictationApi {
  start(o?: { language?: string }): Promise<void>;
  stop(): Promise<void>;
  onPartial(h: (e: { text: string }) => void): () => void;
  onFinal(h: (e: { text: string }) => void): () => void;
  onState(h: (e: { state: string; reason?: string }) => void): () => void;
}
interface ClaudeHost {
  use(name: string): Promise<unknown>;
}

// Resolved as soon as the page loads, so by the time someone clicks Record the namespace is in hand and `start()` can be
// called synchronously from the click, which the capability requires.
let api: DictationApi | null = null;
const host = typeof window !== "undefined" ? (window as unknown as { claude?: ClaudeHost }).claude : undefined;
if (host?.use) {
  host
    .use("dictation")
    .then((d) => (api = (d as DictationApi | null) ?? null))
    .catch(() => (api = null));
}

const REASONS: Record<string, string> = {
  not_granted: "Dictation is switched off for this artifact. Turn it on in the artifact's Permissions menu, or type your answer instead.",
  dismissed: "Dictation was not allowed this time. Press record to be asked again, or type your answer instead.",
  unavailable: "Dictation is not available for your account in this view. Type your answer instead.",
  rate_limited: "Dictation is busy. Wait a moment and try again, or type your answer instead.",
  upstream_error: "The speech service had a problem. Try again, or type your answer instead.",
};

export class DictationCapture {
  private finals: string[] = [];
  private offs: (() => void)[] = [];
  private startedAt = 0;
  private issue: string | null = null;

  constructor(private opts: CaptureOptions) {}

  async start(): Promise<void> {
    const d = api;
    if (!d) throw new MicError("unsupported", "Speech input is not available in this view. Open the artifact in a Chromium browser or the Claude desktop app, or type your answer instead.");
    this.offs.push(
      d.onFinal(({ text }) => {
        if (!text.trim()) return;
        this.finals.push(text);
        this.opts.onTranscript?.(this.finals.slice(), "");
      }),
      d.onPartial(({ text }) => this.opts.onTranscript?.(this.finals.slice(), text.trim())),
      d.onState(({ state, reason }) => {
        if (state === "idle" && reason && REASONS[reason]) this.issue = REASONS[reason];
      }),
    );
    try {
      // First thing, with nothing awaited before it: the capability only accepts a start from the viewer's own click.
      await d.start();
    } catch (e) {
      this.dispose();
      const code = (e as { code?: string }).code ?? "";
      throw new MicError(code === "not_granted" ? "denied" : "unknown", REASONS[code] ?? "Dictation could not start. Type your answer instead.");
    }
    this.startedAt = performance.now();
  }

  async stop(): Promise<CaptureResult> {
    const totalMs = performance.now() - this.startedAt;
    try {
      await api?.stop();
    } catch {
      /* already idle */
    }
    this.dispose();
    const segments = this.finals.map((s) => s.trim()).filter(Boolean);
    return {
      blob: null,
      durationSec: Math.round(totalMs / 100) / 10,
      segments,
      transcript: this.finals.join("").trim(),
      vad: null,
      recognised: segments.length > 0,
      recognitionIssue: this.issue ?? (segments.length === 0 ? "Nothing was heard. Check that dictation is allowed for this artifact, or type what you said below." : null),
    };
  }

  cancel() {
    this.dispose();
    void api?.stop().catch(() => {});
  }

  private dispose() {
    this.offs.forEach((off) => off());
    this.offs = [];
  }
}
