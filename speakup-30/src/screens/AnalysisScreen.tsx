import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button, Badge, Field, TextArea } from "../components/ui/controls";
import { Card, Disclosure, EmptyState, PageHeader } from "../components/ui/layout";
import { Report } from "../components/Report";
import { Compare } from "../components/Compare";
import { AudioPlayer } from "../components/AudioPlayer";
import { TranscriptEditor } from "../components/AnswerFlow";
import { go, href } from "../lib/router";
import { useStore } from "../lib/store";
import { currentDay } from "../lib/stats";
import { dayContent } from "../content/curriculum";
import { fmtDateTime } from "../lib/time";
import { wordCount } from "../lib/analysis/text";
import type { Attempt } from "../lib/types";

const KIND: Record<Attempt["kind"], string> = {
  "read-aloud": "Read aloud",
  guided: "Guided speaking",
  challenge: "Challenge",
  simulation: "Simulation",
  interview: "Interview",
  practice: "Pasted transcript",
};

export function AnalysisScreen({ attemptId }: { attemptId?: string }) {
  const attempts = useStore((s) => s.data.attempts);
  const current = attemptId ? attempts.find((a) => a.id === attemptId) : undefined;
  if (attemptId && current) return <Detail attempt={current} />;
  return <List />;
}

function List() {
  const data = useStore((s) => s.data);
  const add = useStore((s) => s.addAttempt);
  const [text, setText] = useState("");
  const [secs, setSecs] = useState("");
  const list = data.attempts.slice().sort((a, b) => b.at.localeCompare(a.at));
  const day = currentDay(data);

  const analyse = () => {
    const s = parseInt(secs, 10);
    const a = add({ day, kind: "practice", question: "Pasted transcript", durationSec: Number.isFinite(s) && s > 0 ? s : 0, transcript: text, source: "typed", vad: null });
    setText("");
    setSecs("");
    go(`/analysis/${a.id}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Every answer, analysed on this device" title="Speaking analysis" intro="Each report is built from your real words and, when you recorded, your real microphone signal. Nothing is scored from placeholder data." />

      <Card className="mb-12">
        <h2 className="text-lg font-semibold text-ink">Analyse a transcript</h2>
        <p className="mt-2 text-base text-mute">Paste or type something you said, such as notes from a mock interview. Add how long it took to get a pace reading.</p>
        <div className="mt-6">
          <label htmlFor="paste" className="mb-2 block text-sm text-mute">Transcript</label>
          <TextArea id="paste" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste what you said. Use full stops so sentence length can be measured." data-testid="paste" />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="w-48">
            <label htmlFor="secs" className="mb-2 block text-sm text-mute">Length in seconds (optional)</label>
            <Field id="secs" inputMode="numeric" value={secs} onChange={(e) => setSecs(e.target.value.replace(/\D/g, ""))} placeholder="90" />
          </div>
          <Button variant="primary" disabled={wordCount(text) === 0} onClick={analyse} data-testid="paste-analyse">Analyse</Button>
        </div>
      </Card>

      <h2 className="mb-4 text-lg font-semibold text-ink">Your answers</h2>
      {list.length === 0 ? (
        <EmptyState title="No answers yet" body="Record an answer in today's practice or the interview challenge and its report appears here." action={<Button variant="primary" onClick={() => go("/challenge")}>Open the challenge</Button>} />
      ) : (
        <ul className="border-t border-line" data-testid="attempt-list">
          {list.map((a) => (
            <li key={a.id} className="border-b border-line">
              <a href={href(`/analysis/${a.id}`)} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4 hover:bg-panel/40">
                <span className="min-w-0 flex-1 basis-64">
                  <span className="block truncate text-base text-ink">{a.question}</span>
                  <span className="block text-sm text-mute">{fmtDateTime(a.at)} · Day {a.day} · {KIND[a.kind]}</span>
                </span>
                <span className="text-sm tnum text-mute">
                  {!a.analysis ? "Transcript deleted" : a.analysis.scored ? `Readiness ${a.analysis.scores.readiness.value ?? "n/a"}/10${a.analysis.metrics.wpm ? ` · ${a.analysis.metrics.wpm} wpm` : ""}` : "Too short to score"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Detail({ attempt }: { attempt: Attempt }) {
  const attempts = useStore((s) => s.data.attempts);
  const del = useStore((s) => s.deleteAttempt);
  const clear = useStore((s) => s.clearTranscript);
  const say = useStore((s) => s.say);
  const prev = attempts
    .filter((a) => a.question === attempt.question && a.day === attempt.day && a.at < attempt.at && a.analysis)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  return (
    <div>
      <a href={href("/analysis")} className="mb-4 inline-flex min-h-8 items-center gap-2 text-sm text-mute hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> All answers
      </a>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{KIND[attempt.kind]}</Badge>
        <Badge>Day {attempt.day}</Badge>
        {attempt.followUpOf && <Badge tone="blue">Follow-up</Badge>}
      </div>
      <h1 className="mt-4 max-w-3xl text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{attempt.question}</h1>
      <p className="mt-2 text-sm text-mute">{dayContent(attempt.day).topic}</p>
      <div className="mt-8 space-y-8">
        {attempt.durationSec > 0 && <AudioPlayer id={attempt.id} />}
        <TranscriptEditor attempt={attempt} notice={null} />
        <Report attempt={attempt} />
        {prev && (
          <Disclosure title="Compared with the previous attempt at this question" defaultOpen>
            <Compare prev={prev} next={attempt} />
          </Disclosure>
        )}
        <div className="flex flex-wrap gap-3 border-t border-line pt-6">
          <Button onClick={() => go(`/challenge/${attempt.day}`)}>Try this question again</Button>
          <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => { clear(attempt.id); say("Transcript and report deleted"); }} disabled={!attempt.analysis}>
            Delete transcript and report
          </Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => { del(attempt.id); say("Attempt deleted"); go("/analysis"); }}>
            Delete this attempt
          </Button>
        </div>
      </div>
    </div>
  );
}
