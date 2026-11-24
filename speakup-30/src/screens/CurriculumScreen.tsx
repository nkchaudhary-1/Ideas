import { Check } from "lucide-react";
import { Badge, Button, cx } from "../components/ui/controls";
import { Dialog } from "../components/ui/Dialog";
import { Disclosure, PageHeader, ProgressBar } from "../components/ui/layout";
import { KeywordMap } from "../components/session/phases";
import { useBeginDay } from "../components/BeginDay";
import { go, href } from "../lib/router";
import { useStore } from "../lib/store";
import { completedDays, currentDay } from "../lib/stats";
import { CURRICULUM, WEEKS, dayContent, levelFor, phasesForDay, plannedMinutes } from "../content/curriculum";
import { parseScript } from "../lib/script";

export function CurriculumScreen({ dayParam }: { dayParam?: string }) {
  const data = useStore((s) => s.data);
  const done = completedDays(data);
  const cur = currentDay(data);
  const n = dayParam ? parseInt(dayParam, 10) : NaN;
  const open = Number.isFinite(n) && n >= 1 && n <= 30 ? n : null;
  const { begin, node } = useBeginDay();

  return (
    <div>
      <PageHeader eyebrow="Thirty days, four phases and a final interview" title="30-day curriculum" intro="A curated programme for Senior Product Designer interviews. Support is removed week by week: full scripts first, then bullets, then keywords, then nothing." />
      <div className="space-y-14">
        {WEEKS.map((w) => {
          const days = CURRICULUM.filter((d) => d.day >= w.from && d.day <= w.to);
          const count = days.filter((d) => done.has(d.day)).length;
          return (
            <section key={w.id} aria-labelledby={`w${w.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 id={`w${w.id}`} className="text-2xl font-semibold tracking-tight text-ink">{w.short} · {w.name}</h2>
                <p className="text-sm tnum text-mute">{count} of {days.length} days</p>
              </div>
              <p className="mt-2 max-w-2xl text-base text-mute">Goal: {w.goal}</p>
              <ProgressBar value={count / days.length} className="mt-4" label={`${w.short} progress`} />
              <ol className="mt-4 border-t border-line">
                {days.map((d) => (
                  <li key={d.day} className="border-b border-line">
                    <a href={href(`/curriculum/${d.day}`)} className="flex items-center gap-4 py-4 hover:bg-panel/40" data-testid={`day-row-${d.day}`}>
                      <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs tnum", done.has(d.day) ? "bg-accent text-onaccent" : d.day === cur ? "border-2 border-accentfg text-ink" : "border border-line text-mute")}>
                        {done.has(d.day) ? <Check size={14} aria-label="Completed" /> : d.day}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base text-ink">{d.topic}</span>
                        <span className="block truncate text-sm text-mute">{d.skill}</span>
                      </span>
                      <span className="hidden text-sm tnum text-mute sm:block">{plannedMinutes(d.day)} min</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <Dialog open={open !== null} onClose={() => go("/curriculum")} title={open ? `Day ${open}` : ""} wide>
        {open && <DayDetail day={open} onStart={() => begin(open)} />}
      </Dialog>
      {node}
    </div>
  );
}

function DayDetail({ day, onStart }: { day: number; onStart: () => void }) {
  const c = dayContent(day);
  const phases = phasesForDay(day);
  const doc = c.script ? parseScript(c.script) : null;
  return (
    <div>
      <p className="text-xl text-ink">{c.topic}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="accent">{plannedMinutes(day)} minutes</Badge>
        <Badge>{levelFor(day).label}</Badge>
      </div>
      <p className="mt-4 text-base text-mute"><span className="text-ink">Skill: </span>{c.skill}</p>
      <p className="mt-2 text-base text-mute"><span className="text-ink">Objective: </span>{c.objective}</p>
      <ol className="mt-6 space-y-1 text-sm text-mute">
        {phases.map((p) => (
          <li key={p.id} className="flex justify-between gap-4"><span className="text-ink">{p.title}</span><span className="tnum">{p.minutes} min</span></li>
        ))}
      </ol>
      <div className="mt-6">
        <Disclosure title="Keywords you will speak from">
          <KeywordMap groups={c.guided} />
        </Disclosure>
        <Disclosure title="Interview questions" meta={<span className="tnum">{(c.segments?.length ?? c.questions.length)}</span>}>
          <ul className="list-disc space-y-2 pl-5 text-base text-ink">
            {(c.segments && day >= 29 ? c.segments.map((s) => s.question) : c.questions).map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </Disclosure>
        {doc && (
          <Disclosure title="Script preview" meta={<span className="tnum">{doc.words} words</span>}>
            <div className="space-y-3 text-base text-mute select-text">
              {Array.from({ length: doc.paras }, (_, p) => (
                <p key={p}>{doc.units.filter((u) => u.para === p).map((u) => u.plain).join(" ")}</p>
              ))}
              <p className="text-sm">Pauses and delivery cues appear in the teleprompter.</p>
            </div>
          </Disclosure>
        )}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onStart} data-testid="curriculum-start">Practise Day {day}</Button>
        {c.script && <Button onClick={() => go(`/teleprompter/${day}`)}>Open in the teleprompter</Button>}
      </div>
    </div>
  );
}
