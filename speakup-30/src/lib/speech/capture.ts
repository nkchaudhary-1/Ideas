// Microphone capture: real audio recording, a real level meter and silence measurement from the audio signal, and live
// transcription through the browser's own speech recognition where it exists. Nothing is faked: if a part is not
// supported, that part is reported as missing and the app falls back to typing a transcript.
import type { VadStats } from "../types";

// The Web Speech API is not in TypeScript's DOM types.
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
}
interface SREvent {
  resultIndex: number;
  results: { length: number; [i: number]: SRResult };
}
interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRCtor = new () => SRInstance;
const getSR = (): SRCtor | null => {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const supportsRecognition = () => typeof window !== "undefined" && !!getSR();
export const supportsRecording = () =>
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

export type MicErrorCode = "denied" | "no-device" | "unsupported" | "insecure" | "busy" | "unknown";
export class MicError extends Error {
  constructor(public code: MicErrorCode, message: string) {
    super(message);
  }
}

export interface CaptureOptions {
  lang: string;
  liveTranscript: boolean;
  onLevel?: (level: number) => void;
  onTranscript?: (finals: string[], interim: string) => void;
}

export interface CaptureResult {
  blob: Blob | null;
  durationSec: number;
  segments: string[];
  transcript: string;
  /** What the microphone level showed. Null when there was no audio signal (dictation in the artifact). */
  vad: VadStats | null;
  /** True if speech recognition ran and produced text. */
  recognised: boolean;
  /** Why live transcription did not work, if it did not. */
  recognitionIssue: string | null;
}

const FRAME_MS = 50;
const HANG_MS = 350;
const START_FRAMES = 2;

/** Measures speech and silence from the microphone signal. Pure logic, tested without a browser. */
export class SilenceMeter {
  private floor = 0.004;
  private speaking = false;
  private above = 0;
  private belowMs = 0;
  private segStart = 0;
  private lastLoud = 0;
  private recent: number[] = [];
  readonly segments: { start: number; end: number }[] = [];

  /** `rms` is the signal level for one frame, `t` the time in ms since recording started. */
  push(rms: number, t: number): void {
    // Track the quiet floor from the lowest levels of the last two seconds.
    this.recent.push(rms);
    if (this.recent.length > 40) this.recent.shift();
    const low = Math.min(...this.recent);
    this.floor = Math.min(0.03, Math.max(0.0015, this.floor * 0.98 + low * 0.02));
    const threshold = Math.min(0.05, Math.max(0.01, this.floor * 3));
    if (rms > threshold) {
      this.above++;
      this.belowMs = 0;
      this.lastLoud = t;
      if (!this.speaking && this.above >= START_FRAMES) {
        this.speaking = true;
        this.segStart = t - (START_FRAMES - 1) * FRAME_MS;
      }
    } else {
      this.above = 0;
      if (this.speaking) {
        this.belowMs += FRAME_MS;
        if (this.belowMs >= HANG_MS) this.closeSegment();
      }
    }
  }

  private closeSegment() {
    this.speaking = false;
    this.belowMs = 0;
    const seg = { start: this.segStart, end: this.lastLoud + FRAME_MS };
    // A blip shorter than a quarter of a second is noise, not speech.
    if (seg.end - seg.start >= 250) this.segments.push(seg);
  }

  finish(totalMs: number): VadStats {
    if (this.speaking) this.closeSegment();
    const segs = this.segments;
    if (!segs.length) return { speakingSec: 0, leadSilenceSec: totalMs / 1000, tailSilenceSec: 0, pauses: 0, longPauses: 0, longestPauseSec: 0 };
    let speaking = 0;
    for (const s of segs) speaking += s.end - s.start;
    let pauses = 0;
    let longPauses = 0;
    let longest = 0;
    for (let i = 1; i < segs.length; i++) {
      const gap = segs[i].start - segs[i - 1].end;
      if (gap >= 1000) pauses++;
      if (gap >= 2000) longPauses++;
      longest = Math.max(longest, gap);
    }
    const r = (ms: number) => Math.round(ms / 100) / 10;
    return {
      speakingSec: r(speaking),
      leadSilenceSec: r(segs[0].start),
      tailSilenceSec: r(Math.max(0, totalMs - segs[segs.length - 1].end)),
      pauses,
      longPauses,
      longestPauseSec: r(longest),
    };
  }
}

function pickMime(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(m));
}

