import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Mic, Minimize2, Pause, Play, SkipBack, SkipForward, SlidersHorizontal, Square, X } from "lucide-react";
import { IconButton, Button, Segmented, cx } from "../ui/controls";
import { Dialog } from "../ui/Dialog";
import { Slider } from "../ui/Slider";
import { ProgressBar, RecDot } from "../ui/layout";
import { CueChip, CueDot } from "./Cue";
import { ScriptCustomiser } from "./ScriptCustomiser";
import { usePrompterEngine } from "./engine";
import { Report } from "../Report";
import { dayContent, levelFor } from "../../content/curriculum";
import { cueDisplay, parseScript, scriptSeconds, supportText, type CueId, type Unit } from "../../lib/script";
import { useStore } from "../../lib/store";
import { useCapture, useWakeLock } from "../../lib/hooks";
import { keepAudio } from "../../lib/storage";
import { uid } from "../../lib/time";
import { fmtClock } from "../../lib/analysis/text";
import type { CueMode, SupportMode } from "../../lib/types";

const EMPTY: Record<string, string> = {};
const CUE_MODES: CueMode[] = ["beginner", "intermediate", "advanced"];

interface Props {
  day: number;
  /** Called when the reader presses the "done" button after finishing the script. */
  onDone?: () => void;
  doneLabel?: string;
  /** Tailwind height classes for the inline (not full screen) prompter. */
  heightClass?: string;
  /** Move on by itself this many seconds after the script ends. The reader can stay. */
  autoAdvanceSec?: number;
}

