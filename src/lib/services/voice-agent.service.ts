import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import OpenAI from "openai";
import { z } from "zod/v4";
import { getConfig, type AppConfig } from "@/lib/config";
import { createLogger } from "@/lib/logger";
import type { ReportFacts } from "@/lib/voice/facts";
import { findUngroundedNumbers, mentionsBrand } from "@/lib/voice/grounding";
import { getVoiceLanguage, type VoiceLanguageCode } from "@/lib/voice/languages";

const log = createLogger("service:voice-agent");

const BriefingSchema = z.object({
  /** What gets spoken: short, natural, no markdown. */
  script: z.string(),
  highlights: z.array(z.string()),
  nextActions: z.array(z.string()),
});

const TutorSchema = z.object({
  /** Spoken reply. */
  reply: z.string(),
  /** 2-3 short follow-ups the learner might ask next, in the same language. */
  suggestions: z.array(z.string()),
});

export type VoiceBriefing = z.infer<typeof BriefingSchema> & {
  language: VoiceLanguageCode;
  comparedTo: string | null;
  warnings: string[];
};

export type TutorReply = z.infer<typeof TutorSchema> & { warnings: string[] };

export type TutorLevel = "beginner" | "intermediate" | "expert";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export class VoiceAgentError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: string
  ) {
    super(message);
    this.name = "VoiceAgentError";
  }
}

type LlmRequest = { system: string; facts: ReportFacts; messages: ChatTurn[] };

/** One model backend. Prompts, grounding checks and retries are shared across backends. */
export type VoiceLlm = {
  name: string;
  json<T>(req: LlmRequest & { schema: z.ZodType<T>; schemaName: string }): Promise<T>;
  text(req: LlmRequest): Promise<string>;
};

type Deps = { llms: VoiceLlm[] };

/** OpenAI first, Claude as fallback, each only when its key is configured. */
export function buildVoiceLlms(
  config: Pick<AppConfig, "openaiApiKey" | "voiceOpenaiModel" | "anthropicApiKey" | "voiceModel">
): VoiceLlm[] {
  const llms: VoiceLlm[] = [];
  if (config.openaiApiKey) {
    llms.push(
      openaiVoiceLlm(
        new OpenAI({ apiKey: config.openaiApiKey, maxRetries: 2 }),
        config.voiceOpenaiModel
      )
    );
  }
  if (config.anthropicApiKey) {
    llms.push(
      claudeVoiceLlm(
        new Anthropic({ apiKey: config.anthropicApiKey, maxRetries: 2 }),
        config.voiceModel
      )
    );
  }
  return llms;
}

function defaultDeps(): Deps {
  const llms = buildVoiceLlms(getConfig());
  if (!llms.length) {
    throw new VoiceAgentError(
      "Voice agent needs OPENAI_API_KEY or ANTHROPIC_API_KEY on the server",
      503
    );
  }
  return { llms };
}