const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export class SpeechCapture {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private meter = new SilenceMeter();
  private frameTimer: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;
  private recording = false;
  private sr: SRInstance | null = null;
  private srStopped = false;
  private srRestarts = 0;
  private srLastStart = 0;
  private finals: string[] = [];
  private interim = "";
  private issue: string | null = null;
  private lastEmit = 0;

  constructor(private opts: CaptureOptions) {}

  async start(): Promise<void> {
    if (!window.isSecureContext) throw new MicError("insecure", "The microphone only works on a secure page (https or localhost). Open the app from its https address.");
    if (!navigator.mediaDevices?.getUserMedia) throw new MicError("unsupported", "This browser cannot record audio. Try Chrome, Edge, Safari or Firefox, and type your transcript instead.");
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      const name = (e as DOMException).name;
      if (name === "NotAllowedError" || name === "SecurityError") throw new MicError("denied", "Microphone access is blocked. Allow it in your browser's site settings, then try again.");
      if (name === "NotFoundError" || name === "OverconstrainedError") throw new MicError("no-device", "No microphone was found. Connect one, or type your transcript instead.");
      if (name === "NotReadableError") throw new MicError("busy", "The microphone is being used by another app. Close it and try again.");
      throw new MicError("unknown", "The microphone could not start. Reload the page and try again.");
    }
    // Level meter and silence measurement.
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    if (this.ctx.state === "suspended") await this.ctx.resume().catch(() => {});
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    src.connect(this.analyser);
    const buf = new Float32Array(this.analyser.fftSize);

    // Recording
    if (typeof MediaRecorder !== "undefined") {
      const mime = pickMime();
      try {
        this.recorder = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
        this.recorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
        this.recorder.start();
      } catch {
        this.recorder = null;
      }
    }

    this.startedAt = performance.now();
    this.recording = true;
    let smooth = 0;
    this.frameTimer = setInterval(() => {
      if (!this.analyser) return;
      this.analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      this.meter.push(rms, performance.now() - this.startedAt);
      smooth = smooth * 0.6 + Math.min(1, rms * 7) * 0.4;
      this.opts.onLevel?.(smooth);
    }, FRAME_MS);

    if (this.opts.liveTranscript) this.startRecognition();
  }

  private emit() {
    const now = performance.now();
    if (now - this.lastEmit < 80) return;
    this.lastEmit = now;
    this.opts.onTranscript?.(this.finals.slice(), this.interim);
  }

  private startRecognition() {
    const Ctor = getSR();
    if (!Ctor) {
      this.issue = "Live transcription is not available in this browser. Type or paste what you said below.";
      return;
    }
    const r = new Ctor();
    r.lang = this.opts.lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0].transcript.trim();
        if (res.isFinal) {
          if (text) this.finals.push(capitalise(text));
        } else interim += text + " ";
      }
      this.interim = interim.trim();
      this.opts.onTranscript?.(this.finals.slice(), this.interim);
    };
    r.onerror = (e) => {
      switch (e.error) {
        case "no-speech":
        case "aborted":
          return;
        case "not-allowed":
        case "service-not-allowed":
          this.issue = "This browser blocked speech recognition. Your recording still works. Type or paste what you said below.";
          break;
        case "network":
          this.issue = "Speech recognition needs an internet connection in this browser. Your recording still works. Type or paste what you said below.";
          break;
        case "audio-capture":
          this.issue = "The browser could not share the microphone with speech recognition. Your recording still works. Type or paste what you said below.";
          break;
        default:
          this.issue = `Speech recognition stopped (${e.error}). Your recording still works. Type or paste what you said below.`;
      }
      this.srStopped = true;
    };
    r.onend = () => {
      // Keep any words that were still being heard when the session ended.
      if (this.interim) {
        this.finals.push(capitalise(this.interim));
        this.interim = "";
        this.emit();
      }
      if (!this.recording || this.srStopped) return;
      // The browser ends continuous sessions on its own after a while. Start again, but give up if it keeps failing fast.
      const now = performance.now();
      this.srRestarts = now - this.srLastStart < 1500 ? this.srRestarts + 1 : 0;
      if (this.srRestarts >= 4) {
        this.issue = "Speech recognition keeps stopping in this browser. Your recording still works. Type or paste what you said below.";
        this.srStopped = true;
        return;
      }
      setTimeout(() => this.recording && !this.srStopped && this.beginSr(), 150);
    };
    this.sr = r;
    this.beginSr();
  }

  private beginSr() {
    try {
      this.srLastStart = performance.now();
      this.sr?.start();
    } catch {
      /* already started */
    }
  }

  /** Stop recording and return everything captured. */
  async stop(): Promise<CaptureResult> {
    const totalMs = performance.now() - this.startedAt;
    this.recording = false;
    if (this.frameTimer) clearInterval(this.frameTimer);
    this.frameTimer = null;

    // Let speech recognition deliver its last words.
    if (this.sr) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        const prev = this.sr!.onend;
        this.sr!.onend = () => {
          prev?.call(this.sr);
          done();
        };
        try {
          this.sr!.stop();
        } catch {
          done();
        }
        setTimeout(done, 900);
      });
    }
    const blob = await this.finishRecorder();
    this.release();
    const segments = this.finals.filter(Boolean);
    const vad = this.meter.finish(totalMs);
    return {
      blob,
      durationSec: Math.round(totalMs / 100) / 10,
      segments,
      transcript: segments.join("\n"),
      vad,
      recognised: segments.length > 0,
      recognitionIssue: this.issue ?? (this.opts.liveTranscript && segments.length === 0 && supportsRecognition() ? "No words were recognised. Check the microphone, or type what you said below." : null),
    };
  }

  private finishRecorder(): Promise<Blob | null> {
    const rec = this.recorder;
    if (!rec || rec.state === "inactive") return Promise.resolve(this.chunks.length ? new Blob(this.chunks, { type: rec?.mimeType }) : null);
    return new Promise((resolve) => {
      rec.onstop = () => resolve(this.chunks.length ? new Blob(this.chunks, { type: rec.mimeType || "audio/webm" }) : null);
      try {
        rec.stop();
      } catch {
        resolve(null);
      }
    });
  }

  /** Abandon the take without returning anything. */
  cancel() {
    this.recording = false;
    this.srStopped = true;
    if (this.frameTimer) clearInterval(this.frameTimer);
    try {
      this.sr?.abort();
    } catch {
      /* ignore */
    }
    try {
      if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    } catch {
      /* ignore */
    }
    this.release();
  }

  private release() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.analyser = null;
  }
}