export function Prompter({ day, onDone, doneLabel = "Continue", heightClass = "h-[calc(100dvh-14rem)] min-h-[26rem]", autoAdvanceSec }: Props) {
  const content = dayContent(day);
  const level = levelFor(day);
  const prefs = useStore((s) => s.data.prompter);
  const fills = useStore((s) => s.data.fills[day]) ?? EMPTY;
  const settings = useStore((s) => s.data.settings);
  const setPrefs = useStore((s) => s.setPrompter);
  const addAttempt = useStore((s) => s.addAttempt);
  const say = useStore((s) => s.say);

  const doc = useMemo(() => parseScript(content.script ?? "", fills), [content.script, fills]);
  const wpm = prefs.wpm ?? level.wpm;
  const cueMode: CueMode = prefs.cueMode ?? level.cueMode;
  const support: SupportMode = prefs.support ?? level.supportMode;

  const eng = usePrompterEngine(doc.units, wpm);
  const { view } = eng;
  useWakeLock(view.playing);

  const [immersive, setImmersive] = useState(false);
  const [panel, setPanel] = useState<"settings" | "fill" | null>(null);
  const [idle, setIdle] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [leaveIn, setLeaveIn] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const unitEls = useRef<(HTMLElement | null)[]>([]);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cap = useCapture();
  const reading = useStore((s) => (readingId ? s.data.attempts.find((a) => a.id === readingId) ?? null : null));

  // When the script ends, count down and move on to the next step unless the reader chooses to stay. The parent
  // re-renders every half second, so the callback goes through a ref and does not restart the countdown.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const autoOn = !!onDone && !!autoAdvanceSec;
  useEffect(() => {
    setLeaveIn(view.finished && autoOn ? autoAdvanceSec! : null);
  }, [view.finished, autoOn, autoAdvanceSec]);
  useEffect(() => {
    if (leaveIn === null) return;
    if (leaveIn <= 0) {
      doneRef.current?.();
      return;
    }
    const t = setTimeout(() => setLeaveIn((n) => (n === null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [leaveIn]);

  // ── Full screen
  const toggleFs = useCallback(async () => {
    if (!immersive) {
      setImmersive(true);
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        /* The overlay still works without the Fullscreen API (iPhone). */
      }
    } else {
      setImmersive(false);
      if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => {});
    }
  }, [immersive]);
  useEffect(() => {
    const on = () => {
      if (!document.fullscreenElement) setImmersive(false);
    };
    document.addEventListener("fullscreenchange", on);
    return () => {
      document.removeEventListener("fullscreenchange", on);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);
  useEffect(() => {
    if (!immersive) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [immersive]);

  // Hide the controls after a pause in activity, while reading in full screen.
  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2800);
  }, []);
  useEffect(() => () => void (idleTimer.current && clearTimeout(idleTimer.current)), []);
  const hideControls = idle && immersive && view.playing && panel === null;

  // ── Keep the active unit at the reading line
  const fontSize = prefs.fontSize;
  const lineHeight = prefs.lineHeight;
  const atRest = view.index === 0 && view.pos === 0 && !view.playing && !view.finished;
  useEffect(() => {
    const sc = scroller.current;
    const el = unitEls.current[view.index];
    if (!sc || !el) return;
    // Before reading starts, keep the introduction in view.
    const top = atRest ? 0 : Math.max(0, el.offsetTop - sc.clientHeight * 0.3);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sc.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }, [view.index, atRest, fontSize, lineHeight, support, cueMode, immersive, doc]);

  // ── Microphone while reading
  const toggleMic = useCallback(async () => {
    if (cap.status === "recording") {
      const r = await cap.stop();
      if (!r) return;
      const id = uid();
      if (r.blob) keepAudio(id, r.blob, settings.keepRecordings);
      addAttempt({
        id,
        day,
        kind: "read-aloud",
        question: `Read aloud: ${content.topic}`,
        durationSec: r.durationSec,
        transcript: r.transcript,
        source: r.transcript ? "speech" : "typed",
        vad: r.vad,
        hasAudio: !!r.blob && settings.keepRecordings,
      });
      setReadingId(id);
    } else if (cap.status === "idle") {
      if (await cap.start()) say("Recording started");
    }
  }, [cap, addAttempt, content.topic, day, say, settings.keepRecordings]);

  // ── Keyboard shortcuts
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest?.("input,textarea,select,[contenteditable],[role=slider],[role=dialog]")) return;
      if ((e.key === " " || e.key === "Enter") && t?.closest?.("button,a")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      wake();
      let handled = true;
      switch (e.key) {
        case " ":
          eng.toggle();
          break;
        case "ArrowRight":
          eng.next();
          break;
        case "ArrowLeft":
          eng.prev();
          break;
        case "ArrowUp":
          setPrefs({ wpm: Math.min(220, wpm + 5) });
          break;
        case "ArrowDown":
          setPrefs({ wpm: Math.max(60, wpm - 5) });
          break;
        case "+":
        case "=":
          setPrefs({ fontSize: Math.min(72, fontSize + 2) });
          break;
        case "-":
          setPrefs({ fontSize: Math.max(20, fontSize - 2) });
          break;
        case "r":
        case "R":
          eng.reset();
          break;
        case "f":
        case "F":
          void toggleFs();
          break;
        case "m":
        case "M":
          void toggleMic();
          break;
        case "c":
        case "C":
          setPrefs({ cueMode: CUE_MODES[(CUE_MODES.indexOf(cueMode) + 1) % 3] });
          break;
        case "Escape":
          if (immersive) void toggleFs();
          else handled = false;
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [eng, wpm, fontSize, cueMode, immersive, toggleFs, toggleMic, setPrefs, wake]);

  const total = doc.units.length;
  const estimate = scriptSeconds(doc, wpm);
  const activeUnit = doc.units[view.index];
  const progress = total ? (view.index + (view.finished ? 1 : view.pos / Math.max(1, activeUnit?.words ?? 1))) / total : 0;

  if (!content.script) return <p className="text-base text-mute">Day {day} has no teleprompter script. This day is spoken without one.</p>;

  // Group units into paragraphs.
  const paras: Unit[][] = [];
  for (const u of doc.units) (paras[u.para] ??= []).push(u);

  const userScroll = () => view.playing && eng.pause();

  return (
    <div
      ref={wrap}
      onPointerMove={wake}
      onPointerDown={wake}
      className={cx(
        "flex flex-col bg-bg overflow-hidden",
        immersive ? "fixed inset-0 z-50" : cx("relative rounded-card border border-line", heightClass),
      )}
      data-testid="prompter"
    >
      {/* Top bar */}
      <div className={cx("flex items-center gap-3 px-4 sm:px-6 h-14 shrink-0 transition-opacity duration-300", hideControls && "opacity-0")} style={immersive ? { paddingTop: "env(safe-area-inset-top)" } : undefined}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink">Day {day} · {content.topic}</p>
        </div>
        <p className="text-sm tnum text-mute whitespace-nowrap" aria-label={`Session timer ${fmtClock(view.elapsed)}`} data-testid="prompter-timer">
          <span className="hidden sm:inline">{Math.min(view.index + 1, total)} of {total} · </span>
          {fmtClock(view.elapsed)} <span>/ about {fmtClock(estimate)}</span>
        </p>
        {doc.unfilled > 0 && (
          <button type="button" onClick={() => setPanel("fill")} className="hidden sm:inline-flex h-8 items-center rounded-full border border-line px-3 text-xs text-mute hover:text-ink whitespace-nowrap">
            {doc.unfilled} to fill in
          </button>
        )}
        {immersive && (
          <IconButton label="Exit full screen" onClick={toggleFs}>
            <X size={20} />
          </IconButton>
        )}
      </div>
      <div className={cx("px-4 sm:px-6 shrink-0 transition-opacity duration-300", hideControls && "opacity-0")}>
        <ProgressBar value={progress} label="Reading progress" />
        <p className="sr-only" aria-live="polite">{`Sentence ${view.index + 1} of ${total}`}</p>
      </div>

      {/* Script */}
      <div
        ref={scroller}
        onWheel={userScroll}
        onTouchMove={userScroll}
        className="prompter-scroll relative flex-1 overflow-y-auto ui-nosel"
        style={{ WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)", maskImage: "linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)" }}
        aria-label="Teleprompter script"
      >
        <div className="relative mx-auto max-w-3xl px-6 sm:px-10" style={{ paddingTop: "8dvh", paddingBottom: "50dvh" }}>
          <Legend cueMode={cueMode} support={support} note={content.scriptNote} unfilled={doc.unfilled} onFill={() => setPanel("fill")} onStart={eng.play} started={view.playing || view.index > 0 || view.pos > 0} />
          <div style={{ fontSize, lineHeight }} className="font-medium tracking-tight">
            {paras.map((us, pi) => (
              <p key={pi} className="mb-[1.1em]">
                {us.map((u) => (
                  <UnitView
                    key={u.id}
                    u={u}
                    state={u.id < view.index ? "past" : u.id === view.index ? "active" : "future"}
                    frac={u.id === view.index ? view.pos / Math.max(1, u.words) : 0}
                    pauseLeft={u.id === view.index ? view.pauseLeft : null}
                    cueMode={cueMode}
                    support={support}
                    lineHeight={lineHeight}
                    refCb={(el) => (unitEls.current[u.id] = el)}
                    onJump={() => eng.jump(u.id)}
                  />
                ))}
              </p>
            ))}
          </div>
          <div className="mt-10 rounded-card border border-line bg-panel p-8" style={{ fontSize: 16, lineHeight: "24px" }} hidden={!view.finished}>
            <p className="text-lg font-medium text-ink">That is the whole script.</p>
            <p className="mt-2 text-base text-mute">Read it once more, looking up at the cues, or move on. The next step has no script.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={() => (setLeaveIn(null), eng.play())}>Read it again</Button>
              {onDone && (
                <Button variant="primary" onClick={onDone} data-testid="prompter-done">
                  {doneLabel}
                </Button>
              )}
            </div>
            {leaveIn !== null && leaveIn > 0 && (
              <p className="mt-4 text-sm text-mute" role="status" data-testid="auto-advance">
                Moving on automatically in {leaveIn}. <button type="button" className="underline" onClick={() => setLeaveIn(null)}>Stay here</button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={cx("pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 transition-opacity duration-300", hideControls && "opacity-0")} style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div role="toolbar" aria-label="Teleprompter controls" className="pointer-events-auto flex h-[52px] coarse:h-[60px] items-center gap-1 rounded-full border border-line bg-panel/95 p-2 shadow-pop backdrop-blur">
          <IconButton label="Previous sentence" onClick={eng.prev} data-testid="prev">
            <SkipBack size={18} />
          </IconButton>
          <IconButton label={view.playing ? "Pause" : view.index === 0 && view.pos === 0 ? "Start reading" : "Play"} variant="primary" onClick={eng.toggle} data-testid="play">
            {view.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </IconButton>
          <IconButton label="Next sentence" onClick={eng.next} data-testid="next">
            <SkipForward size={18} />
          </IconButton>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <IconButton
            label={cap.status === "recording" ? "Stop recording" : cap.canRecord ? "Record while you read" : "Recording is not available in this browser"}
            onClick={toggleMic}
            disabled={!cap.canRecord || cap.status === "starting" || cap.status === "stopping"}
            variant={cap.status === "recording" ? "danger" : "ghost"}
            data-testid="mic"
          >
            {cap.status === "recording" ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
          </IconButton>
          <IconButton label="Teleprompter settings" onClick={() => setPanel("settings")} data-testid="prompter-settings">
            <SlidersHorizontal size={18} />
          </IconButton>
          <IconButton label={immersive ? "Exit full screen" : "Full screen"} onClick={toggleFs} data-testid="fullscreen">
            {immersive ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </div>
      </div>

      {/* Recording is always visible */}
      {cap.status === "recording" && (
        <div role="status" className="absolute left-1/2 top-16 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-rec/50 bg-panel/95 px-4 py-2 text-sm text-rec shadow-pop">
          <RecDot /> Recording · <span className="tnum text-ink">{fmtClock(cap.elapsed)}</span>
        </div>
      )}
      {cap.error && (
        <p role="alert" className="absolute left-4 right-4 top-16 z-10 rounded bg-panel p-4 text-sm text-ink border border-rec/50">
          {cap.error}
        </p>
      )}

      <Dialog open={panel === "settings"} onClose={() => setPanel(null)} title="Teleprompter settings" sheet>
        <div className="space-y-6">
          <Slider label="Speed" unit="wpm" value={wpm} min={60} max={220} step={5} reset={level.wpm} onChange={(v) => setPrefs({ wpm: v })} />
          <Slider label="Font size" unit="px" value={fontSize} min={20} max={72} step={2} reset={32} onChange={(v) => setPrefs({ fontSize: v })} />
          <Slider label="Line spacing" value={lineHeight} min={1.2} max={2.4} step={0.1} reset={1.6} onChange={(v) => setPrefs({ lineHeight: v })} />
          <div>
            <p className="text-sm text-mute mb-2">Cue intensity</p>
            <Segmented
              label="Cue intensity"
              value={cueMode}
              onChange={(v) => setPrefs({ cueMode: v })}
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
            />
            <p className="mt-2 text-sm text-mute">{cueMode === "beginner" ? "Every cue is shown with its instruction." : cueMode === "intermediate" ? "Only pauses, breaths and emphasis are shown." : "Pauses are a small dot. Emphasis stays blue."}</p>
          </div>
          <div>
            <p className="text-sm text-mute mb-2">Script support</p>
            <Segmented
              label="Script support"
              value={support}
              onChange={(v) => setPrefs({ support: v })}
              options={[
                { value: "full", label: "Full text" },
                { value: "first-words", label: "First words" },
                { value: "key-phrases", label: "Key phrases" },
              ]}
            />
            <p className="mt-2 text-sm text-mute">{support === "full" ? "Read every word." : support === "first-words" ? "Only the first words of each sentence. Say the rest yourself." : "Only the key phrases. Build the sentences yourself."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => (eng.reset(), setPanel(null))}>Reset script</Button>
            <Button onClick={() => setPanel("fill")}>Make it yours</Button>
            <Button variant="ghost" onClick={() => setPrefs({ wpm: null, cueMode: null, support: null, fontSize: 32, lineHeight: 1.6 })}>
              Back to this day's defaults
            </Button>
          </div>
          <details className="text-sm text-mute">
            <summary className="cursor-pointer py-2 text-ink">Keyboard shortcuts</summary>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {[
                ["Space", "Play or pause"],
                ["← →", "Previous or next sentence"],
                ["↑ ↓", "Speed up or slow down"],
                ["+ −", "Larger or smaller text"],
                ["R", "Reset"],
                ["F", "Full screen"],
                ["M", "Record while you read"],
                ["C", "Change cue intensity"],
                ["Esc", "Leave full screen"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-mono text-ink">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      </Dialog>
      <ScriptCustomiser day={day} open={panel === "fill"} onClose={() => setPanel(null)} />
      <Dialog open={!!reading} onClose={() => setReadingId(null)} title="Your reading" wide>
        {reading && <Report attempt={reading} />}
      </Dialog>
    </div>
  );
}

function Legend({ cueMode, support, note, unfilled, onFill, onStart, started }: { cueMode: CueMode; support: SupportMode; note?: string; unfilled: number; onFill: () => void; onStart: () => void; started: boolean }) {
  return (
    <div className="mb-12 rounded-card border border-line bg-panel p-8" style={{ fontSize: 16, lineHeight: "24px", fontWeight: 400, letterSpacing: "normal" }}>
      <p className="text-lg font-medium text-ink">Read the words, not the cues.</p>
      <p className="mt-2 text-base text-mute">
        Cues are instructions for you and are never read aloud. {cueMode === "advanced" ? "Here they are minimal: a dot is a pause." : "Green is a pause or a breath, blue is a phrase to lean on, grey is a delivery tip."}
      </p>
      {cueMode !== "advanced" && (
        <p className="mt-4 flex flex-wrap items-center gap-y-2">
          <CueChip cue="pause1" /> <CueChip cue="breathe" /> <CueChip cue="emphasise" /> {cueMode === "beginner" && <CueChip cue="smile" />}
        </p>
      )}
      {support !== "full" && (
        <p className="mt-4 text-sm text-mute">
          Today starts with less help: {support === "first-words" ? "only the first words of each sentence" : "only the key phrases"} show. Say the rest in your own words. Change this in settings if you want the full text.
        </p>
      )}
      {note && <p className="mt-4 text-sm text-mute">{note}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onStart} icon={<Play size={16} fill="currentColor" />} data-testid="legend-start">
          {started ? "Continue reading" : "Start reading"}
        </Button>
        {unfilled > 0 && (
          <Button onClick={onFill} data-testid="open-fill">
            Make it yours · {unfilled} to fill in
          </Button>
        )}
      </div>
    </div>
  );
}

interface UnitProps {
  u: Unit;
  state: "past" | "active" | "future";
  frac: number;
  pauseLeft: number | null;
  cueMode: CueMode;
  support: SupportMode;
  lineHeight: number;
  refCb: (el: HTMLElement | null) => void;
  onJump: () => void;
}

const UnitView = memo(function UnitView({ u, state, frac, pauseLeft, cueMode, support, lineHeight, refCb, onJump }: UnitProps) {
  const faded = support !== "full";
  const fade = faded ? supportText(u, support) : null;
  const cueParts = u.parts.filter((p) => p.t === "cue") as { t: "cue"; cue: CueId }[];

  const cueEl = (cue: CueId, key: string) => {
    const d = cueDisplay(cue, cueMode);
    if (d === "none") return null;
    return d === "dot" ? <CueDot key={key} cue={cue} /> : <CueChip key={key} cue={cue} left={state === "active" && pauseLeft !== null && /pause|breathe/.test(cue) ? pauseLeft : null} />;
  };

  // Count visible words so the active unit can show how far through it we should be.
  let readWords = Infinity;
  if (state === "active") {
    const totalWords = u.parts.reduce((n, p) => n + (p.t === "text" || p.t === "em" ? p.text.split(/\s+/).filter(Boolean).length : p.t === "ph" ? 1 : 0), 0);
    readWords = Math.floor(frac * totalWords + 0.0001);
  }
  let wi = 0;
  const words = (text: string, cls: string, k: string) =>
    text.split(/(\s+)/).map((tok, i) => {
      if (!tok || /^\s+$/.test(tok)) return tok;
      const read = wi++ < readWords;
      return (
        <span key={`${k}-${i}`} className={cx(cls, state === "active" && !read && "opacity-60")}>
          {tok}
        </span>
      );
    });

  const body = fade ? (
    <span className={support === "key-phrases" ? "text-blue" : ""}>{fade} </span>
  ) : (
    u.parts.map((p, i) => {
      if (p.t === "text") return state === "active" ? words(p.text, "", `t${i}`) : p.text;
      if (p.t === "em") return state === "active" ? <span key={i}>{words(p.text, "text-blue font-semibold", `e${i}`)}</span> : <span key={i} className="text-blue font-semibold">{p.text}</span>;
      if (p.t === "ph") {
        wi++;
        return p.value?.trim() ? <span key={i}>{p.value}</span> : <span key={i} className="rounded border border-dashed border-mute px-1 text-mute">[{p.label}]</span>;
      }
      return cueEl(p.cue, `c${i}`);
    })
  );

  return (
    <span
      ref={refCb}
      onClick={onJump}
      aria-current={state === "active" ? "true" : undefined}
      data-unit={u.id}
      data-state={state}
      // Vertical padding fills the gap between wrapped lines, so the highlight reads as one block.
      style={{ paddingBlock: `${Math.max(0, (lineHeight - 1.25) / 2)}em` }}
      className={cx(
        "cursor-pointer rounded box-decoration-clone px-1 -mx-1 transition-[opacity,background-color] duration-300",
        state === "active" && "bg-accent/10 text-ink",
        state === "past" && "text-ink opacity-35",
        state === "future" && "text-ink opacity-60",
      )}
    >
      {body}
      {fade && cueParts.map((c, i) => cueEl(c.cue, `f${i}`))}{" "}
    </span>
  );
});
