import { useEffect, useState } from "react";
import { Keyboard, Mic, Square } from "lucide-react";
import { Button, IconButton, cx } from "./ui/controls";
import { RecDot } from "./ui/layout";
import { useCapture } from "../lib/hooks";
import { useStore } from "../lib/store";
import { fmtClock } from "../lib/analysis/text";
import type { CaptureResult } from "../lib/speech/capture";

interface Props {
  targetSec: [number, number];
  onResult: (r: CaptureResult) => void;
  onType: () => void;
  startLabel?: string;
}

/** The recording control: a 3-2-1 get-ready, a visible recording state with timer, countdown and level, and a stop button. */
export function Recorder({ targetSec, onResult, onType, startLabel = "Start recording" }: Props) {
  const cap = useCapture();
  const settings = useStore((s) => s.data.settings);
  const [ready, setReady] = useState<number | null>(null);

  useEffect(() => {
    if (ready === null) return;
    if (ready === 0) {
      setReady(null);
      void cap.start();
      return;
    }
    const t = setTimeout(() => setReady(ready - 1), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const begin = () => (settings.countdown ? setReady(3) : void cap.start());
  const finish = async () => {
    const r = await cap.stop();
    if (r) onResult(r);
  };

  const recording = cap.status === "recording" || cap.status === "stopping";
  const left = targetSec[1] - cap.elapsed;
  const bars = Array.from({ length: 14 }, (_, i) => Math.min(1, Math.max(0.12, cap.level * (0.55 + 0.45 * Math.sin(i * 1.7 + cap.elapsed * 6)))));

  if (ready !== null) {
    return (
      <div className="flex flex-col items-center gap-4 py-8" role="status" aria-live="assertive">
        <p className="text-sm text-mute">Get ready. Recording starts in</p>
        <p className="text-6xl font-semibold tnum text-ink">{ready}</p>
        <Button variant="ghost" onClick={() => setReady(null)}>
          Cancel
        </Button>
      </div>
    );
  }

  if (recording) {
    return (
      <div>
        <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-full border border-rec/50 bg-rec/5 p-2 pl-5">
          <span className="flex items-center gap-2 text-sm font-medium text-rec">
            <RecDot /> Recording
          </span>
          <span className="text-sm tnum text-ink" aria-label={`Elapsed ${fmtClock(cap.elapsed)}`}>
            {fmtClock(cap.elapsed)}
          </span>
          <span className={cx("text-sm tnum", left < 0 ? "text-mute" : "text-mute")}>{left >= 0 ? `${fmtClock(left)} left` : `${fmtClock(-left)} over`}</span>
          <div aria-hidden className="flex h-6 items-center gap-0.5 flex-1 min-w-16">
            {bars.map((b, i) => (
              <span key={i} className="w-1 rounded-full bg-rec/70" style={{ height: `${Math.round(b * 24)}px` }} />
            ))}
          </div>
          <IconButton label="Stop recording" variant="danger" onClick={finish} disabled={cap.status === "stopping"}>
            <Square size={16} fill="currentColor" />
          </IconButton>
        </div>
        <LiveText finals={cap.live.finals} interim={cap.live.interim} enabled={settings.liveTranscript} canRecognise={cap.canRecognise} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={<Mic size={18} />} onClick={begin} disabled={cap.status === "starting"} data-testid="start-recording">
          {cap.status === "starting" ? "Starting microphone…" : startLabel}
        </Button>
        <Button variant="ghost" icon={<Keyboard size={18} />} onClick={onType} data-testid="type-instead">
          Type instead
        </Button>
      </div>
      <p className="mt-3 text-sm text-mute">
        Aim for {fmtClock(targetSec[0])} to {fmtClock(targetSec[1])}. Recordings stay on this device.
        {settings.liveTranscript && cap.canRecognise && " Live transcription uses your browser's own speech service. You can turn it off in Settings."}
        {!cap.canRecognise && " Live transcription is not available in this browser, so you will add the transcript yourself after recording."}
      </p>
      {cap.error && (
        <p role="alert" className="mt-4 rounded bg-rec/10 p-4 text-sm text-ink">
          {cap.error}
        </p>
      )}
    </div>
  );
}

function LiveText({ finals, interim, enabled, canRecognise }: { finals: string[]; interim: string; enabled: boolean; canRecognise: boolean }) {
  if (!enabled || !canRecognise)
    return <p className="mt-4 text-sm text-mute">{!enabled ? "Live transcription is off. Add the transcript after you stop." : "Live transcription is not available in this browser. Add the transcript after you stop."}</p>;
  const has = finals.length || interim;
  return (
    <div className="mt-4 min-h-24 rounded bg-panel2 p-4 text-base select-text" aria-label="Live transcript">
      {has ? (
        <p>
          <span className="text-ink">{finals.join(" ")}</span> <span className="text-mute">{interim}</span>
        </p>
      ) : (
        <p className="text-mute">Listening. Your words will appear here.</p>
      )}
    </div>
  );
}
