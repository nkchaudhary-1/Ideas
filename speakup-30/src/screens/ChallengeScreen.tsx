import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import { PageHeader, Card, ProgressBar } from "../components/ui/layout";
import { Button, Segmented, Select } from "../components/ui/controls";
import { ChallengeRun } from "../components/ChallengeRun";
import { go } from "../lib/router";
import { useStore } from "../lib/store";
import { currentDay } from "../lib/stats";
import { dayContent, levelFor } from "../content/curriculum";
import type { KeyPoint } from "../lib/types";

interface Entry {
  day: number;
  label: string;
  question: string;
  keyPoints: KeyPoint[];
  target: [number, number];
}

function entriesFor(day: number): Entry[] {
  const c = dayContent(day);
  if (c.segments && day >= 29)
    return c.segments.map((s) => ({ day, label: s.title, question: s.question, keyPoints: s.keyPoints, target: [Math.round(s.seconds * 0.5), s.seconds] as [number, number] }));
  return c.questions.map((q, i) => ({ day, label: i === 0 ? "Main question" : `Variation ${i}`, question: q, keyPoints: c.keyPoints, target: c.target }));
}

type Source = "today" | "pick" | "mixed";

export function ChallengeScreen({ dayParam }: { dayParam?: string }) {
  const data = useStore((s) => s.data);
  const cur = currentDay(data);
  const [source, setSource] = useState<Source>("today");
  const [pickDay, setPickDay] = useState(() => {
    const n = dayParam ? parseInt(dayParam, 10) : NaN;
    return Number.isFinite(n) && n >= 1 && n <= 30 ? n : cur;
  });
  const [pickIdx, setPickIdx] = useState(0);
  const [mix, setMix] = useState<Entry[]>([]);
  const [mixStep, setMixStep] = useState(0);
  const [round, setRound] = useState(0);

  const pool = useMemo(() => Array.from({ length: cur }, (_, i) => entriesFor(i + 1)).flat(), [cur]);
  const todays = entriesFor(cur)[0];
  const dayEntries = entriesFor(pickDay);
  const entry = source === "today" ? todays : source === "pick" ? dayEntries[Math.min(pickIdx, dayEntries.length - 1)] : mix[mixStep];

  const shuffle = () => {
    const a = pool.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    setMix(a.slice(0, Math.min(5, a.length)));
    setMixStep(0);
    setRound((r) => r + 1);
  };
  const choose = (s: Source) => {
    setSource(s);
    if (s === "mixed" && mix.length === 0) shuffle();
  };

  return (
    <div>
      <PageHeader eyebrow="One question at a time" title="Interview challenge" intro="Read the question, record your answer, read the transcript and report, then try again. Follow-ups come from what you actually said." />
      <div className="max-w-xl">
        <Segmented
          label="Question source"
          value={source}
          onChange={choose}
          options={[
            { value: "today", label: "Today's question" },
            { value: "pick", label: "Pick a question" },
            { value: "mixed", label: "Mixed interview" },
          ]}
        />
      </div>

      {source === "pick" && (
        <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
          <Select aria-label="Day" value={pickDay} onChange={(e) => (setPickDay(+e.target.value), setPickIdx(0))}>
            {Array.from({ length: cur }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>Day {d} · {dayContent(d).topic.slice(0, 30)}</option>
            ))}
          </Select>
          <Select aria-label="Question" value={pickIdx} onChange={(e) => setPickIdx(+e.target.value)}>
            {dayEntries.map((e, i) => (
              <option key={i} value={i}>{e.label}</option>
            ))}
          </Select>
        </div>
      )}
      {source === "mixed" && (
        <div className="mt-6 max-w-xl">
          <div className="flex items-center gap-4">
            <ProgressBar value={mix.length ? mixStep / mix.length : 0} className="flex-1" label="Mixed interview progress" />
            <span className="text-sm tnum text-mute">{Math.min(mixStep + 1, mix.length)} of {mix.length}</span>
            <Button variant="ghost" icon={<Shuffle size={16} />} onClick={shuffle}>Shuffle</Button>
          </div>
          <p className="mt-2 text-sm text-mute">Five questions drawn from the days you have reached, in random order.</p>
        </div>
      )}

      <div className="mt-10">
        {source === "mixed" && mixStep >= mix.length && mix.length > 0 ? (
          <Card>
            <h2 className="text-2xl font-semibold text-ink">Mixed interview complete.</h2>
            <p className="mt-2 text-base text-mute">Open Speaking analysis to compare your answers, or shuffle for a new set.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" onClick={shuffle}>New set</Button>
              <Button onClick={() => go("/analysis")}>Open Speaking analysis</Button>
            </div>
          </Card>
        ) : entry ? (
          <ChallengeRun
            key={`${source}-${round}-${entry.day}-${entry.question}-${mixStep}`}
            day={entry.day}
            question={entry.question}
            keyPoints={entry.keyPoints}
            targetSec={entry.target}
            followUps={source === "mixed" ? 1 : Math.max(1, levelFor(entry.day).followUps)}
            eyebrow={`Day ${entry.day} · ${entry.label}`}
            onComplete={source === "mixed" ? () => setMixStep((s) => s + 1) : undefined}
            completeLabel="Next question"
          />
        ) : null}
      </div>
    </div>
  );
}