/** Any failure (bad key, rate limit, outage, refusal, malformed output) moves on to the next backend. */
async function withFallback<T>(llms: VoiceLlm[], run: (llm: VoiceLlm) => Promise<T>): Promise<T> {
  let firstError: unknown;
  for (const llm of llms) {
    try {
      return await run(llm);
    } catch (error) {
      firstError ??= error;
      log.warn("Voice LLM failed — trying next backend", {
        provider: llm.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  throw firstError;
}

const GROUNDING_RULES = `Grounding rules (strict):
- Use ONLY the REPORT FACTS JSON for anything about this brand, its competitors, its numbers, sources, dates or changes. Never invent them.
- Percentages are already in percent. "changes" are percentage-point differences versus the previous report; null "changes" means there is no previous report, so do not describe trends.
- When explaining why a competitor gains visibility, cite the evidence in the facts (share of voice change, gap prompts where they appear and the brand does not, sources cited). If the facts do not explain it, say the data does not show why.
- If asked something the facts cannot answer, say so briefly and offer what the data does show.`;

const SPEAKING_RULES = `Speaking style:
- Your words are read aloud by a text-to-speech voice. Conversational, warm, concise. No markdown, bullets, emojis, URLs or tables in spoken text.
- Write every number with Western digits (0-9) exactly as it appears in the facts, rounded to at most one decimal.
- Keep brand names, competitor names, product names, AI assistant names and source domains exactly as written in the facts, untranslated.
- When writing in another language, keep common technical terms (share of voice, visibility score, citation, prompt) in English where a native speaker would.`;

// Stable across languages and turns so the facts block stays prompt-cached.
const ANALYST_SYSTEM = `You are Strand's voice analyst. Strand measures how often AI assistants (ChatGPT, Gemini, Claude, Groq) mention, rank and cite a brand versus its competitors. You speak to the brand's marketing team.

${GROUNDING_RULES}

${SPEAKING_RULES}`;

/** Strand's actual metric formulas (metrics.service.ts), so explanations match the product. */
const METRIC_DEFINITIONS = `How Strand computes its metrics:
- Mention rate: percent of tracked prompts where at least one AI answer names the brand.
- Share of voice: the brand's mentions divided by all mentions of the brand and its tracked competitors.
- Citation rate: percent of the brand's mentions that come with a cited source.
- Recommendation rate: percent of answers that mention the brand positively or rank it in the top 3.
- Positive sentiment: percent of the brand's mentions with positive sentiment.
- Average ranking: the brand's average position when an answer ranks options (1 is best).
- Visibility score (0-100): 35% mention rate + 25% share of voice + 25% recommendation rate + 10% citation rate + 5% ranking.
- Prompts are real buyer-style questions grouped into categories (for example Comparison, Pricing, Reviews) and sent to several AI assistants.`;

const TUTOR_SYSTEM = `You are Strand's voice tutor. You help a brand's team understand AI visibility, their own Strand report and how to improve, through a spoken conversation.

What you teach:
- Concepts: AI visibility, mention rate, share of voice, citations, recommendation rate, sentiment, average ranking, prompt tracking and prompt categories, competitor benchmarking, and GEO (generative engine optimization: earning mentions and citations inside AI answers) versus classic SEO (ranking pages in search results).
- Explain general concepts from your own knowledge, then tie them to this brand's real numbers and competitors from the REPORT FACTS whenever relevant. Never quote outside statistics.
- What changed, why it matters, and what to do next, using the facts.

${METRIC_DEFINITIONS}

How to teach:
- Match the learner's level (given each turn): beginner = everyday words and analogies, no jargon without a plain explanation; intermediate = precise terms with short explanations; expert = concise, tactical, assumes SEO knowledge.
- One idea at a time: 2 to 5 short spoken sentences. Sound like a person talking, not a report. When it helps, end with a short check-in question or an offer to go deeper.
- Quizzes and knowledge checks: when the learner asks to be quizzed, ask one question at a time (about concepts or their own report), wait for their answer, then say whether it is right and why, using the facts. Keep score only if they ask.
- Remember the conversation so far and build on it.
- Reply in the requested language even if earlier turns used another one. If the learner mixes languages (for example Hindi and English), mirror that naturally.

${GROUNDING_RULES}

${SPEAKING_RULES}

suggestions: 2 or 3 short follow-up questions the learner could ask next, in the reply language, specific to this conversation and report.`;

function factsText(facts: ReportFacts) {
  return `REPORT FACTS:\n${JSON.stringify(facts)}`;
}

/** Listing the exact names stops models transliterating them (e.g. HubSpot -> हबस्पॉट). */
function languageLine(code: VoiceLanguageCode, facts: ReportFacts) {
  const names = [facts.brand, ...facts.competitors.slice(0, 8).map((c) => c.name)].join(", ");
  return `Respond in ${getVoiceLanguage(code).prompt}. Write these names exactly as spelled here, in Latin letters, never transliterated: ${names}.`;
}

/** `spoken` must name the brand verbatim when required; `extra` text is only checked for invented numbers. */
function checkGrounding(
  spoken: string,
  facts: ReportFacts,
  opts: { requireBrand?: boolean; extra?: string; allowedFrom?: string } = {}
) {
  const issues: string[] = [];
  const bad = findUngroundedNumbers(`${spoken}\n${opts.extra ?? ""}`, facts, opts.allowedFrom);
  if (bad.length) issues.push(`These numbers are not in the facts: ${bad.join(", ")}`);
  if (opts.requireBrand && !mentionsBrand(spoken, facts)) {
    issues.push(`The brand name "${facts.brand}" must appear verbatim`);
  }
  return issues;
}

function refused(): never {
  throw new VoiceAgentError("The assistant declined to answer that", 422);
}

export function claudeVoiceLlm(client: Anthropic, model: string): VoiceLlm {
  const system = (req: LlmRequest): Anthropic.Beta.BetaTextBlockParam[] => [
    { type: "text", text: req.system },
    { type: "text", text: factsText(req.facts), cache_control: { type: "ephemeral" } },
  ];
  return {
    name: `claude:${model}`,
    async json(req) {
      const response = await client.beta.messages.parse({
        model,
        max_tokens: 16000,
        system: system(req),
        output_config: { effort: "low", format: betaZodOutputFormat(req.schema) },
        messages: req.messages,
      });
      if (response.stop_reason === "refusal") refused();
      if (response.parsed_output == null) {
        throw new VoiceAgentError("The AI reply came back malformed", 502);
      }
      return response.parsed_output;
    },
    async text(req) {
      const response = await client.beta.messages.create({
        model,
        max_tokens: 16000,
        system: system(req),
        output_config: { effort: "low" },
        messages: req.messages,
      });
      if (response.stop_reason === "refusal") refused();
      return response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim();
    },
  };
}

/** Plain JSON Schema for OpenAI's strict structured outputs, generated from the same zod schema. */
function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const out: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete out.$schema;
  return out;
}

export function openaiVoiceLlm(client: OpenAI, model: string): VoiceLlm {
  const messages = (req: LlmRequest) => [
    { role: "system" as const, content: `${req.system}\n\n${factsText(req.facts)}` },
    ...req.messages,
  ];
  return {
    name: `openai:${model}`,
    async json(req) {
      const response = await client.chat.completions.create({
        model,
        messages: messages(req),
        response_format: {
          type: "json_schema",
          json_schema: { name: req.schemaName, strict: true, schema: jsonSchema(req.schema) },
        },
      });
      const message = response.choices[0]?.message;
      if (message?.refusal) refused();
      let json: unknown = null;
      try {
        json = JSON.parse(message?.content ?? "");
      } catch {
        // handled below
      }
      const parsed = req.schema.safeParse(json);
      if (!parsed.success) throw new VoiceAgentError("The AI reply came back malformed", 502);
      return parsed.data;
    },
    async text(req) {
      const response = await client.chat.completions.create({ model, messages: messages(req) });
      const message = response.choices[0]?.message;
      if (message?.refusal) refused();
      return (message?.content ?? "").trim();
    },
  };
}

export function toVoiceAgentError(error: unknown): VoiceAgentError {
  if (error instanceof VoiceAgentError) return error;
  if (error instanceof Anthropic.RateLimitError) {
    return new VoiceAgentError(
      "The AI is rate limited right now. Try again shortly.",
      429,
      error.headers?.get("retry-after") ?? undefined
    );
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new VoiceAgentError(
      "The AI is rate limited right now. Try again shortly.",
      429,
      error.headers?.["retry-after"] ?? undefined
    );
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof OpenAI.AuthenticationError) {
    return new VoiceAgentError("Voice agent API key is invalid", 503);
  }
  if (error instanceof Anthropic.APIConnectionError || error instanceof OpenAI.APIConnectionError) {
    return new VoiceAgentError("Could not reach the AI. Try again.", 503);
  }
  if (
    (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) &&
    (error.status ?? 0) >= 500
  ) {
    return new VoiceAgentError("The AI is temporarily unavailable. Try again.", 503);
  }
  log.error("Voice agent failure", {
    error: error instanceof Error ? error.message : String(error),
  });
  return new VoiceAgentError("Voice agent failed", 502);
}

// ponytail: in-process cache and limiter; move to Postgres/Redis if the app runs on several instances.
const briefingCache = new Map<string, Promise<VoiceBriefing>>();
const MAX_CACHED = 200;
const callLog = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_CALLS = 30;

export function assertWithinRateLimit(userId: string, now = Date.now()) {
  const recent = (callLog.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_CALLS) {
    const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - recent[0])) / 1000);
    throw new VoiceAgentError(
      "Too many voice requests. Take a breather and try again in a few minutes.",
      429,
      String(retryAfter)
    );
  }
  recent.push(now);
  callLog.set(userId, recent);
}

