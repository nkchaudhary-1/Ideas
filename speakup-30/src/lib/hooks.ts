import { useCallback, useEffect, useRef, useState } from "react";
import { SpeechCapture, supportsRecognition, supportsRecording, type CaptureResult } from "./speech/capture";
import { create } from "zustand";
import { useStore } from "./store";

/** True while any recording is in progress, so the session clock cannot be paused mid-answer. */
export const useLive = create<{ recording: boolean }>(() => ({ recording: false }));

/** Re-renders on an interval and returns the current time in ms. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Keeps the screen awake while active (phones dim and lock mid-answer otherwise). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const get = () => {
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          if (cancelled) void l.release();
          else lock = l;
        })
        .catch(() => {});
    };
    get();
    const onVis = () => document.visibilityState === "visible" && get();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}

export type CaptureStatus = "idle" | "starting" | "recording" | "stopping";

export function useCapture() {
  const settings = useStore((s) => s.data.settings);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState<{ finals: string[]; interim: string }>({ finals: [], interim: "" });
  const [error, setError] = useState<string | null>(null);
  const cap = useRef<SpeechCapture | null>(null);
  const t0 = useRef(0);

  useWakeLock(status === "recording");
  useEffect(() => {
    useLive.setState({ recording: status === "recording" || status === "stopping" });
    return () => useLive.setState({ recording: false });
  }, [status]);

  useEffect(() => {
    if (status !== "recording") return;
    const t = setInterval(() => setElapsed((performance.now() - t0.current) / 1000), 250);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => () => cap.current?.cancel(), []);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    setLive({ finals: [], interim: "" });
    setElapsed(0);
    setStatus("starting");
    const c = new SpeechCapture({
      lang: settings.lang,
      liveTranscript: settings.liveTranscript,
      onLevel: setLevel,
      onTranscript: (finals, interim) => setLive({ finals, interim }),
    });
    try {
      await c.start();
      cap.current = c;
      t0.current = performance.now();
      setStatus("recording");
      return true;
    } catch (e) {
      setStatus("idle");
      setError((e as Error).message);
      return false;
    }
  }, [settings.lang, settings.liveTranscript]);

  const stop = useCallback(async (): Promise<CaptureResult | null> => {
    const c = cap.current;
    if (!c) return null;
    setStatus("stopping");
    const res = await c.stop();
    cap.current = null;
    setStatus("idle");
    setLevel(0);
    return res;
  }, []);

  const cancel = useCallback(() => {
    cap.current?.cancel();
    cap.current = null;
    setStatus("idle");
    setLevel(0);
  }, []);

  return { status, level, elapsed, live, error, start, stop, cancel, canRecord: supportsRecording(), canRecognise: supportsRecognition() };
}
