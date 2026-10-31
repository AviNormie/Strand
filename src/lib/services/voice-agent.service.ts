import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod/v4";
import { getConfig } from "@/lib/config";
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

export type VoiceBriefing = z.infer<typeof BriefingSchema> & {
  language: VoiceLanguageCode;
  comparedTo: string | null;
  warnings: string[];
};

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

type Deps = { client: Anthropic; model: string };

function defaultDeps(): Deps {
  const config = getConfig();
  if (!config.anthropicApiKey) {
    throw new VoiceAgentError("Voice agent needs ANTHROPIC_API_KEY on the server", 503);
  }
  return {
    client: new Anthropic({ apiKey: config.anthropicApiKey, maxRetries: 2 }),
    model: config.voiceModel,
  };
}

// Stable across languages and turns so the facts block stays prompt-cached.
const SYSTEM = `You are Strand's voice analyst. Strand measures how often AI assistants (ChatGPT, Gemini, Claude, Groq) mention, rank and cite a brand versus its competitors.

You speak to the brand's marketing team. Your words are read aloud by a text-to-speech voice.

Grounding rules (strict):
- Use ONLY the REPORT FACTS JSON provided. Never invent metrics, competitors, sources, dates or causes.
- Percentages are already in percent. "changes" are percentage-point differences versus the previous report; null "changes" means there is no previous report, so do not describe trends.
- When explaining why a competitor gains visibility, cite the evidence in the facts (share of voice change, gap prompts where they appear and the brand does not, sources cited). If the facts do not explain it, say the data does not show why.
- If asked something the facts cannot answer, say so briefly and offer what the data does show.

Speaking style:
- Conversational, warm, concise. No markdown, bullets, emojis, URLs or tables in spoken text.
- Write every number with Western digits (0-9) exactly as it appears in the facts, rounded to at most one decimal.
- Keep brand names, competitor names, product names, AI assistant names and source domains exactly as written in the facts, untranslated.
- When writing in another language, keep common technical terms (share of voice, visibility score, citation, prompt) in English where a native speaker would.`;

function factsBlock(facts: ReportFacts): Anthropic.Beta.BetaTextBlockParam {
  return {
    type: "text",
    text: `REPORT FACTS:\n${JSON.stringify(facts)}`,
    cache_control: { type: "ephemeral" },
  };
}

function languageLine(code: VoiceLanguageCode) {
  return `Respond in ${getVoiceLanguage(code).prompt}.`;
}

/** `spoken` must name the brand verbatim; `extra` text is only checked for invented numbers. */
function checkGrounding(spoken: string, facts: ReportFacts, requireBrand: boolean, extra = "") {
  const issues: string[] = [];
  const bad = findUngroundedNumbers(`${spoken}\n${extra}`, facts);
  if (bad.length) issues.push(`These numbers are not in the facts: ${bad.join(", ")}`);
  if (requireBrand && !mentionsBrand(spoken, facts)) {
    issues.push(`The brand name "${facts.brand}" must appear verbatim`);
  }
  return issues;
}

// Server-side fallback keeps the request alive if the primary model declines.
const FALLBACK = {
  betas: ["server-side-fallback-2026-06-01"],
  fallbacks: [{ model: "claude-opus-4-8" }],
};

function assertNotRefused(stopReason: string | null) {
  if (stopReason === "refusal") {
    throw new VoiceAgentError("The assistant declined to answer that", 422);
  }
}

