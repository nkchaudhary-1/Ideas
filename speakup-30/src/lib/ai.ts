// Optional deeper review by Claude. This is the only feature that needs an API key, and it is off until you add one in
// Settings. When you press "Get an AI review" the transcript text (never the audio) is sent straight from this
// browser to api.anthropic.com. The key is stored on this device only.
import type { AIReview } from "./types";
import { IN_ARTIFACT } from "./env";

export const DEFAULT_MODEL = "claude-opus-5-5";

export class AIError extends Error {}

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Two sentences: how the answer landed, and the single most useful change." },
    wentWell: { type: "array", items: { type: "string" }, description: "Two to four specific strengths, quoting or pointing to the speaker's own words." },
    improve: { type: "array", items: { type: "string" }, description: "Two to four specific, actionable changes for the next attempt." },
    betterSentences: {
      type: "array",
      description: "Up to three sentences from the transcript with a more natural alternative.",
      items: {
        type: "object",
        properties: { original: { type: "string" }, better: { type: "string" }, why: { type: "string" } },
        required: ["original", "better", "why"],
        additionalProperties: false,
      },
    },
    followUp: { type: "string", description: "One realistic follow-up question an interviewer would ask next, based on a gap or claim in this answer." },
  },
  required: ["summary", "wentWell", "improve", "betterSentences", "followUp"],
  additionalProperties: false,
} as const;

const SYSTEM = `You are a warm, direct speaking coach for a Senior Product Designer with about eight years of experience who is practising for interviews at leading technology companies. The speaker is an Indian English speaker, so do not treat Indian English as an error.

You are given the question, a transcript from browser speech recognition, and measurements taken from the real recording. Speech recognition can drop words, mishear terms and add no punctuation. Do not criticise a likely recognition error.

Coach on what was said and how it was structured:
- Clarity, structure (opening, context, reasoning, example, conclusion), relevance to the question, and interview readiness.
- Natural, professional phrasing. Keep simple language simple. Never suggest fancier words just to sound impressive.
- Hedging, apologies and tentative phrasing in the words used. You cannot judge psychological confidence from a transcript, so never claim to.
- Quote the speaker's own sentences. Be specific. Do not flatter and do not pad.

Write in British English. Keep every item to one or two sentences. Do not invent facts about the speaker's experience or results.`;

interface Input {
  apiKey: string;
  model: string;
  question: string;
  transcript: string;
  day: number;
  durationSec: number;
  wpm: number | null;
  fillerPer100: number;
  longPauses: number | null;
  keyPointLabels: string[];
}

async function client(apiKey: string) {
  if (IN_ARTIFACT) throw new AIError("The AI review is not available in the artifact. Run the app itself to use it.");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  // The key belongs to the person using this app and never leaves their device except to reach Anthropic.
  return { Anthropic, c: new Anthropic({ apiKey: apiKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 1 }) };
}

function explain(e: unknown, Anthropic: typeof import("@anthropic-ai/sdk").default): AIError {
  if (e instanceof Anthropic.AuthenticationError) return new AIError("The API key was not accepted. Check it in Settings.");
  if (e instanceof Anthropic.PermissionDeniedError) return new AIError("This key does not have access to that model. Try another model in Settings.");
  if (e instanceof Anthropic.NotFoundError) return new AIError("That model name was not found. Check the model in Settings.");
  if (e instanceof Anthropic.RateLimitError) return new AIError("Anthropic is rate limiting this key. Wait a minute and try again.");
  if (e instanceof Anthropic.BadRequestError) return new AIError(`Anthropic rejected the request: ${e.message}`);
  if (e instanceof Anthropic.APIConnectionError) return new AIError("Could not reach Anthropic. Check your connection and try again.");
  if (e instanceof Anthropic.APIError) return new AIError(`Anthropic returned an error (${e.status}). Try again in a moment.`);
  return new AIError(e instanceof Error ? e.message : "The review failed. Try again.");
}

export async function reviewAnswer(input: Input): Promise<AIReview> {
  const { Anthropic, c } = await client(input.apiKey);
  const facts = [
    `Question: ${input.question}`,
    `Day ${input.day} of the programme.`,
    `Length: ${Math.round(input.durationSec)} seconds.`,
    input.wpm !== null ? `Measured pace: about ${input.wpm} words per minute.` : "Pace was not measured.",
    `Filler words counted by the app: ${input.fillerPer100} per 100 words.`,
    input.longPauses !== null ? `Pauses over 2 seconds measured from the microphone: ${input.longPauses}.` : "Pauses were not measured.",
    input.keyPointLabels.length ? `Ideas a strong answer would touch: ${input.keyPointLabels.join("; ")}.` : "",
  ].filter(Boolean);
  try {
    const res = await c.beta.messages.create({
      model: input.model || DEFAULT_MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      // A request that a model declines for policy reasons is retried on its default fallback. Harmless for a coaching review.
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: `${facts.join("\n")}\n\nTranscript:\n"""\n${input.transcript}\n"""` }],
      output_config: { format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
    });
    if (res.stop_reason === "refusal") throw new AIError("The model declined to review this answer. Try editing the transcript.");
    if (res.stop_reason === "max_tokens") throw new AIError("The review was cut off. Try again.");
    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new AIError("The review came back empty. Try again.");
    const j = JSON.parse(text.text) as Partial<AIReview>;
    return {
      model: res.model,
      at: new Date().toISOString(),
      summary: String(j.summary ?? ""),
      wentWell: Array.isArray(j.wentWell) ? j.wentWell.map(String) : [],
      improve: Array.isArray(j.improve) ? j.improve.map(String) : [],
      betterSentences: Array.isArray(j.betterSentences) ? j.betterSentences.map((b) => ({ original: String(b.original), better: String(b.better), why: String(b.why) })) : [],
      followUp: String(j.followUp ?? ""),
    };
  } catch (e) {
    if (e instanceof AIError) throw e;
    if (e instanceof SyntaxError) throw new AIError("The review could not be read. Try again.");
    throw explain(e, Anthropic);
  }
}

export async function testKey(apiKey: string, model: string): Promise<void> {
  const { Anthropic, c } = await client(apiKey);
  try {
    await c.messages.create({ model: model || DEFAULT_MODEL, max_tokens: 256, messages: [{ role: "user", content: "Reply with the single word OK." }] });
  } catch (e) {
    throw explain(e, Anthropic);
  }
}
