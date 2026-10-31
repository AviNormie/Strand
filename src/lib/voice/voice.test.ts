import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import Anthropic from "@anthropic-ai/sdk";
import type { SerializedReport } from "@/lib/report-serialize";
import OpenAI from "openai";
import {
  answerQuestion,
  assertWithinRateLimit,
  buildVoiceLlms,
  claudeVoiceLlm,
  getBriefing,
  openaiVoiceLlm,
  resetVoiceAgentState,
  toVoiceAgentError,
  tutorReply,
  VoiceAgentError,
} from "@/lib/services/voice-agent.service";
import { buildReportFacts } from "./facts";
import { findUngroundedNumbers, mentionsBrand } from "./grounding";
import { getVoiceLanguage } from "./languages";
import { pickVoice, splitSentences } from "./speech";

function response(promptId: string, brands: string[], citations: string[], ranking: number | null = null) {
  return {
    id: `${promptId}-${brands.join()}`,
    provider: "claude",
    model: "m",
    rawResponse: "",
    latencyMs: 1,
    error: null,
    extracted: { mentionedBrands: brands, citations, ranking, sentiment: null, reasoning: null },
  };
}

function report(overrides: Record<string, unknown>): SerializedReport {
  return {
    id: "job",
    companyName: "Acme CRM",
    competitors: ["HubSpot", "Zoho"],
    providers: ["claude", "gemini"],
    recommendation: null,
    createdAt: new Date("2026-10-30T10:00:00Z"),
    prompts: [],
    ...overrides,
  } as unknown as SerializedReport;
}

const current = report({
  metrics: {
    visibilityScore: 42.3,
    mentionRate: 50,
    shareOfVoice: 25,
    citationRate: 40,
    recommendationRate: 30,
    avgRanking: 2.5,
    positiveSentimentRate: 60,
    competitorShare: { "Acme CRM": 0.25, HubSpot: 0.45, Zoho: 0.2 },
  },
  prompts: [
    {
      id: "p1",
      category: "Comparison",
      prompt: "Best CRM for startups?",
      responses: [
        response("p1", ["Acme CRM", "HubSpot"], ["https://www.g2.com/crm"], 2),
        response("p1", ["HubSpot", "Pipedrive"], ["reddit.com"]),
      ],
    },
    {
      id: "p2",
      category: "Pricing",
      prompt: "Cheapest CRM?",
      responses: [
        response("p2", ["HubSpot", "Zoho"], ["https://capterra.com/a"]),
        response("p2", ["Zoho"], []),
      ],
    },
  ],
});

const previous = report({
  id: "prev",
  createdAt: new Date("2026-10-23T10:00:00Z"),
  metrics: {
    visibilityScore: 38,
    mentionRate: 40,
    shareOfVoice: 20,
    citationRate: 35,
    recommendationRate: 30,
    avgRanking: 3,
    positiveSentimentRate: null,
    competitorShare: { "Acme CRM": 0.2, HubSpot: 0.5, Zoho: 0.15 },
  },
  prompts: [
    {
      id: "p0",
      category: "Comparison",
      prompt: "Best CRM?",
      responses: [
        response("p0", ["Acme CRM", "HubSpot", "Freshsales"], ["g2.com", "https://techradar.com/x"]),
      ],
    },
  ],
});

const facts = buildReportFacts(current, previous);

