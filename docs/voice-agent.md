# Voice agent

Multilingual spoken briefings and follow-up Q&A on a completed report (`/dashboard/[jobId]`, owner only).

## Flow

```
VoiceAgentPanel ── POST /api/voice/[jobId]/briefing {language}
                └─ POST /api/voice/[jobId]/ask      {language, question, history}
   → loadVoiceFacts (src/lib/voice/load.ts): current report + previous COMPLETED report for the same company
   → buildReportFacts (src/lib/voice/facts.ts): deterministic metric changes, competitor movements,
     new/dropped brand mentions, citation gains/losses, category + prompt performance
   → voice-agent.service.ts: Claude (VOICE_MODEL) sees only that facts JSON; structured output for briefings
   → grounding.ts: numbers must exist in the facts, brand name must survive translation; one corrective retry,
     then the response is returned with `warnings` (shown in the UI) rather than hidden
   → speech.ts: browser Web Speech API reads the text sentence by sentence
```

- Claude generates text only. Audio comes from the browser's built-in voices (`speechSynthesis`); questions
  can be typed or spoken (`SpeechRecognition`). No other AI or speech provider is used.
- "Weekly" means "since the previous completed report for this company". Strand has no scheduler, so
  briefings are generated on first request and cached in memory per (report, previous report, language).
  Switching languages reuses the same facts; switching back to a language already fetched is free.
- Public `/report/[jobId]` pages keep the local, non-AI summary button so anonymous visitors can't spend Claude credits.

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

- `ANTHROPIC_API_KEY` (required; without it the endpoints return 503)
- `VOICE_MODEL` (default `claude-opus-5-5`). Requests use low effort, a server-side refusal fallback to `claude-opus-4-8`, and prompt caching on the facts block.

## Tests

`npm test` runs `src/lib/voice/voice.test.ts`: fact accuracy, grounding, language mapping, sentence splitting,
voice choice, and the Claude request/retry/cache/refusal logic against a fake client. The live multilingual test runs only
when `ANTHROPIC_API_KEY` is set.
