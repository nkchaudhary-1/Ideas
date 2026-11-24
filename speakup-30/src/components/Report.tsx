import { useState } from "react";
import { Check, Minus, Sparkles, X } from "lucide-react";
import { Button, Badge, cx } from "./ui/controls";
import { Disclosure } from "./ui/layout";
import { useStore } from "../lib/store";
import { reviewAnswer, AIError } from "../lib/ai";
import { IN_ARTIFACT } from "../lib/env";
import { fmtClock } from "../lib/analysis/text";
import { fmtDateTime } from "../lib/time";
import { href } from "../lib/router";
import type { Attempt, Score } from "../lib/types";

const ROWS: { key: keyof NonNullable<Attempt["analysis"]>["scores"]; label: string }[] = [
  { key: "clarity", label: "Clarity" },
  { key: "fluency", label: "Fluency" },
  { key: "structure", label: "Structure" },
  { key: "pace", label: "Pacing" },
  { key: "fillers", label: "Filler word control" },
  { key: "phrasing", label: "Phrasing" },
  { key: "relevance", label: "Interview relevance" },
];

function ScoreRow({ label, score }: { label: string; score: Score }) {
  return (
    <div title={score.note}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-base text-ink">{label}</span>
        <span className={cx("text-base tnum", score.value === null ? "text-mute" : "text-ink font-medium")}>{score.value === null ? "Not scored" : `${score.value}/10`}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-line overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(score.value ?? 0) * 10}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded bg-panel2 p-4">
      <p className="text-sm text-mute">{label}</p>
      <p className="mt-1 text-xl font-semibold tnum text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-mute">{note}</p>}
    </div>
  );
}