describe("report facts (accuracy)", () => {
  test("week-over-week metric changes", () => {
    assert.equal(facts.changes?.visibilityScore, 4.3);
    assert.equal(facts.changes?.shareOfVoice, 5);
    assert.equal(facts.changes?.avgRanking, -0.5);
    assert.equal(facts.changes?.positiveSentimentRate, null);
    assert.equal(facts.previousReportDate, "2026-10-23");
  });

  test("competitor movements, sorted by share", () => {
    assert.deepEqual(
      facts.competitors.map((c) => [c.name, c.shareOfVoice, c.change]),
      [
        ["HubSpot", 45, -5],
        ["Zoho", 20, 5],
      ]
    );
  });

  test("new and dropped competitor mentions exclude the brand itself", () => {
    assert.deepEqual(facts.newlyMentionedBrands, [
      { name: "Zoho", mentions: 2 },
      { name: "Pipedrive", mentions: 1 },
    ]);
    assert.deepEqual(facts.droppedBrands, ["Freshsales"]);
  });

  test("citation gains, losses and brand sources", () => {
    assert.deepEqual(facts.citations.gainedSources.sort(), ["capterra.com", "reddit.com"]);
    assert.deepEqual(facts.citations.lostSources, ["techradar.com"]);
    assert.deepEqual(facts.citations.brandSources, ["g2.com"]);
  });

  test("prompt categories and gaps", () => {
    assert.deepEqual(facts.categories[0], {
      category: "Comparison",
      prompts: 1,
      brandMentionRate: 50,
      avgRanking: 2,
    });
    assert.equal(facts.categories[1].brandMentionRate, 0);
    assert.deepEqual(facts.gapPrompts, [
      { prompt: "Cheapest CRM?", category: "Pricing", competitorsMentioned: ["HubSpot", "Zoho"] },
    ]);
  });

  test("first report has no trends", () => {
    const solo = buildReportFacts(current, null);
    assert.equal(solo.changes, null);
    assert.deepEqual(solo.newlyMentionedBrands, []);
    assert.deepEqual(solo.citations.gainedSources, []);
  });
});

describe("grounding", () => {
  test("accepts numbers from the facts, rounded or comma-decimal", () => {
    assert.deepEqual(findUngroundedNumbers("Visibility rose 4.3 points to 42,3, about 42. HubSpot holds 45%.", facts), []);
  });

  test("flags invented metrics", () => {
    assert.deepEqual(findUngroundedNumbers("Acme CRM hit a 73% mention rate", facts), [73]);
  });

  test("brand must survive translation", () => {
    assert.ok(mentionsBrand("Acme CRM की दृश्यता बढ़ी", facts));
    assert.ok(!mentionsBrand("एक्मे सीआरएम की दृश्यता बढ़ी", facts));
  });
});

describe("languages and speech chunks", () => {
  test("Hinglish speaks with an Indian-English voice; unknown codes fall back to English", () => {
    assert.equal(getVoiceLanguage("hinglish").speech, "en-IN");
    assert.equal(getVoiceLanguage("xx").code, "en");
  });

  test("sentence split keeps decimals and handles Devanagari danda", () => {
    assert.deepEqual(splitSentences("Score is 42.3 now. Great! दृश्यता बढ़ी। Done"), [
      "Score is 42.3 now.",
      "Great!",
      "दृश्यता बढ़ी।",
      "Done",
    ]);
  });
});

type Call = {
  model: string;
  system: unknown;
  tools?: unknown;
  messages: Array<{ role: string; content: string }>;
};

function fakeClaude(replies: object[]) {
  const calls: Call[] = [];
  const next = async (params: Call) => {
    calls.push(params);
    const reply = replies.shift();
    if (!reply) throw new Error("unexpected Claude call");
    return reply;
  };
  const client = { beta: { messages: { parse: next, create: next } } } as unknown as Anthropic;
  return { calls, deps: { llms: [claudeVoiceLlm(client, "claude-haiku-5-5")] } };
}

function fakeOpenAI(contents: string[]) {
  const calls: Call[] = [];
  const create = async (params: Call) => {
    calls.push(params);
    return { choices: [{ message: { content: contents.shift() ?? "", refusal: null } }] };
  };
  const client = { chat: { completions: { create } } } as unknown as OpenAI;
  return { calls, llm: openaiVoiceLlm(client, "gpt-5-mini") };
}

const brokenClaude = () => {
  const fail = async () => {
    throw new Error("401 invalid x-api-key");
  };
  return claudeVoiceLlm({ beta: { messages: { parse: fail, create: fail } } } as unknown as Anthropic, "claude-haiku-5-5");
};

const briefingReply = (script: string) => ({
  stop_reason: "end_turn",
  parsed_output: { script, highlights: ["Acme CRM: 42.3"], nextActions: ["Win the Pricing prompts"] },
});
const textReply = (text: string) => ({ stop_reason: "end_turn", content: [{ type: "text", text }] });

