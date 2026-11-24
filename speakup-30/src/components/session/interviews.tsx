import { ChallengeRun } from "../ChallengeRun";
import { Disclosure, ProgressBar } from "../ui/layout";
import { dayContent, levelFor } from "../../content/curriculum";
import { useStore } from "../../lib/store";

/** Days 1 to 21: one real interview question, with follow-ups that get more demanding as the weeks go on. */
export function ChallengePhase({ day, onDone }: { day: number; onDone: () => void }) {
  const c = dayContent(day);
  const n = levelFor(day).followUps;
  return (
    <div>
      <p className="text-sm text-mute">Challenge · {n === 0 ? "one question, then an optional follow-up" : `one question and ${n} follow-up${n > 1 ? "s" : ""} from what you say`}</p>
      <div className="mt-4">
        <ChallengeRun day={day} question={c.questions[0]} keyPoints={c.keyPoints} targetSec={c.target} followUps={n} onComplete={onDone} completeLabel="Continue" />
      </div>
    </div>
  );
}

/** Days 22 to 28: three questions in a row, each with a follow-up, like the real thing. */
export function SimulationPhase({ day, onDone }: { day: number; onDone: () => void }) {
  const c = dayContent(day);
  const step = useStore((s) => s.data.active?.step ?? 0);
  const setStep = useStore((s) => s.setStep);
  const qs = c.questions.slice(0, 3);
  const i = Math.min(step, qs.length - 1);
  return (
    <div>
      <p className="text-sm text-mute">Interview simulation · {qs.length} questions, each with a follow-up</p>
      <ProgressBar value={i / qs.length} className="mt-4" label="Simulation progress" />
      <div className="mt-6">
        <ChallengeRun
          key={i}
          day={day}
          kind="simulation"
          eyebrow={`Question ${i + 1} of ${qs.length}`}
          question={qs[i]}
          keyPoints={c.keyPoints}
          targetSec={c.target}
          followUps={1}
          onComplete={() => (i + 1 < qs.length ? setStep(i + 1) : onDone())}
          completeLabel={i + 1 < qs.length ? "Next question" : "Finish simulation"}
        />
      </div>
    </div>
  );
}

/** Day 29: four strategic questions, no script. Your own keywords stay one tap away. */
export function InterviewPhase({ day, onDone }: { day: number; onDone: () => void }) {
  const c = dayContent(day);
  const segs = c.segments ?? [];
  const notes = useStore((s) => s.data.notes[day] ?? "");
  const step = useStore((s) => s.data.active?.step ?? 0);
  const setStep = useStore((s) => s.setStep);
  const i = Math.min(step, segs.length - 1);
  const seg = segs[i];
  return (
    <div>
      <p className="text-sm text-mute">Interview practice · {segs.length} questions, no script</p>
      <ProgressBar value={i / segs.length} className="mt-4" label="Interview progress" />
      {notes.trim() && (
        <div className="mt-2">
          <Disclosure title="Show my keywords">
            <p className="whitespace-pre-line text-base text-mute">{notes}</p>
          </Disclosure>
        </div>
      )}
      <div className="mt-6">
        <ChallengeRun
          key={i}
          day={day}
          kind="interview"
          eyebrow={`Question ${i + 1} of ${segs.length} · ${seg.title}`}
          question={seg.question}
          keyPoints={seg.keyPoints}
          targetSec={[Math.round(seg.seconds * 0.5), seg.seconds]}
          followUps={i === 0 ? 2 : 1}
          onComplete={() => (i + 1 < segs.length ? setStep(i + 1) : onDone())}
          completeLabel={i + 1 < segs.length ? "Next question" : "Finish interview"}
        />
      </div>
    </div>
  );
}

/** Day 30: the whole interview in ten parts. Nothing to read. Some parts get a follow-up, as a real interviewer would ask. */
export function FullInterviewPhase({ day, onDone }: { day: number; onDone: () => void }) {
  const c = dayContent(day);
  const segs = c.segments ?? [];
  const step = useStore((s) => s.data.active?.step ?? 0);
  const setStep = useStore((s) => s.setStep);
  const i = Math.min(step, segs.length - 1);
  const seg = segs[i];
  const FOLLOW = new Set(["process", "portfolio", "product", "conflict", "strategy"]);

  return (
    <div>
      <p className="text-sm text-mute">Full interview simulation · part {i + 1} of {segs.length}</p>
      <ProgressBar value={i / segs.length} className="mt-4" label="Interview progress" />
      <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute" aria-label="Parts of the interview">
        {segs.map((s, k) => (
          <li key={s.id} aria-current={k === i ? "step" : undefined} className={k === i ? "text-ink" : k < i ? "text-accentfg" : ""}>{s.title}</li>
        ))}
      </ol>
      <div className="mt-6">
        <ChallengeRun
          key={i}
          day={day}
          kind="interview"
          eyebrow={seg.title}
          question={seg.question}
          keyPoints={seg.keyPoints}
          targetSec={[Math.round(seg.seconds * 0.5), seg.seconds]}
          followUps={FOLLOW.has(seg.id) ? 1 : 0}
          onComplete={() => (i + 1 < segs.length ? setStep(i + 1) : onDone())}
          completeLabel={i + 1 < segs.length ? "Next part" : "Finish interview"}
        />
        {seg.id === "unexpected" && <p className="mt-6 text-sm text-mute">Answer all three, one after another, in about two minutes. Short and direct is right here.</p>}
      </div>
    </div>
  );
}