export function Report({ attempt }: { attempt: Attempt }) {
  const a = attempt.analysis;
  const settings = useStore((s) => s.data.settings);
  const setAI = useStore((s) => s.setAttemptAI);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const aiReady = settings.ai.enabled && settings.ai.apiKey.trim().length > 0;

  if (!a || a.wordCount === 0)
    return (
      <div className="rounded bg-panel2 p-6">
        <p className="text-base text-ink">There is no transcript to analyse yet.</p>
        <p className="mt-1 text-sm text-mute">Type or paste what you said above and update the report. The scores come from your real words and your real recording, never from placeholder data.</p>
      </div>
    );

  const m = a.metrics;
  const runAI = async () => {
    setBusy(true);
    setErr(null);
    try {
      const review = await reviewAnswer({
        apiKey: settings.ai.apiKey,
        model: settings.ai.model,
        question: attempt.question,
        transcript: attempt.transcript,
        day: attempt.day,
        durationSec: attempt.durationSec,
        wpm: m.wpm,
        fillerPer100: m.fillerPer100,
        longPauses: m.longPauses,
        keyPointLabels: (attempt.keyPoints ?? []).map((k) => k.label),
      });
      setAI(attempt.id, review);
    } catch (e) {
      setErr(e instanceof AIError ? e.message : "The review failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article aria-label="Your speaking report" data-testid="report">
      <header className="mb-8">
        <h3 className="text-2xl font-semibold tracking-tight text-ink">Your speaking report</h3>
        <p className="mt-2 text-sm text-mute">
          {fmtDateTime(attempt.at)} · {a.wordCount} words{m.durationSec ? ` · ${fmtClock(m.durationSec)}` : ""}
          {m.wpm !== null ? ` · about ${m.wpm} words per minute` : ""}
        </p>
      </header>

      {!a.scored ? (
        <div className="rounded bg-panel2 p-6 mb-8">
          <p className="text-base text-ink">This answer is too short to score.</p>
          <p className="mt-1 text-sm text-mute">Speak for at least 20 seconds (about 15 words) to get a report. Scores for very short answers would not be honest.</p>
        </div>
      ) : (
        <>
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-6" data-testid="readiness">
            <div>
              <p className="text-sm text-mute">Interview readiness</p>
              <p className="mt-1 text-5xl font-semibold tracking-tight tnum text-ink">{a.scores.readiness.value === null ? "n/a" : a.scores.readiness.value}<span className="text-xl text-mute">/10</span></p>
            </div>
            <p className="max-w-xs text-sm text-mute text-right">{a.scores.readiness.note}</p>
          </div>
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 mb-10" data-testid="scores">
            {ROWS.map((r) => (
              <ScoreRow key={r.key} label={r.label} score={a.scores[r.key]} />
            ))}
          </div>
        </>
      )}

      {a.wentWell.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-ink mb-3">What you did well</h4>
          <ul className="space-y-3">
            {a.wentWell.map((t, i) => (
              <li key={i} className="flex gap-3 text-base text-ink">
                <Check size={20} className="mt-0.5 shrink-0 text-accentfg" aria-hidden /> <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {a.improve.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-ink mb-3">Improve next time</h4>
          <ul className="space-y-3">
            {a.improve.map((t, i) => (
              <li key={i} className="flex gap-3 text-base text-ink">
                <Minus size={20} className="mt-0.5 shrink-0 text-mute" aria-hidden /> <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {a.better && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-ink mb-3">Better sentence</h4>
          <div className="space-y-3">
            <p className="rounded bg-panel2 p-4 text-base text-mute select-text">
              <span className="block text-xs text-mute mb-1">You said</span>
              {a.better.original}
            </p>
            <p className="rounded border border-accentfg/40 bg-accent/5 p-4 text-base text-ink select-text">
              <span className="block text-xs text-accentfg mb-1">Try this</span>
              {a.better.better}
            </p>
            <p className="text-sm text-mute">{a.better.changes.join(" · ")}. Built from your own words, so adjust it until it sounds like you.</p>
          </div>
        </div>
      )}

      {/* Optional AI review (not offered in the artifact, whose page cannot reach Anthropic) */}
      {!IN_ARTIFACT && (
      <div className="mb-8 rounded bg-panel2 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-ink flex items-center gap-2">
              <Sparkles size={18} className="text-accentfg" aria-hidden /> AI review
            </h4>
            <p className="text-sm text-mute mt-1">
              {aiReady ? `Sends the transcript text, not the audio, to Anthropic using your key (${settings.ai.model}).` : "Optional. Needs an Anthropic API key, which you add in Settings. The scores above work without it."}
            </p>
          </div>
          {aiReady ? (
            <Button onClick={runAI} disabled={busy || !a.scored} data-testid="ai-review">
              {busy ? "Reviewing" : attempt.ai ? "Review again" : "Get an AI review"}
            </Button>
          ) : (
            <a href={href("/settings")} className="inline-flex h-9 coarse:h-11 items-center rounded-full border border-line px-4 text-sm text-ink hover:bg-raised">
              Set up in Settings
            </a>
          )}
        </div>
        {err && (
          <p role="alert" className="mt-4 text-sm text-rec">
            {err}
          </p>
        )}
        {attempt.ai && (
          <div className="mt-6 space-y-5">
            <p className="text-base text-ink">{attempt.ai.summary}</p>
            {attempt.ai.wentWell.length > 0 && (
              <ul className="space-y-2 text-sm text-ink list-disc pl-5">
                {attempt.ai.wentWell.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
            {attempt.ai.improve.length > 0 && (
              <ul className="space-y-2 text-sm text-mute list-disc pl-5">
                {attempt.ai.improve.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
            {attempt.ai.betterSentences.map((b, i) => (
              <div key={i} className="space-y-2 text-sm">
                <p className="text-mute select-text">{b.original}</p>
                <p className="text-ink select-text">{b.better}</p>
                <p className="text-mute">{b.why}</p>
              </div>
            ))}
            {attempt.ai.followUp && <p className="text-sm text-ink"><span className="text-mute">Likely follow-up: </span>{attempt.ai.followUp}</p>}
            <p className="text-xs text-mute">Written by {attempt.ai.model}. It can make mistakes, so use your own judgement.</p>
          </div>
        )}
      </div>
      )}

      <div className="-mx-0">
        <Disclosure title="Filler words" meta={<span className="tnum">{m.fillerCount} counted</span>}>
          {a.fillers.length === 0 ? (
            <p className="text-base text-mute">No filler words from the list were found.</p>
          ) : (
            <div className="space-y-5">
              {a.fillers.map((f) => (
                <div key={f.label}>
                  <p className="text-base text-ink">
                    “{f.label}” <span className="text-mute">· {f.counted} counted, {f.okay} natural</span>
                  </p>
                  <ul className="mt-2 space-y-2">
                    {f.examples.map((e, i) => (
                      <li key={i} className="text-sm text-mute">
                        <span className={e.counted ? "text-ink" : ""}>{e.sentence}</span>
                        <span className="block text-xs mt-0.5">{e.counted ? "Counted" : "Not counted"}: {e.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-sm text-mute">Context matters, so natural uses such as “I would like to” are not counted. {m.fillerCount} counted in {a.wordCount} words is {m.fillerPer100} per 100.</p>
            </div>
          )}
        </Disclosure>
        <Disclosure title="Pace and pauses" meta={m.wpm !== null ? <span className="tnum">{m.wpm} wpm</span> : <span>Not measured</span>}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Overall pace" value={m.wpm === null ? "n/a" : `${m.wpm} wpm`} note="Words divided by time, without the silence at either end." />
            <Stat label="While speaking" value={m.articulationWpm === null ? "n/a" : `${m.articulationWpm} wpm`} note="Words divided by time actually speaking." />
            <Stat label="Pauses over 1 sec" value={m.pauses === null ? "n/a" : String(m.pauses)} note="Short pauses are normal and good." />
            <Stat label="Pauses over 2 sec" value={m.longPauses === null ? "n/a" : String(m.longPauses)} />
            <Stat label="Speaking time" value={attempt.vad ? fmtClock(attempt.vad.speakingSec) : "n/a"} />
            <Stat label="Longest pause" value={attempt.vad ? `${attempt.vad.longestPauseSec}s` : "n/a"} />
          </div>
          <p className="mt-4 text-sm text-mute">{attempt.vad ? "Measured from the microphone signal while you spoke. It detects silence, not the meaning of the pause." : "No microphone signal was recorded for this answer, so pauses were not measured. Pace needs a recording time."}</p>
        </Disclosure>
        <Disclosure title="Sentences" meta={m.avgSentenceWords !== null ? <span className="tnum">average {m.avgSentenceWords} words</span> : <span>Not measured</span>}>
          {!a.sentencesReliable ? (
            <p className="text-base text-mute">Your transcript has little punctuation, so sentence length cannot be measured. Add full stops when you edit it, then update the report.</p>
          ) : a.sentences.length === 0 ? (
            <p className="text-base text-mute">No sentences were too long, tangled or repetitive. Aim to keep each one under about 25 words.</p>
          ) : (
            <ul className="space-y-4">
              {a.sentences.map((s, i) => (
                <li key={i}>
                  <p className="text-base text-ink select-text">“{s.text}”</p>
                  <p className="text-sm text-mute mt-1">{s.words} words. {s.advice}</p>
                </li>
              ))}
            </ul>
          )}
        </Disclosure>
        <Disclosure title="Vocabulary" meta={<span className="tnum">{a.vocabulary.length} {a.vocabulary.length === 1 ? "suggestion" : "suggestions"}</span>}>
          {a.vocabulary.length === 0 ? (
            <p className="text-base text-mute">Nothing to change. Your phrasing sounds natural, and simple words are fine.</p>
          ) : (
            <ul className="space-y-4">
              {a.vocabulary.map((v, i) => (
                <li key={i}>
                  <p className="text-base text-ink"><span className="text-mute line-through">{v.from}</span> → {v.to}</p>
                  <p className="text-sm text-mute mt-1">{v.why}</p>
                </li>
              ))}
            </ul>
          )}
        </Disclosure>
        <Disclosure title="Phrasing and hedging" meta={<span className="tnum">{a.hedges.reduce((n, h) => n + h.count, 0)} found</span>}>
          {a.hedges.length === 0 ? (
            <p className="text-base text-mute">No hedging or apologies stood out.</p>
          ) : (
            <ul className="space-y-4">
              {a.hedges.map((h, i) => (
                <li key={i}>
                  <p className="text-base text-ink">“{h.label}” <span className="text-mute">· {h.count}×{h.kind === "apology" ? " (apology)" : ""}</span></p>
                  <p className="text-sm text-mute mt-1 select-text">{h.example}</p>
                  <p className="text-sm text-ink mt-1">{h.suggestion}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-mute">This looks at the words you chose. It cannot tell how confident your voice sounds.</p>
        </Disclosure>
        <Disclosure title="Answer structure" meta={<span className="tnum">{a.structure.filter((s) => s.found).length} of 5 parts</span>}>
          <ul className="space-y-3">
            {a.structure.map((s) => (
              <li key={s.id} className="flex gap-3">
                {s.found ? <Check size={20} className="mt-0.5 shrink-0 text-accentfg" aria-hidden /> : <X size={20} className="mt-0.5 shrink-0 text-mute" aria-hidden />}
                <div>
                  <p className="text-base text-ink">{s.label} <span className="sr-only">{s.found ? "found" : "not found"}</span></p>
                  {s.evidence && <p className="text-sm text-mute select-text">“{s.evidence}”</p>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-mute">Found by signal phrases such as “for example” and “in short”. An answer can be well structured without them, so treat this as a prompt, not a verdict.</p>
        </Disclosure>
        {a.relevance && (
          <Disclosure title="Key ideas for this question" meta={<span className="tnum">{a.relevance.covered.length} of {a.relevance.covered.length + a.relevance.missed.length}</span>}>
            <div className="flex flex-wrap gap-2">
              {a.relevance.covered.map((k) => (
                <Badge key={k.id} tone="accent">
                  <Check size={12} aria-hidden /> {k.label}
                </Badge>
              ))}
              {a.relevance.missed.map((k) => (
                <Badge key={k.id}>
                  <X size={12} aria-hidden /> {k.label}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-sm text-mute">Matched against words and phrases linked to each idea. If you made the point in different words, it may show as missed.</p>
          </Disclosure>
        )}
        <Disclosure title="How this was scored">
          <ul className="space-y-3 text-sm text-mute">
            {ROWS.concat([{ key: "readiness", label: "Interview readiness" }]).map((r) => (
              <li key={r.key}>
                <span className="text-ink">{r.label}: </span>
                {a.scores[r.key].note}
              </li>
            ))}
            {a.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
            <li>Speech recognition can drop or mishear words. Correct the transcript and update the report if it did.</li>
          </ul>
        </Disclosure>
      </div>
    </article>
  );
}