const userText = (call: Call) => call.messages.at(-1)!.content;

describe("voice agent (Claude calls, faked)", () => {
  beforeEach(() => resetVoiceAgentState());

  test("multilingual briefing: language instruction, facts in system, no web tools", async () => {
    const { calls, deps } = fakeClaude([briefingReply("Acme CRM की visibility 42.3 हो गई है।")]);
    const b = await getBriefing("k", facts, "hi", "u1", deps);
    assert.equal(b.language, "hi");
    assert.deepEqual(b.warnings, []);
    assert.equal(b.comparedTo, "2026-10-23");
    assert.match(userText(calls[0]), /Respond in Hindi, in Devanagari script/);
    assert.match(userText(calls[0]), /exactly as spelled here, in Latin letters, never transliterated: Acme CRM, HubSpot, Zoho\./);
    assert.match(JSON.stringify(calls[0].system), /REPORT FACTS/);
    assert.equal(calls[0].tools, undefined);
    assert.equal(calls[0].model, "claude-haiku-5-5");
  });

  test("language switch reuses facts; repeat language is served from cache", async () => {
    const { calls, deps } = fakeClaude([
      briefingReply("Acme CRM visibility is 42.3."),
      briefingReply("La visibilité de Acme CRM est de 42.3."),
    ]);
    await getBriefing("k", facts, "en", "u1", deps);
    await getBriefing("k", facts, "fr", "u1", deps);
    await getBriefing("k", facts, "en", "u1", deps);
    assert.equal(calls.length, 2);
    assert.equal(JSON.stringify(calls[0].system), JSON.stringify(calls[1].system));
  });

  test("invented numbers trigger one corrective retry", async () => {
    const { calls, deps } = fakeClaude([
      briefingReply("Acme CRM visibility jumped to 99."),
      briefingReply("Acme CRM visibility is 42.3."),
    ]);
    const b = await getBriefing("k", facts, "en", "u1", deps);
    assert.equal(calls.length, 2);
    assert.match(userText(calls[1]), /99/);
    assert.deepEqual(b.warnings, []);
  });

  test("translated brand name triggers a retry; persistent failure is flagged, not hidden", async () => {
    const { calls, deps } = fakeClaude([
      briefingReply("एक्मे सीआरएम की visibility 42.3 है।"),
      briefingReply("एक्मे सीआरएम की visibility 42.3 है।"),
    ]);
    const b = await getBriefing("k", facts, "hi", "u1", deps);
    assert.equal(calls.length, 2);
    assert.ok(b.warnings.some((w) => w.includes("Acme CRM")));
  });

  test("refusals surface as a 422", async () => {
    const { deps } = fakeClaude([{ stop_reason: "refusal", parsed_output: null }]);
    await assert.rejects(getBriefing("k", facts, "en", "u1", deps), (e: VoiceAgentError) => e.status === 422);
  });

  test("follow-up questions keep history, start with a user turn, answer in the chosen language", async () => {
    const { calls, deps } = fakeClaude([textReply("HubSpot ka share 45 hai, Acme CRM ka 25.")]);
    const res = await answerQuestion(
      facts,
      "hinglish",
      [
        { role: "assistant", content: "briefing" },
        { role: "user", content: "How are we doing?" },
        { role: "assistant", content: "Visibility is 42.3." },
      ],
      "Why is HubSpot ahead?",
      "u1",
      deps
    );
    assert.equal(res.answer, "HubSpot ka share 45 hai, Acme CRM ka 25.");
    assert.equal(calls[0].messages[0].role, "user");
    assert.equal(calls[0].messages.length, 3);
    assert.match(userText(calls[0]), /Hinglish/);
  });

  test("OpenAI is tried first, Claude only as fallback", () => {
    const keys = { voiceOpenaiModel: "gpt-5-mini", voiceModel: "claude-haiku-5-5" };
    assert.deepEqual(
      buildVoiceLlms({ ...keys, openaiApiKey: "sk-test", anthropicApiKey: "sk-ant-test" }).map((l) => l.name),
      ["openai:gpt-5-mini", "claude:claude-haiku-5-5"]
    );
    assert.deepEqual(
      buildVoiceLlms({ ...keys, anthropicApiKey: "sk-ant-test" }).map((l) => l.name),
      ["claude:claude-haiku-5-5"]
    );
    assert.deepEqual(buildVoiceLlms(keys), []);
  });

  test("OpenAI answers when it works; Claude is never called", async () => {
    const openai = fakeOpenAI([
      JSON.stringify({ script: "Acme CRM visibility is 42.3.", highlights: [], nextActions: [] }),
      "HubSpot leads with 45% share of voice.",
    ]);
    const claude = fakeClaude([]);
    const deps = { llms: [openai.llm, ...claude.deps.llms] };
    const b = await getBriefing("k", facts, "fr", "u1", deps);
    assert.equal(b.script, "Acme CRM visibility is 42.3.");
    assert.equal(openai.calls[0].model, "gpt-5-mini");
    assert.match(openai.calls[0].messages[0].content, /REPORT FACTS/);
    assert.match(openai.calls[0].messages[1].content, /Respond in French/);
    const a = await answerQuestion(facts, "en", [], "Who leads?", "u1", deps);
    assert.equal(a.answer, "HubSpot leads with 45% share of voice.");
    assert.equal(claude.calls.length, 0);
  });

  test("falls back to Claude when OpenAI fails (e.g. invalid key or malformed output)", async () => {
    const openai = fakeOpenAI(["not json"]);
    const claude = fakeClaude([briefingReply("Acme CRM visibility is 42.3.")]);
    const b = await getBriefing("k", facts, "en", "u1", { llms: [openai.llm, ...claude.deps.llms] });
    assert.equal(openai.calls.length, 1);
    assert.equal(claude.calls.length, 1);
    assert.equal(b.script, "Acme CRM visibility is 42.3.");
  });

  test("when every backend fails, the first (OpenAI) error is reported", async () => {
    const openai = fakeOpenAI(["not json"]);
    await assert.rejects(
      getBriefing("k", facts, "en", "u1", { llms: [openai.llm, brokenClaude()] }),
      (e: Error) => e.message === "The AI reply came back malformed" && toVoiceAgentError(e).status === 502
    );
  });

  test("tutor: tutor persona, level, language, history and capped suggestions", async () => {
    const openai = fakeOpenAI([
      JSON.stringify({
        reply: "Share of voice ka matlab hai ki AI answers mein Acme CRM kitni baar aata hai. Aapka 25 percent hai.",
        suggestions: ["HubSpot aage kyun hai?", "Quiz me", "GEO kya hai?", "extra"],
      }),
    ]);
    const res = await tutorReply(
      facts,
      "hinglish",
      "beginner",
      [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello! What would you like to learn?" },
      ],
      "Share of voice kya hota hai?",
      "u1",
      { llms: [openai.llm] }
    );
    assert.deepEqual(res.warnings, []);
    assert.equal(res.suggestions.length, 3);
    const [system, ...turns] = openai.calls[0].messages;
    assert.match(system.content, /voice tutor/);
    assert.match(system.content, /35% mention rate/);
    assert.equal(turns.length, 3);
    assert.match(turns[2].content, /Hinglish/);
    assert.match(turns[2].content, /Learner level: beginner/);
    assert.match(turns[2].content, /Share of voice kya hota hai\?/);
  });

  test("tutor: metric-definition numbers pass, invented stats trigger a retry", async () => {
    const openai = fakeOpenAI([
      JSON.stringify({ reply: "Mention rate carries 35% of the visibility score. 80% of buyers use AI.", suggestions: [] }),
      JSON.stringify({ reply: "Mention rate carries 35% of the visibility score.", suggestions: [] }),
    ]);
    const res = await tutorReply(facts, "en", "expert", [], "How is visibility scored?", "u1", { llms: [openai.llm] });
    assert.equal(openai.calls.length, 2);
    assert.match(openai.calls[1].messages.at(-1)!.content, /80/);
    assert.equal(res.reply, "Mention rate carries 35% of the visibility score.");
  });

  test("tutor runs on OpenAI only: no Claude fallback, clear error without an OpenAI key", async () => {
    const claude = fakeClaude([]);
    const openai = fakeOpenAI([JSON.stringify({ reply: "Not valid for this check", suggestions: [] })]);
    // OpenAI fails (malformed); the tutor must not fall through to Claude.
    openai.llm.json = async () => {
      throw new VoiceAgentError("The AI reply came back malformed", 502);
    };
    await assert.rejects(
      tutorReply(facts, "en", "beginner", [], "Hi", "u1", { llms: [openai.llm, ...claude.deps.llms] }),
      (e: VoiceAgentError) => e.status === 502
    );
    assert.equal(claude.calls.length, 0);
    await assert.rejects(
      tutorReply(facts, "en", "beginner", [], "Hi", "u1", claude.deps),
      (e: VoiceAgentError) => e.status === 503 && /OPENAI_API_KEY/.test(e.message)
    );
  });

  test("per-user rate limit", () => {
    for (let i = 0; i < 30; i++) assertWithinRateLimit("u2", 1000);
    assert.throws(() => assertWithinRateLimit("u2", 1000), (e: VoiceAgentError) => e.status === 429);
    assert.doesNotThrow(() => assertWithinRateLimit("u3", 1000));
  });
});