export function toVoiceAgentError(error: unknown): VoiceAgentError {
  if (error instanceof VoiceAgentError) return error;
  if (error instanceof Anthropic.RateLimitError) {
    return new VoiceAgentError(
      "Claude is rate limited right now. Try again shortly.",
      429,
      error.headers?.get("retry-after") ?? undefined
    );
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return new VoiceAgentError("Voice agent API key is invalid", 503);
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new VoiceAgentError("Could not reach Claude. Try again.", 503);
  }
  if (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500) {
    return new VoiceAgentError("Claude is temporarily unavailable. Try again.", 503);
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

async function generateBriefing(
  facts: ReportFacts,
  language: VoiceLanguageCode,
  deps: Deps
): Promise<VoiceBriefing> {
  const ask = `${languageLine(language)}
Write the briefing for ${facts.brand}${facts.previousReportDate ? ` comparing the report of ${facts.reportDate} with the previous one from ${facts.previousReportDate}` : ` from the report of ${facts.reportDate} (first report, no comparison available)`}.
- script: 120 to 180 words, spoken aloud. Cover visibility and how it changed, competitor movements, new competitor mentions, citation gains or losses, which prompt categories work best, and end with the single most important next step.
- highlights: 3 to 5 short transcript lines with the key numbers.
- nextActions: 2 or 3 concrete priorities grounded in gap prompts, content suggestions or the recommendation excerpt.`;

  let issues: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const content = issues.length
      ? `${ask}\n\nYour previous draft had problems. Fix them: ${issues.join("; ")}.`
      : ask;
    const response = await deps.client.beta.messages.parse({
      model: deps.model,
      max_tokens: 16000,
      ...FALLBACK,
      system: [{ type: "text", text: SYSTEM }, factsBlock(facts)],
      output_config: { effort: "low", format: betaZodOutputFormat(BriefingSchema) },
      messages: [{ role: "user", content }],
    });
    assertNotRefused(response.stop_reason);
    const parsed = response.parsed_output;
    if (!parsed) throw new VoiceAgentError("Briefing came back malformed", 502);

    issues = checkGrounding(
      parsed.script,
      facts,
      true,
      [...parsed.highlights, ...parsed.nextActions].join("\n")
    );
    if (!issues.length || attempt === 1) {
      if (issues.length) log.warn("Briefing failed grounding twice", { issues });
      return {
        ...parsed,
        language,
        comparedTo: facts.previousReportDate,
        warnings: issues,
      };
    }
    log.warn("Briefing failed grounding — retrying", { issues });
  }
  throw new VoiceAgentError("Unreachable", 500);
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
  const pending = generateBriefing(facts, language, deps ?? defaultDeps());
  briefingCache.set(key, pending);
  pending.catch(() => briefingCache.delete(key));
  if (briefingCache.size > MAX_CACHED) {
    briefingCache.delete(briefingCache.keys().next().value!);
  }
  return pending;
}

const MAX_HISTORY_TURNS = 8;

export async function answerQuestion(
  facts: ReportFacts,
  language: VoiceLanguageCode,
  history: ChatTurn[],
  question: string,
  userId: string,
  deps?: Deps
): Promise<{ answer: string; warnings: string[] }> {
  assertWithinRateLimit(userId);
  const d = deps ?? defaultDeps();
  const prior: Anthropic.Beta.BetaMessageParam[] = history
    .slice(-MAX_HISTORY_TURNS)
    .map((t) => ({ role: t.role, content: t.content }));
  // The API requires the first message to be from the user.
  while (prior[0]?.role === "assistant") prior.shift();

  const ask = `${languageLine(language)} Answer in 2 to 5 spoken sentences.\n\nQuestion: ${question}`;
  let issues: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const content = issues.length
      ? `${ask}\n\nYour previous answer had problems. Fix them: ${issues.join("; ")}.`
      : ask;
    const response = await d.client.beta.messages.create({
      model: d.model,
      max_tokens: 16000,
      ...FALLBACK,
      system: [{ type: "text", text: SYSTEM }, factsBlock(facts)],
      output_config: { effort: "low" },
      messages: [...prior, { role: "user", content }],
    });
    assertNotRefused(response.stop_reason);
    const answer = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();
    if (!answer) throw new VoiceAgentError("Empty answer from Claude", 502);

    issues = checkGrounding(answer, facts, false);
    if (!issues.length || attempt === 1) return { answer, warnings: issues };
    log.warn("Answer failed grounding — retrying", { issues });
  }
  throw new VoiceAgentError("Unreachable", 500);
}

/** Test hook. */
export function resetVoiceAgentState() {
  briefingCache.clear();
  callLog.clear();
}
