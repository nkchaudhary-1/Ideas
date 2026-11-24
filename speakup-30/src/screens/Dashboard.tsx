import { ArrowRight, ChevronRight } from "lucide-react";
import { Button, Badge, cx } from "../components/ui/controls";
import { Card, ProgressBar, SectionTitle, Stat } from "../components/ui/layout";
import { Sparkline } from "../components/charts/Sparkline";
import { useBeginDay } from "../components/BeginDay";
import { href, go } from "../lib/router";
import { clockMs, useStore } from "../lib/store";
import { completedDays, currentDay, improvement, last7, lastSession, practisedToday, programmeFinished, scoreSeries, streak, totals, weekProgress } from "../lib/stats";
import { PROGRAMME_DAYS, WEEKS, dayContent, levelFor, phasesForDay, plannedMinutes, weekOf } from "../content/curriculum";
import { fmtClock } from "../lib/analysis/text";
import { fmtDate } from "../lib/time";

export function Dashboard() {
  const data = useStore((s) => s.data);
  const { begin, node } = useBeginDay();
  const day = currentDay(data);
  const c = dayContent(day);
  const week = weekOf(day);
  const finished = programmeFinished(data);
  const done = completedDays(data);
  const t = totals(data);
  const wp = weekProgress(data, day);
  const imp = improvement(data);
  const last = lastSession(data);
  const lastAttempts = last ? data.attempts.filter((a) => last.attemptIds.includes(a.id) && a.analysis?.scored) : [];
  const lastBest = lastAttempts.length ? lastAttempts[lastAttempts.length - 1] : null;
  const active = data.active;
  const activePhase = active ? phasesForDay(active.day)[active.phaseIndex] : null;
  const activeMs = active ? active.clocks.reduce((n, k) => n + clockMs(k), 0) : 0;
  const phases = phasesForDay(day);

  return (
    <div>
      {/* Today */}
      <section aria-labelledby="today">
        <p className="text-sm text-mute">
          {finished ? "Programme complete" : `Day ${day} of ${PROGRAMME_DAYS}`} · {week.short} · <span className="text-ink">{week.name}</span>
        </p>
        <h1 id="today" className="mt-4 max-w-3xl text-3xl sm:text-5xl font-semibold tracking-tight text-ink" data-testid="today-topic">
          {finished ? "You finished all 30 days." : c.topic}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-mute" data-testid="today-objective">
          {finished ? "Keep your edge: repeat the full interview simulation, or review how far you've come." : c.objective}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge tone="accent">{plannedMinutes(day)} minutes</Badge>
          <Badge>{c.skill.length > 56 ? "Interview skills" : c.skill}</Badge>
          <Badge>{levelFor(day).label}</Badge>
        </div>
        <p className="mt-4 text-sm text-mute">{phases.map((p) => `${p.title} ${p.minutes} min`).join(" · ")}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={<ArrowRight size={18} />} onClick={() => begin(day)} data-testid="start-today" className="px-6">
            Start today's practice
          </Button>
          <Button onClick={() => active && go(`/practice/${active.day}/run`)} disabled={!active} data-testid="continue" title={active ? undefined : "Nothing is in progress yet"}>
            Continue where I left off
          </Button>
        </div>
        <p className="mt-3 text-sm text-mute" aria-live="polite">
          {active && activePhase ? `Day ${active.day} is in progress: ${activePhase.title}, ${fmtClock(activeMs / 1000)} so far.` : practisedToday(data) ? `You've already practised today. Day ${day} is ready whenever you are.` : "Nothing in progress yet."}
        </p>
      </section>

      {/* Numbers, not widgets */}
      <section aria-label="Your numbers" className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-line pt-10 sm:grid-cols-4">
        <Stat label="Current streak" value={`${streak(data)} ${streak(data) === 1 ? "day" : "days"}`} />
        <Stat label="Sessions completed" value={t.sessions} />
        <div>
          <Stat label="Programme" value={`${t.days} of ${PROGRAMME_DAYS}`} />
          <ProgressBar value={t.days / PROGRAMME_DAYS} className="mt-3" label="Programme progress" />
        </div>
        <div>
          <Stat label={`${wp.week.short} this week`} value={`${wp.done} of ${wp.total}`} />
          <div className="mt-3 flex gap-1" aria-label="Last seven days">
            {last7(data).map((d) => (
              <span key={d.key} title={d.key} className={cx("h-2 flex-1 rounded-full", d.done ? "bg-accent" : "bg-line")} />
            ))}
          </div>
        </div>
      </section>

      {/* 30-day timeline */}
      <section aria-labelledby="timeline" className="mt-14">
        <SectionTitle action={<a href={href("/curriculum")} className="inline-flex min-h-8 items-center gap-1 text-sm text-mute hover:text-ink">Curriculum <ChevronRight size={16} aria-hidden /></a>}>
          <span id="timeline">The 30 days</span>
        </SectionTitle>
        <div className="flex flex-wrap gap-x-8 gap-y-6">
          {WEEKS.map((w) => (
            <div key={w.id}>
              <p className="mb-2 text-xs text-mute">{w.short}</p>
              <ol className="flex gap-1">
                {Array.from({ length: w.to - w.from + 1 }, (_, i) => w.from + i).map((d) => {
                  const isDone = done.has(d);
                  const isNow = d === day && !finished;
                  return (
                    <li key={d}>
                      <a
                        href={href(`/curriculum/${d}`)}
                        aria-label={`Day ${d}: ${dayContent(d).topic}${isDone ? ", completed" : isNow ? ", today" : ""}`}
                        aria-current={isNow ? "step" : undefined}
                        className={cx(
                          "flex h-8 w-8 items-center justify-center rounded-full text-xs tnum transition-colors duration-150",
                          isDone ? "bg-accent text-onaccent font-medium" : isNow ? "border-2 border-accentfg text-ink" : "border border-line text-mute hover:border-mute",
                        )}
                      >
                        {d}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Last session and improvement */}
      <section className="mt-14 grid gap-6 md:grid-cols-2">
        <Card aria-labelledby="last">
          <h2 id="last" className="text-lg font-semibold text-ink">Last practice session</h2>
          {last ? (
            <div className="mt-4">
              <p className="text-base text-ink">Day {last.day} · {dayContent(last.day).topic}</p>
              <p className="mt-1 text-sm text-mute">{fmtDate(last.completedAt)} · {Math.max(1, Math.round(last.activeSec / 60))} min · {last.phases.filter((p) => p.status === "done").length} of {last.phases.length} steps</p>
              {lastBest?.analysis ? (
                <p className="mt-4 text-sm text-ink">
                  Readiness {lastBest.analysis.scores.readiness.value ?? "n/a"}/10. {lastBest.analysis.improve[0] ?? lastBest.analysis.wentWell[0] ?? ""}
                </p>
              ) : (
                <p className="mt-4 text-sm text-mute">No scored answer in that session.</p>
              )}
              {lastBest && (
                <a href={href(`/analysis/${lastBest.id}`)} className="mt-3 inline-flex min-h-8 items-center gap-1 text-sm text-accentfg hover:underline">
                  Open the report <ChevronRight size={16} aria-hidden />
                </a>
              )}
            </div>
          ) : (
            <p className="mt-4 text-base text-mute">Your first session will show up here.</p>
          )}
        </Card>
        <Card aria-labelledby="improve">
          <h2 id="improve" className="text-lg font-semibold text-ink">Overall speaking improvement</h2>
          {imp ? (
            <div className="mt-4">
              <div className="flex items-end justify-between gap-4">
                <p className="text-4xl font-semibold tracking-tight tnum text-ink">{imp.delta > 0 ? "+" : ""}{imp.delta}</p>
                <Sparkline values={scoreSeries(data, "readiness").map((s) => s.v)} />
              </div>
              <p className="mt-2 text-sm text-mute">Interview readiness moved from {imp.from} to {imp.to} across {imp.n} answers we could score. A small sample, so read it as a direction, not a verdict.</p>
            </div>
          ) : (
            <p className="mt-4 text-base text-mute">Complete two answers that we can score and your trend appears here. Nothing is shown until there is real data.</p>
          )}
        </Card>
      </section>
      {node}
    </div>
  );
}
