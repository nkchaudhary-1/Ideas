import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { AnswerFlow } from "../AnswerFlow";
import { Button, TextArea } from "../ui/controls";
import { Card, Disclosure, ProgressBar } from "../ui/layout";
import { Report } from "../Report";
import { dayContent, levelFor, warmupFor } from "../../content/curriculum";
import { useStore } from "../../lib/store";
import { improvement, scoredAttempts } from "../../lib/stats";
import { fmtClock } from "../../lib/analysis/text";
import { REFLECTION_QUESTIONS, type Attempt } from "../../lib/types";

// ── Warm-up ────────────────────────────────────────────────────────────────────────────────────────────────────

export function WarmUp({ day, paused, onDone }: { day: number; paused: boolean; onDone: () => void }) {
  const list = useMemo(() => warmupFor(day), [day]);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(list[0].seconds);
  const [finished, setFinished] = useState(false);
  const ref = useRef(left);
  ref.current = left;

  useEffect(() => {
    if (paused || finished) return;
    const t = setInterval(() => {
      if (ref.current > 0) setLeft((x) => x - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [paused, finished, i]);

  // Move on by itself a moment after the countdown ends, so the warm-up works hands-free.
  useEffect(() => {
    if (left > 0 || paused || finished) return;
    const t = setTimeout(() => go(i + 1), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, paused, finished]);

  const go = (n: number) => {
    if (n >= list.length) return setFinished(true);
    setI(n);
    setLeft(list[n].seconds);
  };
  const ex = list[i];

  if (finished)
    return (
      <div className="py-6">
        <h2 className="text-3xl font-semibold tracking-tight text-ink">Voice warm.</h2>
        <p className="mt-3 max-w-xl text-lg text-mute">Your breath, jaw and lips are ready. Roll your shoulders once, sit tall, and move on.</p>
        <Button variant="primary" className="mt-8" icon={<ArrowRight size={16} />} onClick={onDone} data-testid="warmup-done">
          Continue
        </Button>
      </div>
    );

  return (
    <div className="py-2">
      <p className="text-sm text-mute">Exercise {i + 1} of {list.length}</p>
      <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink">{ex.title}</h2>
      <p className="mt-4 max-w-2xl text-xl text-mute" data-testid="warmup-how">{ex.how}</p>
      <div className="mt-8 flex items-end gap-6">
        <p className="text-6xl font-semibold tnum text-ink" role="timer" aria-label={`${left} seconds left`}>{fmtClock(left)}</p>
        <ProgressBar value={1 - left / ex.seconds} className="mb-4 flex-1" label="Exercise progress" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => go(i + 1)} data-testid="warmup-next">
          {i + 1 < list.length ? "Next exercise" : "Finish warm-up"}
        </Button>
        {i > 0 && <Button variant="ghost" onClick={() => go(i - 1)}>Previous</Button>}
      </div>
    </div>
  );
}

// ── Guided speaking ────────────────────────────────────────────────────────────────────────────────────────────

export function KeywordMap({ groups }: { groups: { heading: string; points: string[] }[] }) {
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2" data-testid="keyword-map">
      {groups.map((g) => (
        <div key={g.heading}>
          <p className="text-sm text-mute mb-2">{g.heading}</p>
          <ul className="flex flex-wrap gap-2">
            {g.points.map((p) => (
              <li key={p} className="inline-flex h-9 items-center rounded-full bg-panel2 px-4 text-sm text-ink">
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function GuidedPhase({ day, onDone }: { day: number; onDone: () => void }) {
  const c = dayContent(day);
  const lvl = levelFor(day);
  return (
    <div>
      <p className="text-sm text-mute">Guided speaking · {lvl.support === "bullets" ? "bullet prompts after the script" : "keywords only, no sentences"}</p>
      <h2 className="mt-3 max-w-3xl text-2xl sm:text-3xl font-semibold tracking-tight text-ink" data-testid="question">{c.questions[0].replace(/\.$/, "")}</h2>
      <p className="mt-3 max-w-2xl text-base text-mute">Explain it in your own words. Use these as a map, not a script. {c.tip}</p>
      <Card className="mt-8">
        <KeywordMap groups={c.guided} />
      </Card>
      <div className="mt-8">
        <AnswerFlow day={day} kind="guided" question={c.questions[0]} keyPoints={c.keyPoints} targetSec={c.target}>
          {() => (
            <Button variant="primary" icon={<ArrowRight size={16} />} onClick={onDone} data-testid="guided-done">
              Continue
            </Button>
          )}
        </AnswerFlow>
      </div>
    </div>
  );
}

// ── Day 29 preparation ─────────────────────────────────────────────────────────────────────────────────────────

export function PrepPhase({ day, onDone }: { day: number; onDone: () => void }) {
  const c = dayContent(day);
  const notes = useStore((s) => s.data.notes[day] ?? "");
  const setNotes = useStore((s) => s.setNotes);
  return (
    <div>
      <p className="text-sm text-mute">Guided preparation</p>
      <h2 className="mt-3 max-w-3xl text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{c.questions[0]}</h2>
      <p className="mt-3 max-w-2xl text-base text-mute">Plan your answer in keywords. In the next step you speak without reading, so write only words you can expand, never full sentences.</p>
      <Card className="mt-8">
        <KeywordMap groups={c.guided} />
      </Card>
      <div className="mt-8">
        <label htmlFor="notes" className="block text-base text-ink mb-2">Your keywords</label>
        <TextArea id="notes" rows={6} value={notes} onChange={(e) => setNotes(day, e.target.value)} placeholder={"Days 1 to 30: listen, meet PM and engineers, audit\nDays 31 to 60: …\nDays 61 to 90: …"} data-testid="prep-notes" />
        <p className="mt-2 text-sm text-mute">Saved on this device as you type.</p>
      </div>
      <Button variant="primary" className="mt-8" icon={<ArrowRight size={16} />} onClick={onDone} data-testid="prep-done">
        I'm ready, start the interview
      </Button>
    </div>
  );
}

// ── Reflection ─────────────────────────────────────────────────────────────────────────────────────────────────

function ScoreLine({ a }: { a: Attempt }) {
  const r = a.analysis?.scores.readiness.value;
  return (
    <li className="flex items-baseline justify-between gap-4 border-t border-line py-3 text-sm">
      <span className="min-w-0 truncate text-ink">{a.question}</span>
      <span className="shrink-0 tnum text-mute">{a.analysis?.scored ? `${r ?? "n/a"}/10` : "Too short to score"}</span>
    </li>
  );
}

export function ReflectionPhase({ day, sessionId, title, onFinish }: { day: number; sessionId: string; title: string; onFinish: (answers: [string, string, string, string]) => void }) {
  const c = dayContent(day);
  const attempts = useStore((s) => s.data.attempts);
  const data = useStore((s) => s.data);
  const mine = attempts.filter((a) => a.sessionId === sessionId || (data.active?.attemptIds ?? []).includes(a.id));
  const scored = mine.filter((a) => a.analysis?.scored && a.kind !== "read-aloud");
  const avg = scored.length ? Math.round((scored.reduce((n, a) => n + (a.analysis!.scores.readiness.value ?? 0), 0) / scored.length) * 10) / 10 : null;
  const [answers, setAnswers] = useState<[string, string, string, string]>(["", "", "", ""]);
  const imp = improvement(data);
  const last = scoredAttempts(data);

  return (
    <div>
      <p className="text-sm text-mute">{title}</p>
      <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">How did that go?</h2>

      {mine.length > 0 && (
        <div className="mt-6 max-w-2xl">
          <p className="text-base text-mute">
            {mine.length} {mine.length === 1 ? "answer" : "answers"} today{avg !== null ? `, average readiness ${avg}/10` : ""}.
          </p>
          <ul className="mt-2">{mine.slice(-6).map((a) => <ScoreLine key={a.id} a={a} />)}</ul>
        </div>
      )}

      {day === 29 && c.reference && (
        <div className="mt-8 max-w-2xl">
          <Disclosure title="Compare with a model answer (open it after you have spoken)">
            <p className="whitespace-pre-line text-base text-mute select-text">{c.reference}</p>
          </Disclosure>
        </div>
      )}
      {day === 30 && (
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-ink">Final evaluation</h3>
          {imp ? (
            <p className="mt-3 text-base text-mute">Across {imp.n} answers we could score, interview readiness moved from {imp.from} to {imp.to} ({imp.delta > 0 ? "+" : ""}{imp.delta}). {last.length > 0 && "Open Progress for the full picture, week by week."}</p>
          ) : (
            <p className="mt-3 text-base text-mute">There are not yet enough scored answers to show a trend. Open Progress after your next sessions.</p>
          )}
          {scored.length > 0 && (
            <div className="mt-6 -mx-0">
              <Disclosure title="The strongest answer of the simulation" defaultOpen>
                <Report attempt={scored.slice().sort((a, b) => (b.analysis!.scores.readiness.value ?? 0) - (a.analysis!.scores.readiness.value ?? 0))[0]} />
              </Disclosure>
            </div>
          )}
        </Card>
      )}

      <div className="mt-10 max-w-2xl space-y-6">
        {REFLECTION_QUESTIONS.map((q, i) => (
          <div key={q}>
            <label htmlFor={`refl-${i}`} className="block text-base text-ink mb-2">{q}</label>
            <TextArea id={`refl-${i}`} rows={2} value={answers[i]} onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)) as [string, string, string, string])} />
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={<Check size={16} />} onClick={() => onFinish(answers)} data-testid="finish-session">
          Save and finish today
        </Button>
        <p className="text-sm text-mute">Saved to your journal on this device.</p>
      </div>
    </div>
  );
}

