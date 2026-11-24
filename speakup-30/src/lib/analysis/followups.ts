// Follow-up questions chosen from the gaps in what the user actually said. No model is involved, and the reason
// is always shown so it is clear why the question was asked. (With an AI key set, Claude can write one instead.)
import type { KeyPoint } from "../types";
import { sentencesOf } from "./util";
import { trimQuote } from "./text";

export interface FollowUp {
  id: string;
  question: string;
  reason: string;
  keyPoint: KeyPoint;
}

interface Candidate {
  id: string;
  question: (quote?: string) => string;
  reason: string;
  /** True when the answer is missing this. */
  gap: (t: string) => boolean;
  /** True when the answer gives us something to ask about. */
  relevant: (t: string) => boolean;
  terms: string[];
  label: string;
}

const DECISION = /\b(decided|chose|went with|picked|selected|prioriti[sz]ed|focused on|opted)\b/i;

const CANDIDATES: Candidate[] = [
  {
    id: "why",
    question: (q) => (q ? `You said: "${q}" Why did you choose this approach?` : "Why did you choose this approach?"),
    reason: "You described a decision without saying why you made it.",
    gap: (t) => !/\b(because|the reason|that('s| is) why|so that)\b/i.test(t),
    relevant: (t) => DECISION.test(t),
    terms: ["because", "reason", "so that", "chose", "decided", "why", "evidence", "insight"],
    label: "Reasoning behind the decision",
  },
  {
    id: "alternatives",
    question: () => "What alternatives did you consider?",
    reason: "Your answer did not mention other options you weighed.",
    gap: (t) => !/\b(alternative|option|instead|considered|compar|trade-?off|versus|vs\.?)\b/i.test(t),
    relevant: () => true,
    terms: ["alternative", "option", "instead", "considered", "compare", "trade-off", "tradeoff", "versus"],
    label: "Alternatives considered",
  },
  {
    id: "metrics",
    question: () => "How would you measure success?",
    reason: "Your answer did not say how you would know it worked.",
    gap: (t) => !/(\d|%|\b(metric|conversion|rate|kpi|measure|success|outcome|retention|nps|csat)\b)/i.test(t),
    relevant: () => true,
    terms: ["measure", "metric", "success", "conversion", "rate", "kpi", "outcome", "data", "retention"],
    label: "How success is measured",
  },
  {
    id: "evidence",
    question: () => "What evidence supports your decision?",
    reason: "Your answer did not point to research, data or testing.",
    gap: (t) => !/\b(research|data|test(ed|ing)?|interview|survey|usability|evidence|analytics|insight|experiment|a\/b)\b/i.test(t),
    relevant: () => true,
    terms: ["research", "data", "test", "interview", "survey", "usability", "evidence", "analytics", "insight", "experiment"],
    label: "Evidence for the decision",
  },
  {
    id: "differently",
    question: () => "What would you do differently?",
    reason: "Your answer did not include what you would change next time.",
    gap: (t) => !/\b(learn(ed|t)?|differently|next time|mistake|improve|retrospect|looking back|would change)\b/i.test(t),
    relevant: () => true,
    terms: ["differently", "next time", "learned", "learnt", "mistake", "change", "improve", "retrospect", "looking back"],
    label: "What you would change",
  },
  {
    id: "stakeholder",
    question: () => "What if the stakeholder disagrees?",
    reason: "You mentioned working with other people. How you handle pushback is the senior part.",
    gap: (t) => !/\b(disagree|push ?back|objection|align(ment)?|influence|persuade|negotiate)\b/i.test(t),
    relevant: (t) => /\b(stakeholder|pm|product manager|engineer|developer|team|leadership|manager)\b/i.test(t),
    terms: ["disagree", "pushback", "push back", "align", "influence", "listen", "data", "compromise", "escalate", "understand their"],
    label: "Handling disagreement",
  },
  {
    id: "prioritise",
    question: () => "How would you prioritise this?",
    reason: "You listed several things without saying which comes first.",
    gap: (t) => !/\b(prioriti[sz]|impact|effort|first|trade-?off|biggest|most important)\b/i.test(t),
    relevant: (t) => (t.match(/\b(and|also|then)\b/gi) ?? []).length >= 6,
    terms: ["prioritise", "prioritize", "impact", "effort", "first", "trade-off", "biggest", "most important", "sequence"],
    label: "Prioritisation",
  },
];

export function pickFollowUps(transcript: string, count: number, asked: string[] = []): FollowUp[] {
  const t = transcript;
  const decisionSentence = sentencesOf(t).find((s) => DECISION.test(s));
  const quote = decisionSentence ? trimQuote(decisionSentence, 110) : undefined;
  const fresh = CANDIDATES.filter((c) => !asked.includes(c.id));
  // Gaps that give us something to ask about first, then any other gap, then the rest.
  const ordered = [
    ...fresh.filter((c) => c.gap(t) && c.relevant(t)),
    ...fresh.filter((c) => c.gap(t) && !c.relevant(t)),
    ...fresh.filter((c) => !c.gap(t)),
  ];
  const seen = new Set<string>();
  const out: FollowUp[] = [];
  for (const c of ordered) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push({
      id: c.id,
      question: c.question(c.id === "why" ? quote : undefined),
      reason: c.gap(t) ? c.reason : "A strong answer already touches this, so this is your chance to go deeper.",
      keyPoint: { id: c.id, label: c.label, terms: c.terms },
    });
    if (out.length >= count) break;
  }
  return out;
}
