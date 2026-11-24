import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AnswerFlow } from "./AnswerFlow";
import { Badge, Button } from "./ui/controls";
import { pickFollowUps } from "../lib/analysis/followups";
import type { Attempt, KeyPoint } from "../lib/types";

interface Step {
  question: string;
  reason?: string;
  keyPoints?: KeyPoint[];
  id: string;
  followUpOf?: string;
}

interface Props {
  day: number;
  question: string;
  keyPoints?: KeyPoint[];
  targetSec: [number, number];
  /** How many follow-up questions to ask after the main one. They are chosen from what you actually said. */
  followUps: number;
  kind?: "challenge" | "simulation" | "interview";
  /** Label for the button that ends this run. */
  completeLabel?: string;
  onComplete?: () => void;
  /** A heading shown above the question, such as "Question 2 of 3". */
  eyebrow?: string;
}

/**
 * One interview question and its follow-ups. The follow-ups come from the gaps in the previous answer: no model needed,
 * and the reason is always shown. With an AI key set up, a review can suggest one too.
 */
export function ChallengeRun({ day, question, keyPoints, targetSec, followUps, kind = "challenge", completeLabel = "Finish", onComplete, eyebrow }: Props) {
  const [steps, setSteps] = useState<Step[]>([{ question, keyPoints, id: "main" }]);
  const [i, setI] = useState(0);
  const step = steps[i];
  const remaining = followUps - i;

  const next = (last: Attempt) => {
    const asked = steps.map((s) => s.id);
    const ai = last.ai?.followUp?.trim();
    const pick = pickFollowUps(last.transcript, 1, asked)[0];
    const nextStep: Step = ai
      ? { question: ai, reason: "Suggested by your AI review of the last answer.", id: `ai-${i}`, followUpOf: last.id, keyPoints: pick ? [pick.keyPoint] : undefined }
      : pick
        ? { question: pick.question, reason: pick.reason, id: pick.id, followUpOf: last.id, keyPoints: [pick.keyPoint] }
        : { question: "What would you do differently?", reason: "A good closing question for any answer.", id: "closing", followUpOf: last.id };
    setSteps((s) => [...s.slice(0, i + 1), nextStep]);
    setI(i + 1);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {eyebrow && <Badge>{eyebrow}</Badge>}
        {i > 0 && <Badge tone="blue">Follow-up {i}{followUps > 0 ? ` of ${followUps}` : ""}</Badge>}
      </div>
      <h2 className="mt-4 max-w-3xl text-2xl sm:text-3xl font-semibold tracking-tight text-ink" data-testid="question">
        {step.question}
      </h2>
      {step.reason && <p className="mt-3 max-w-2xl text-sm text-mute">Why this question: {step.reason}</p>}
      <div className="mt-8">
        <AnswerFlow
          key={`${i}-${step.id}`}
          day={day}
          kind={kind}
          question={step.question}
          keyPoints={step.keyPoints}
          targetSec={i === 0 ? targetSec : [Math.max(20, Math.round(targetSec[0] / 2)), Math.max(45, Math.round(targetSec[1] / 2))]}
          followUpOf={step.followUpOf}
          followUpReason={step.reason}
        >
          {(cur) => {
            const more = remaining > 0;
            return (
              <>
                {more ? (
                  <Button variant="primary" icon={<ArrowRight size={16} />} onClick={() => next(cur)} data-testid="next-followup">
                    Next: follow-up question
                  </Button>
                ) : (
                  <>
                    {followUps === 0 && i === 0 && (
                      <Button onClick={() => next(cur)} data-testid="optional-followup">
                        Try a follow-up question
                      </Button>
                    )}
                    {onComplete && (
                      <Button variant="primary" icon={<ArrowRight size={16} />} onClick={onComplete} data-testid="run-complete">
                        {completeLabel}
                      </Button>
                    )}
                  </>
                )}
              </>
            );
          }}
        </AnswerFlow>
      </div>
    </div>
  );
}
