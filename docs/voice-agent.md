# Voice agent

Multilingual spoken briefings and follow-up Q&A on a completed report (`/dashboard/[jobId]`, owner only),
plus a conversational voice tutor (`/dashboard/[jobId]/tutor`).

## Flow

```
VoiceAgentPanel ── POST /api/voice/[jobId]/briefing {language}
                └─ POST /api/voice/[jobId]/ask      {language, question, history}
VoiceTutor ────── POST /api/voice/[jobId]/tutor    {language, level, message, history} → {reply, suggestions}
   → loadVoiceFacts (src/lib/voice/load.ts): current report + previous COMPLETED report for the same company
   → buildReportFacts (src/lib/voice/facts.ts): deterministic metric changes, competitor movements,
     new/dropped brand mentions, citation gains/losses, category + prompt performance
   → voice-agent.service.ts: OpenAI (VOICE_OPENAI_MODEL) sees only that facts JSON; structured output for briefings and tutor replies.
     If OpenAI fails for any reason (bad key, rate limit, outage, refusal, malformed output) the same prompt
     goes to Claude (VOICE_MODEL); the first error is reported only if every backend fails
   → grounding.ts: numbers must exist in the facts, brand name must survive translation; one corrective retry,
     then the response is returned with `warnings` (shown in the UI) rather than hidden
   → speech.ts: browser Web Speech API reads the text sentence by sentence
```

- The models generate text only. Audio comes from the browser's built-in voices (`speechSynthesis`); questions
  can be typed or spoken (`SpeechRecognition`). No other speech provider is used.
- "Weekly" means "since the previous completed report for this company". Strand has no scheduler, so
  briefings are generated on first request and cached in memory per (report, previous report, language).
  Switching languages reuses the same facts; switching back to a language already fetched is free.
- Public `/report/[jobId]` pages keep the local, non-AI summary button so anonymous visitors can't spend AI credits.

## Voice tutor

- Runs on OpenAI only (`VOICE_OPENAI_MODEL`); unlike the briefing and Q&A it has no Claude fallback, and without
  `OPENAI_API_KEY` the tutor endpoint returns 503. Reasoning models are called with low reasoning effort to keep
  spoken turns around 5 seconds (medium took ~15s).
- Central mic: tap to talk (live interim caption while speaking), tap again to send; tapping while the tutor speaks
  interrupts it. Hands-free mode listens again after each answer. Pause / resume / stop / replay, sentence highlighting.
- Learner level (New to this / Some SEO / Expert) changes how explanations are pitched. The tutor explains concepts
  (share of voice, citations, sentiment, prompt tracking, benchmarking, GEO vs SEO) using Strand's real metric formulas
  and ties them to the brand's own facts. "Start a short lesson" runs a guided session one step per reply, each
  ending in a knowledge check; quizzes run one question at a time. It addresses the learner gender-neutrally.
- Language can change mid-conversation; replies follow the selected language and mirror Hindi/English code-switching.
- Suggested questions start from the brand/competitors and are then generated per reply. The conversation is kept in
  `sessionStorage` (per report, last 40 turns); language and level in `localStorage`.
- Barge-in is by tapping, not by talking over the voice: browsers can't reliably separate the user's voice from the
  speaker output.

## Limits

| Area | Limitation |
|---|---|
| Voices | Depend on the OS/browser. macOS ships Hindi (Lekha), Bengali (Piya), Tamil (Vani), Telugu (Geeta); Windows and Linux often lack Indic voices. With no matching voice the panel says so and the transcript still works. On-device voices are preferred; Chrome's "Google …" voices stream from Google and are only used when no local voice exists. |
| Hinglish | Written in Roman script and read with an `en-IN` voice; pronunciation of Hindi words varies by voice. |
| Voice input | Chrome, Edge and Safari only (Firefox has no `SpeechRecognition`). Chrome sends audio to its own recognition service. Typed questions work everywhere. |
| Pause | Implemented as stop + restart of the current sentence (`speechSynthesis.pause()` is unreliable on Android/Chrome). |
| Cache / rate limit | In process memory: lost on restart, not shared across instances. 30 Claude calls per user per 10 minutes. |
| Grounding | Checks numbers and the brand name, not every claim. |
| Numerals | Claude is told to use Western digits so figures can be verified; native-script digits would be flagged. |

## Config

- `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` (at least one; with neither the endpoints return 503). Order: OpenAI, then Claude.
- `VOICE_OPENAI_MODEL` (default `gpt-5-mini`, an affordable model) is the primary, kept separate from `OPENAI_MODEL`,
  which drives the web-search scans. Structured outputs use JSON Schema generated from the same zod schema.
- `VOICE_MODEL` (default `claude-haiku-5-5`, the low-cost Claude tier) is the fallback, at low effort, with prompt caching on the facts block.

## Tests

`npm test` runs `src/lib/voice/voice.test.ts`: fact accuracy, grounding, language mapping, sentence splitting,
voice choice, provider order and fallback, tutor prompting and grounding, and request/retry/cache/refusal logic against
fake clients. Live tests (OpenAI Hindi briefing, OpenAI Hinglish tutor, Claude Hindi briefing) run when the matching key
is set; Prisma loads `.env`, so a filled `.env` enables them. Live tests occasionally fail when a model trips the
number check twice (the app then shows a "couldn't be verified" note instead of failing).
