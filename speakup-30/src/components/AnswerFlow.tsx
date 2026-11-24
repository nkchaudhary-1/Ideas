import { useEffect, useState, type ReactNode } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Recorder } from "./Recorder";
import { Report } from "./Report";
import { Compare } from "./Compare";
import { AudioPlayer } from "./AudioPlayer";
import { Button, TextArea } from "./ui/controls";
import { Disclosure } from "./ui/layout";
import { useStore } from "../lib/store";
import { putAudio, rememberAudio } from "../lib/storage";
import { uid } from "../lib/time";
import { wordCount } from "../lib/analysis/text";
import type { CaptureResult } from "../lib/speech/capture";
import type { Attempt, AttemptKind, KeyPoint } from "../lib/types";

interface Props {
  day: number;
  kind: AttemptKind;
  question: string;
  keyPoints?: KeyPoint[];
  targetSec: [number, number];
  followUpOf?: string;
  followUpReason?: string;
  onAttempt?: (a: Attempt) => void;
  /** Rendered under the report, for "continue" and "follow-up" buttons. */
  children?: (current: Attempt) => ReactNode;
  startLabel?: string;
}

/**
 * One question from start to finish: record (or type), see the transcript, read the report, retry and compare.
 * Remount it with a new `key` for each question.
 */
export function AnswerFlow({ day, kind, question, keyPoints, targetSec, followUpOf, followUpReason, onAttempt, children, startLabel }: Props) {
  const settings = useStore((s) => s.data.settings);
  const add = useStore((s) => s.addAttempt);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [previousId, setPreviousId] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const current = useStore((s) => s.data.attempts.find((a) => a.id === currentId) ?? null);
  const previous = useStore((s) => (current?.retryOf ? s.data.attempts.find((a) => a.id === current.retryOf) ?? null : null));

  const save = (r: CaptureResult | null, typedText = "") => {
    const id = uid();
    if (r?.blob) {
      rememberAudio(id, r.blob);
      if (settings.keepRecordings) void putAudio(id, r.blob);
    }
    const transcript = r?.transcript || typedText;
    const a = add({
      id,
      day,
      kind,
      question,
      durationSec: r?.durationSec ?? 0,
      transcript,
      source: r?.transcript ? "speech" : "typed",
      vad: r?.vad ?? null,
      hasAudio: !!r?.blob && settings.keepRecordings,
      retryOf: previousId ?? undefined,
      followUpOf,
      followUpReason,
      keyPoints,
      targetSec,
    });
    setCurrentId(id);
    setTyping(false);
    setNotice(r?.recognitionIssue ?? null);
    onAttempt?.(a);
  };

  const retry = () => {
    setPreviousId(currentId);
    setCurrentId(null);
    setTyped("");
    setNotice(null);
  };

  if (!current) {
    return typing ? (
      <div>
        <TextArea aria-label="Type what you said" rows={6} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type or paste your answer here. Use full stops so sentence length can be measured." />
        <p className="mt-3 text-sm text-mute">Typed answers get filler, structure and phrasing feedback. Pace and pauses need a recording.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="primary" disabled={wordCount(typed) === 0} onClick={() => save(null, typed)} data-testid="analyse-typed">
            Analyse my answer
          </Button>
          <Button variant="ghost" onClick={() => setTyping(false)}>
            Back to recording
          </Button>
        </div>
      </div>
    ) : (
      <Recorder targetSec={targetSec} onResult={(r) => save(r)} onType={() => setTyping(true)} startLabel={startLabel} />
    );
  }

  return (
    <div className="space-y-8">
      {current.hasAudio || current.durationSec > 0 ? <AudioPlayer id={current.id} /> : null}
      <TranscriptEditor attempt={current} notice={notice} />
      <Report attempt={current} />
      {previous && (
        <Disclosure title="Compared with your previous attempt" defaultOpen>
          <Compare prev={previous} next={current} />
        </Disclosure>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button icon={<RotateCcw size={16} />} onClick={retry} data-testid="retry">
          Try this question again
        </Button>
        <DeleteAttempt id={current.id} onDeleted={() => { setCurrentId(null); setPreviousId(null); }} />
        {children?.(current)}
      </div>
    </div>
  );
}

function DeleteAttempt({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const del = useStore((s) => s.deleteAttempt);
  const say = useStore((s) => s.say);
  return (
    <Button
      variant="ghost"
      icon={<Trash2 size={16} />}
      onClick={() => {
        del(id);
        onDeleted();
        say("Attempt deleted");
      }}
    >
      Delete this attempt
    </Button>
  );
}

export function TranscriptEditor({ attempt, notice }: { attempt: Attempt; notice: string | null }) {
  const setT = useStore((s) => s.setTranscript);
  const [draft, setDraft] = useState(attempt.transcript);
  useEffect(() => setDraft(attempt.transcript), [attempt.transcript, attempt.id]);
  const dirty = draft !== attempt.transcript;
  const label = attempt.source === "speech" ? "Transcript from speech recognition. Fix any mistakes, then update the report." : attempt.source === "edited" ? "Transcript, edited by you." : "Transcript, typed by you.";
  return (
    <div>
      <label htmlFor={`tr-${attempt.id}`} className="block text-sm text-mute mb-2">
        {label}
      </label>
      {notice && (
        <p role="status" className="mb-3 rounded bg-panel2 p-4 text-sm text-ink">
          {notice}
        </p>
      )}
      <TextArea id={`tr-${attempt.id}`} rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type or paste what you said." data-testid="transcript" />
      {dirty && (
        <div className="mt-3 flex gap-3">
          <Button variant="primary" onClick={() => setT(attempt.id, draft)} data-testid="update-report">
            Update report
          </Button>
          <Button variant="ghost" onClick={() => setDraft(attempt.transcript)}>
            Discard changes
          </Button>
        </div>
      )}
    </div>
  );
}