// Real multilingual quality can only be checked against the live models.
test("live: Claude fallback writes a Hindi briefing in Devanagari, keeps names, stays grounded", { skip: !process.env.ANTHROPIC_API_KEY }, async () => {
  resetVoiceAgentState();
  const deps = { llms: [claudeVoiceLlm(new Anthropic(), process.env.VOICE_MODEL || "claude-haiku-5-5")] };
  const b = await getBriefing("live", facts, "hi", "live", deps);
  assert.match(b.script, /[ऀ-ॿ]/);
  assert.ok(mentionsBrand(b.script, facts));
  assert.deepEqual(b.warnings, []);
});

test("voice pick skips novelty voices and prefers on-device over network voices", () => {
  const v = (name: string, lang: string, localService = true) =>
    ({ name, lang, localService, default: false }) as SpeechSynthesisVoice;
  const voices = [v("Albert", "en-US"), v("Google US English", "en-US", false), v("Samantha", "en-US"), v("Google हिन्दी", "hi-IN", false), v("Lekha", "hi-IN")];
  assert.equal(pickVoice(voices, "en-US")?.name, "Samantha");
  assert.equal(pickVoice(voices, "hi-IN")?.name, "Lekha");
  assert.equal(pickVoice([v("Google हिन्दी", "hi-IN", false)], "hi-IN")?.name, "Google हिन्दी");
  assert.equal(pickVoice(voices, "ta-IN"), null);
});

