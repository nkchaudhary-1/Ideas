import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, SkipForward } from "lucide-react";
import { Badge, Button, IconButton, Select, cx } from "../components/ui/controls";
import { Card, EmptyState, PageHeader } from "../components/ui/layout";
import { useBeginDay } from "../components/BeginDay";
import { GuidedPhase, PrepPhase, ReflectionPhase, WarmUp } from "../components/session/phases";
import { ChallengePhase, FullInterviewPhase, InterviewPhase, SimulationPhase } from "../components/session/interviews";
import { Prompter } from "../components/prompter/Prompter";
import { go, href } from "../lib/router";
import { clockMs, useStore } from "../lib/store";
import { useLive, useNow } from "../lib/hooks";
import { completedDays, currentDay, programmeFinished, streak } from "../lib/stats";
import { CURRICULUM, PROGRAMME_DAYS, dayContent, levelFor, phasesForDay, plannedMinutes, weekOf } from "../content/curriculum";
import { fmtClock } from "../lib/analysis/text";

export function Practice({ dayParam, mode }: { dayParam?: string; mode?: string }) {
  const data = useStore((s) => s.data);
  const parsed = dayParam ? parseInt(dayParam, 10) : NaN;
  const day = Number.isFinite(parsed) && parsed >= 1 && parsed <= PROGRAMME_DAYS ? parsed : data.active?.day ?? currentDay(data);
  if (mode === "done") return <Summary day={day} />;
  if (mode === "run") return <Runner day={day} />;
  return <Overview day={day} />;
}

// ── Overview of a day ──────────────────────────────────────────────────────────────────────────────────────────