/** Runs `draft` and, if grounding fails, once more with the problems spelled out. Flags rather than hides a second failure. */
async function withGroundingRetry<T>(
  label: string,
  draft: (fixNote: string) => Promise<T>,
  check: (result: T) => string[]
): Promise<{ result: T; warnings: string[] }> {
  let result = await draft("");
  let issues = check(result);
  if (!issues.length) return { result, warnings: [] };
  log.warn(`${label} failed grounding — retrying`, { issues });
  result = await draft(`\n\nYour previous reply had problems. Fix them: ${issues.join("; ")}.`);
  issues = check(result);
  if (issues.length) log.warn(`${label} failed grounding twice`, { issues });
  return { result, warnings: issues };
}

const MAX_HISTORY_TURNS = 8;
const MAX_TUTOR_HISTORY_TURNS = 16;

/** Last N turns, starting with a user turn as both APIs expect. */
function trimHistory(history: ChatTurn[], max: number): ChatTurn[] {
  const prior = history.slice(-max).map((t) => ({ role: t.role, content: t.content }));
  while (prior[0]?.role === "assistant") prior.shift();
  return prior;
}

async function generateBriefing(
  facts: ReportFacts,
  language: VoiceLanguageCode,
  llm: VoiceLlm
): Promise<VoiceBriefing> {
  const ask = `${languageLine(language, facts)}
Write the briefing for ${facts.brand}${facts.previousReportDate ? ` comparing the report of ${facts.reportDate} with the previous one from ${facts.previousReportDate}` : ` from the report of ${facts.reportDate} (first report, no comparison available)`}.
- script: 120 to 180 words, spoken aloud. Cover visibility and how it changed, competitor movements, new competitor mentions, citation gains or losses, which prompt categories work best, and end with the single most important next step.
- highlights: 3 to 5 short transcript lines with the key numbers.
- nextActions: 2 or 3 concrete priorities grounded in gap prompts, content suggestions or the recommendation excerpt.`;

  const { result, warnings } = await withGroundingRetry(
    "Briefing",
    (fix) =>
      llm.json({
        system: ANALYST_SYSTEM,
        facts,
        messages: [{ role: "user", content: ask + fix }],
        schema: BriefingSchema,
        schemaName: "briefing",
      }),
    (b) =>
      checkGrounding(b.script, facts, {
        requireBrand: true,
        extra: [...b.highlights, ...b.nextActions].join("\n"),
      })
  );
  return { ...result, language, comparedTo: facts.previousReportDate, warnings };
}