test("live: OpenAI (primary) writes a grounded Hindi briefing", { skip: !process.env.OPENAI_API_KEY }, async () => {
  resetVoiceAgentState();
  const deps = { llms: [openaiVoiceLlm(new OpenAI(), process.env.VOICE_OPENAI_MODEL || "gpt-5-mini")] };
  const b = await getBriefing("live-openai", facts, "hi", "live", deps);
  assert.match(b.script, /[\u0900-\u097F]/);
  assert.ok(mentionsBrand(b.script, facts));
  assert.deepEqual(b.warnings, []);
});

test("live: OpenAI tutor explains a concept in Hinglish with the brand's own numbers", { skip: !process.env.OPENAI_API_KEY }, async () => {
  resetVoiceAgentState();
  const deps = { llms: [openaiVoiceLlm(new OpenAI(), process.env.VOICE_OPENAI_MODEL || "gpt-5-mini")] };
  const res = await tutorReply(facts, "hinglish", "beginner", [], "Share of voice kya hota hai, simple mein samjhao", "live", deps);
  assert.ok(mentionsBrand(res.reply, facts) || /HubSpot|Zoho/.test(res.reply));
  assert.ok(!/[\u0900-\u097F]/.test(res.reply), "Hinglish should be Roman script");
  assert.ok(res.suggestions.length >= 1);
  console.log("tutor sample:", res.reply, res.suggestions, res.warnings);
});
