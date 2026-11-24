import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { IconButton } from "./ui/controls";
import { loadAudio } from "../lib/storage";
import { fmtClock } from "../lib/analysis/text";

/** Replays a recording from this device. Shows nothing if the audio is not available (for example after a reload). */
export function AudioPlayer({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const el = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    let u: string | null = null;
    let live = true;
    setUrl(null);
    setMissing(false);
    loadAudio(id).then((b) => {
      if (!live) return;
      if (!b) return setMissing(true);
      u = URL.createObjectURL(b);
      setUrl(u);
    });
    return () => {
      live = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);

  if (missing) return <p className="text-sm text-mute">Replay is not available for this answer. Turn on “Keep recordings on this device” in Settings to replay later.</p>;
  if (!url) return null;
  return (
    <div className="flex items-center gap-3 rounded-full bg-panel2 p-2 pr-5" data-testid="audio-player">
      <audio
        ref={el}
        src={url}
        preload="metadata"
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDur(e.currentTarget.duration)}
        onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDur(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <IconButton label={playing ? "Pause replay" : "Replay your answer"} variant="ink" onClick={() => (playing ? el.current?.pause() : void el.current?.play())}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </IconButton>
      <input
        type="range"
        aria-label="Replay position"
        min={0}
        max={dur || 1}
        step={0.1}
        value={Math.min(t, dur || 1)}
        onChange={(e) => {
          if (el.current) el.current.currentTime = +e.target.value;
          setT(+e.target.value);
        }}
        className="flex-1 min-w-0"
        style={{ accentColor: "rgb(var(--c-accent))" }}
      />
      <span className="text-sm tnum text-mute w-20 text-right">{fmtClock(t)} / {fmtClock(dur)}</span>
    </div>
  );
}