function Overview({ day }: { day: number }) {
  const data = useStore((s) => s.data);
  const c = dayContent(day);
  const phases = phasesForDay(day);
  const active = data.active && data.active.day === day ? data.active : null;
  const { begin, node } = useBeginDay();
  const lvl = levelFor(day);
  const doneBefore = data.sessions.filter((s) => s.day === day).length;
  return (
    <div>
      <PageHeader
        eyebrow={`Day ${day} of ${PROGRAMME_DAYS} · ${weekOf(day).short} · ${weekOf(day).name}`}
        title={c.topic}
        intro={c.objective}
        actions={
          <div className="w-56">
            <Select aria-label="Choose a day" value={day} onChange={(e) => go(`/practice/${e.target.value}`)}>
              {CURRICULUM.map((d) => (
                <option key={d.day} value={d.day}>
                  Day {d.day}
                </option>
              ))}
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{plannedMinutes(day)} minutes</Badge>
        <Badge>{lvl.label}</Badge>
        {doneBefore > 0 && <Badge>Completed {doneBefore}×</Badge>}
      </div>
      <ol className="mt-10 border-t border-line" aria-label="Steps in this session">
        {phases.map((p, i) => {
          const st = active?.status[i];
          const now = active && active.phaseIndex === i && st === "pending";
          return (
            <li key={p.id} className="flex items-center gap-4 border-b border-line py-5">
              <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs tnum", st === "done" ? "bg-accent text-onaccent" : now ? "border-2 border-accentfg text-ink" : "border border-line text-mute")}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-lg text-ink">{p.title}</p>
                <p className="text-sm text-mute">{p.blurb}</p>
              </div>
              <p className="text-sm tnum text-mute whitespace-nowrap">{st === "done" ? "Done" : st === "skipped" ? "Skipped" : now ? "In progress" : `${p.minutes} min`}</p>
            </li>
          );
        })}
      </ol>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={<ArrowRight size={18} />} onClick={() => begin(day)} data-testid="begin-day" className="px-6">
          {active ? `Continue Day ${day}` : `Start Day ${day}`}
        </Button>
        {c.script && (
          <a href={href(`/teleprompter/${day}`)} className="inline-flex h-9 coarse:h-11 items-center rounded-full border border-line bg-panel2 px-4 text-sm font-medium text-ink hover:bg-raised">
            Open the teleprompter only
          </a>
        )}
      </div>
      <Card className="mt-12">
        <h2 className="text-lg font-semibold text-ink">Today's coaching tip</h2>
        <p className="mt-2 text-base text-mute">{c.tip}</p>
      </Card>
      {node}
    </div>
  );
}

// ── The session ────────────────────────────────────────────────────────────────────────────────────────────────

function Runner({ day }: { day: number }) {
  const active = useStore((s) => s.data.active);
  const start = useStore((s) => s.startSession);
  const setRunning = useStore((s) => s.setRunning);
  const fold = useStore((s) => s.foldClock);
  const complete = useStore((s) => s.completePhase);
  const finish = useStore((s) => s.finishSession);
  const saveReflection = useStore((s) => s.saveReflection);
  const say = useStore((s) => s.say);
  const recording = useLive((s) => s.recording);
  const now = useNow(500);

  useEffect(() => {
    start(day);
    return () => setRunning(false);
  }, [day, start, setRunning]);
  useEffect(() => {
    const t = setInterval(fold, 5000);
    return () => clearInterval(t);
  }, [fold]);

  if (!active || active.day !== day) return null;
  const c = dayContent(day);
  const phases = phasesForDay(day);
  const idx = active.phaseIndex;
  const phase = phases[idx];
  const clock = active.clocks[idx];
  const running = !!clock.runningSince;
  const elapsed = clockMs(clock, now) / 1000;
  const remaining = phase.minutes * 60 - elapsed;
  const isLast = idx === phases.length - 1;

  const advance = (status: "done" | "skipped") => {
    complete(status);
    if (isLast) {
      finish();
      go(`/practice/${day}/done`);
    }
  };
  const leave = () => {
    setRunning(false);
    say("Saved. Continue from the dashboard");
    go("/");
  };

  const body = (() => {
    switch (phase.kind) {
      case "warmup":
        return <WarmUp day={day} paused={!running} onDone={() => advance("done")} />;
      case "teleprompter":
        return <Prompter day={day} heightClass="h-[calc(100dvh-15rem)] min-h-[26rem]" onDone={() => advance("done")} doneLabel={levelFor(day).support === "bullets" ? "Continue to bullet prompts" : "Continue to guided speaking"} />;
      case "guided":
        return <GuidedPhase day={day} onDone={() => advance("done")} />;
      case "challenge":
        return <ChallengePhase day={day} onDone={() => advance("done")} />;
      case "simulation":
        return <SimulationPhase day={day} onDone={() => advance("done")} />;
      case "prep":
        return <PrepPhase day={day} onDone={() => advance("done")} />;
      case "interview":
        return <InterviewPhase day={day} onDone={() => advance("done")} />;
      case "full-interview":
        return <FullInterviewPhase day={day} onDone={() => advance("done")} />;
      case "reflection":
        return (
          <ReflectionPhase
            day={day}
            sessionId={active.id}
            title={phase.title}
            onFinish={(answers) => {
              if (answers.some((a) => a.trim())) saveReflection(day, answers, active.id);
              advance("done");
            }}
          />
        );
    }
  })();

  return (
    <div data-testid="runner">
      <header className="mb-6 flex items-center gap-3">
        <IconButton label="Leave the session. Your place is saved" onClick={leave} data-testid="leave">
          <ArrowLeft size={20} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-mute" title={c.topic}>
            Day {day} · Step {idx + 1} of {phases.length}
            <span className="sm:hidden tnum"> · {remaining >= 0 ? `${fmtClock(remaining)} left` : `+${fmtClock(-remaining)}`}</span>
          </p>
          <p className="truncate text-base text-ink" data-testid="phase-title">{phase.title}</p>
        </div>
        <p className={cx("hidden text-sm tnum whitespace-nowrap sm:block", remaining < 0 ? "text-accentfg" : "text-mute")} role="timer" aria-label={remaining >= 0 ? `${fmtClock(remaining)} left in this step` : `${fmtClock(-remaining)} over the planned time`} data-testid="phase-timer">
          {remaining >= 0 ? `${fmtClock(remaining)} left` : `+${fmtClock(-remaining)}`}
        </p>
        <IconButton
          label={recording ? "Stop recording before pausing" : running ? "Pause the session" : "Resume the session"}
          variant="secondary"
          disabled={recording}
          onClick={() => setRunning(!running)}
          data-testid="pause"
        >
          {running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </IconButton>
        <Button variant="ghost" aria-label="Skip this step" title="Skip this step" onClick={() => advance("skipped")} data-testid="skip-step" className="!px-0 w-9 coarse:w-11 sm:w-auto sm:!px-4">
          <SkipForward size={18} aria-hidden className="sm:hidden" />
          <span className="hidden sm:inline">Skip step</span>
        </Button>
      </header>
      <ol className="mb-10 flex gap-1" aria-label="Session steps">
        {phases.map((p, i) => (
          <li key={p.id} className="flex-1" aria-current={i === idx ? "step" : undefined}>
            <span className={cx("block h-1 rounded-full", active.status[i] === "done" ? "bg-accent" : active.status[i] === "skipped" ? "bg-mute" : i === idx ? "bg-ink" : "bg-line")} />
            <span className={cx("mt-2 hidden truncate text-xs sm:block", i === idx ? "text-ink" : "text-mute")}>{p.title}</span>
          </li>
        ))}
      </ol>
      <div className="relative" key={`${active.id}-${idx}`}>
        <div className="animate-rise">{body}</div>
        {!running && (
          <div className="absolute inset-0 z-30 flex items-start justify-center bg-bg/85 pt-24 backdrop-blur-sm" data-testid="paused">
            <Card as="div" className="max-w-sm text-center">
              <p className="text-2xl font-semibold text-ink">Paused</p>
              <p className="mt-2 text-base text-mute">The clock is stopped. Take a breath.</p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <Button variant="primary" icon={<Play size={16} fill="currentColor" />} onClick={() => setRunning(true)} data-testid="resume">
                  Resume
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ── After the session ──────────────────────────────────────────────────────────────────────────────────────────

function Summary({ day }: { day: number }) {
  const data = useStore((s) => s.data);
  const rec = data.sessions.filter((s) => s.day === day).slice(-1)[0];
  const { begin, node } = useBeginDay();
  if (!rec) return <EmptyState title="No session to show" body="Finish a practice session and its summary appears here." action={<Button variant="primary" onClick={() => go("/")}>Back to the dashboard</Button>} />;
  const attempts = data.attempts.filter((a) => rec.attemptIds.includes(a.id) && a.kind !== "read-aloud");
  const next = currentDay(data);
  const finished = programmeFinished(data);
  const skipped = rec.phases.filter((p) => p.status === "skipped").length;
  return (
    <div>
      <p className="text-sm text-mute">Day {day} · {dayContent(day).topic}</p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight text-ink" data-testid="complete-title">Day {day} complete.</h1>
      <p className="mt-4 max-w-2xl text-lg text-mute">
        {Math.max(1, Math.round(rec.activeSec / 60))} minutes of practice{skipped ? `, ${skipped} step${skipped > 1 ? "s" : ""} skipped` : ""}. Streak: {streak(data)} {streak(data) === 1 ? "day" : "days"}. {completedDays(data).size} of {PROGRAMME_DAYS} days done.
      </p>
      {attempts.length > 0 && (
        <section className="mt-10" aria-labelledby="answers">
          <h2 id="answers" className="text-lg font-semibold text-ink">Today's answers</h2>
          <ul className="mt-3 border-t border-line">
            {attempts.map((a) => (
              <li key={a.id} className="border-b border-line">
                <a href={href(`/analysis/${a.id}`)} className="flex items-baseline justify-between gap-4 py-4 hover:text-accentfg">
                  <span className="min-w-0 truncate text-base text-ink">{a.question}</span>
                  <span className="shrink-0 text-sm tnum text-mute">{a.analysis?.scored ? `Readiness ${a.analysis.scores.readiness.value ?? "n/a"}/10` : "Too short to score"}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        {!finished && (
          <Button variant="primary" icon={<ArrowRight size={18} />} onClick={() => begin(next)} data-testid="next-day">
            Start Day {next} now
          </Button>
        )}
        <Button onClick={() => go("/")}>Back to the dashboard</Button>
        <Button variant="ghost" onClick={() => go("/progress")}>See progress</Button>
      </div>
      {!finished && <p className="mt-4 text-sm text-mute">One session a day is the plan, but Day {next} is open whenever you want it.</p>}
      {node}
    </div>
  );
}