/** Cached per report pair and language, so switching back and forth costs nothing. */
export function getBriefing(
  cacheKey: string,
  facts: ReportFacts,
  language: VoiceLanguageCode,
  userId: string,
  deps?: Deps
): Promise<VoiceBriefing> {
  const key = `${cacheKey}:${language}`;
  const hit = briefingCache.get(key);
  if (hit) return hit;

  assertWithinRateLimit(userId);
  const { llms } = deps ?? defaultDeps();
  const pending = withFallback(llms, (llm) => generateBriefing(facts, language, llm));
  briefingCache.set(key, pending);
  pending.catch(() => briefingCache.delete(key));
  if (briefingCache.size > MAX_CACHED) {
    briefingCache.delete(briefingCache.keys().next().value!);
  }
  return pending;
}

export async function answerQuestion(
  facts: ReportFacts,
  language: VoiceLanguageCode,
  history: ChatTurn[],
  question: string,
  userId: string,
  deps?: Deps
): Promise<{ answer: string; warnings: string[] }> {
  assertWithinRateLimit(userId);
  const { llms } = deps ?? defaultDeps();
  const prior = trimHistory(history, MAX_HISTORY_TURNS);
  const ask = `${languageLine(language, facts)} Answer in 2 to 5 spoken sentences.\n\nQuestion: ${question}`;

  return withFallback(llms, async (llm) => {
    const { result, warnings } = await withGroundingRetry(
      "Answer",
      async (fix) => {
        const answer = await llm.text({
          system: ANALYST_SYSTEM,
          facts,
          messages: [...prior, { role: "user", content: ask + fix }],
        });
        if (!answer) throw new VoiceAgentError("Empty answer from the AI", 502);
        return answer;
      },
      (answer) => checkGrounding(answer, facts)
    );
    return { answer: result, warnings };
  });
}

export async function tutorReply(
  facts: ReportFacts,
  language: VoiceLanguageCode,
  level: TutorLevel,
  history: ChatTurn[],
  message: string,
  userId: string,
  deps?: Deps
): Promise<TutorReply> {
  assertWithinRateLimit(userId);
  const { llms } = deps ?? defaultDeps();
  const prior = trimHistory(history, MAX_TUTOR_HISTORY_TURNS);
  const ask = `${languageLine(language, facts)} Learner level: ${level}.\n\nLearner: ${message}`;

  return withFallback(llms, async (llm) => {
    const { result, warnings } = await withGroundingRetry(
      "Tutor reply",
      async (fix) => {
        const reply = await llm.json({
          system: TUTOR_SYSTEM,
          facts,
          messages: [...prior, { role: "user", content: ask + fix }],
          schema: TutorSchema,
          schemaName: "tutor_reply",
        });
        if (!reply.reply.trim()) throw new VoiceAgentError("Empty answer from the AI", 502);
        return { reply: reply.reply.trim(), suggestions: reply.suggestions.slice(0, 3) };
      },
      // The metric definitions legitimately contain numbers (weights, "top 3").
      (r) => checkGrounding(r.reply, facts, { allowedFrom: METRIC_DEFINITIONS })
    );
    return { ...result, warnings };
  });
}

/** Test hook. */
export function resetVoiceAgentState() {
  briefingCache.clear();
  callLog.clear();
}
