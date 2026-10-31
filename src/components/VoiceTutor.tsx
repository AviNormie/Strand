"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { postJson, readStoredLanguage, storeLanguage } from "@/lib/voice/client";
import { VOICE_LANGUAGES, getVoiceLanguage, type VoiceLanguageCode } from "@/lib/voice/languages";
import {
  createRecognition,
  createSpeaker,
  hasSpeechRecognition,
  isSpeechSupported,
  loadVoices,
  pickVoice,
  splitSentences,
} from "@/lib/voice/speech";

type Turn = { role: "user" | "assistant"; content: string; warnings?: string[] };
type Phase = "idle" | "listening" | "thinking" | "speaking" | "paused";
type Level = "beginner" | "intermediate" | "expert";
type Props = { jobId: string; brand: string; competitors: string[] };

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: "beginner", label: "New to this" },
  { value: "intermediate", label: "Some SEO" },
  { value: "expert", label: "Expert" },
];
const LEVEL_KEY = "strand.tutorLevel";
const sessionKey = (jobId: string) => `strand.tutor.${jobId}`;

function readLevel(): Level {
  try {
    const v = localStorage.getItem(LEVEL_KEY);
    return LEVELS.some((l) => l.value === v) ? (v as Level) : "beginner";
  } catch {
    return "beginner";
  }
}

/** Conversation survives reloads within the browser session. */
function readSession(jobId: string): Turn[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(sessionKey(jobId)) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function starterSuggestions(brand: string, competitors: string[]) {
  return [
    "Explain my visibility score like I'm new to this",
    competitors[0] ? `Why is ${competitors[0]} ahead of ${brand}?` : `Where is ${brand} weakest?`,
    "What is GEO and how is it different from SEO?",
    "What changed since my last report?",
    "Quiz me on AI visibility",
  ];
}

const noopSubscribe = () => () => {};

/** Browser-only: language, level and session history live in web storage. */
export function VoiceTutor(props: Props) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!isClient) return <div className="cartoon-card h-96 animate-pulse" aria-hidden />;
  return <TutorInner {...props} />;
}

function TutorInner({ jobId, brand, competitors }: Props) {
  const [language, setLanguage] = useState<VoiceLanguageCode>(readStoredLanguage);
  const [level, setLevel] = useState<Level>(readLevel);
  const [turns, setTurns] = useState<Turn[]>(() => readSession(jobId));
  const [suggestions, setSuggestions] = useState(() => starterSuggestions(brand, competitors));
  const [phase, setPhase] = useState<Phase>("idle");
  const [speakingTurn, setSpeakingTurn] = useState<number | null>(null);
  const [sentence, setSentence] = useState(-1);
  const [interim, setInterim] = useState("");
  const [input, setInput] = useState("");
  const [handsFree, setHandsFree] = useState(true);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recRef = useRef<ReturnType<typeof createRecognition>>(null);
  const handsFreeRef = useRef(handsFree);
  const transcriptEnd = useRef<HTMLDivElement>(null);
  const [speaker] = useState(() =>
    createSpeaker({
      onSentence: setSentence,
      onEnd: () => {
        setPhase("idle");
        setSentence(-1);
        setSpeakingTurn(null);
      },
    })
  );

  const speechOk = isSpeechSupported();
  const canListen = hasSpeechRecognition();
  const lang = getVoiceLanguage(language);
  const voice = pickVoice(voices, lang.speech);

  useEffect(() => {
    loadVoices().then(setVoices);
    return () => {
      speaker.stop();
      recRef.current?.stop();
    };
  }, [speaker]);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  useEffect(() => {
    try {
      sessionStorage.setItem(sessionKey(jobId), JSON.stringify(turns.slice(-40)));
    } catch {
      // History just won't survive a reload.
    }
    transcriptEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns, jobId]);

  function silence() {
    speaker.stop();
    setSpeakingTurn(null);
    setSentence(-1);
  }

  function speakTurn(text: string, index: number) {
    if (!speechOk) {
      setPhase("idle");
      return;
    }
    setSpeakingTurn(index);
    setPhase("speaking");
    speaker.play(splitSentences(text), lang.speech, voice, 0, () => {
      // Hands-free: hand the floor back to the learner, like a real conversation.
      if (handsFreeRef.current) listen();
    });
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || phase === "thinking") return;
    silence();
    setInput("");
    setError(null);
    setPhase("thinking");
    const history = turns.map(({ role, content }) => ({ role, content }));
    const withUser: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(withUser);
    try {
      const res = await postJson<{ reply: string; suggestions: string[]; warnings: string[] }>(
        `/api/voice/${jobId}/tutor`,
        { language, level, message, history }
      );
      setTurns([...withUser, { role: "assistant", content: res.reply, warnings: res.warnings }]);
      if (res.suggestions.length) setSuggestions(res.suggestions);
      speakTurn(res.reply, withUser.length);
    } catch (err) {
      setTurns(turns);
      setInput(message);
      setPhase("idle");
      setError({
        message: err instanceof Error ? err.message : "The tutor couldn't answer",
        retry: () => void send(message),
      });
    }
  }

  function listen() {
    const rec = createRecognition(lang.speech, true);
    if (!rec) return;
    silence();
    recRef.current?.stop();
    recRef.current = rec;
    let finalText = "";
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0]?.transcript ?? "";
        if (e.results[i].isFinal) finalText = text;
      }
      setInterim(text);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setHandsFree(false);
        setError({ message: "Microphone access is blocked. Allow it in your browser, or type below.", retry: listen });
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setError({ message: `Microphone error: ${e.error}`, retry: listen });
      }
    };
    rec.onend = () => {
      if (recRef.current === rec) recRef.current = null;
      setInterim("");
      if (finalText.trim()) void send(finalText);
      else setPhase((p) => (p === "listening" ? "idle" : p));
    };
    setError(null);
    setPhase("listening");
    rec.start();
  }

  function onMic() {
    if (phase === "listening") recRef.current?.stop();
    else if (phase !== "thinking") listen(); // also interrupts the tutor mid-sentence
  }

  function pause() {
    speaker.pause();
    setPhase("paused");
  }

  function resume() {
    setPhase("speaking");
    speaker.resume();
  }

  function replayLast() {
    const index = turns.findLastIndex((t) => t.role === "assistant");
    if (index >= 0) speakTurn(turns[index].content, index);
  }

  function stop() {
    silence();
    setPhase("idle");
  }

  function changeLanguage(code: VoiceLanguageCode) {
    stop();
    setLanguage(code);
    storeLanguage(code);
  }

  function changeLevel(value: Level) {
    setLevel(value);
    try {
      localStorage.setItem(LEVEL_KEY, value);
    } catch {
      // Preference just won't persist.
    }
  }

  function newSession() {
    stop();
    recRef.current?.stop();
    setTurns([]);
    setError(null);
    setSuggestions(starterSuggestions(brand, competitors));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const status = {
    idle: canListen ? "Tap the mic and ask anything" : "Type a question below",
    listening: "Listening… tap again when you're done",
    thinking: "Thinking…",
    speaking: canListen ? "Speaking. Tap the mic to interrupt" : "Speaking…",
    paused: "Paused",
  }[phase];

  const micTone = {
    idle: "bg-white",
    listening: "bg-accent-green motion-safe:animate-pulse",
    thinking: "bg-accent-yellow",
    speaking: "bg-accent-blue",
    paused: "bg-accent-blue/50",
  }[phase];

  return (
    <section className="cartoon-card space-y-6 p-5 sm:p-8" aria-label="Voice tutor">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="text-sm">
          <span className="font-hand block text-lg">Language</span>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value as VoiceLanguageCode)}
            className="mt-1 rounded-2xl border-2 border-ink bg-white px-3 py-1.5 text-ink outline-none focus:shadow-[3px_3px_0_0_#111]"
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <div role="radiogroup" aria-label="Your level" className="text-sm">
          <span className="font-hand block text-lg">Your level</span>
          <div className="mt-1 flex overflow-hidden rounded-full border-2 border-ink">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={level === l.value}
                onClick={() => changeLevel(l.value)}
                className={`px-3 py-1.5 text-xs font-semibold ${level === l.value ? "bg-ink text-paper" : "bg-white"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-2">
        <button
          type="button"
          onClick={onMic}
          disabled={!canListen || phase === "thinking"}
          aria-label={phase === "listening" ? "Stop listening" : "Talk to the tutor"}
          className={`flex h-28 w-28 items-center justify-center rounded-full border-2 border-ink shadow-[4px_4px_0_0_#111] transition-transform active:translate-y-px disabled:opacity-60 ${micTone}`}
        >
          <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
          </svg>
        </button>
        <p className="text-sm font-semibold" aria-live="polite">
          {status}
        </p>
        {phase === "listening" && (
          <p className="min-h-6 max-w-xl text-center text-sm italic text-ink/70" lang={lang.speech}>
            {interim || "…"}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {phase === "speaking" && (
            <button type="button" onClick={pause} className="cartoon-btn px-4 py-1.5 text-sm">
              Pause
            </button>
          )}
          {phase === "paused" && (
            <button type="button" onClick={resume} className="cartoon-btn px-4 py-1.5 text-sm">
              Resume
            </button>
          )}
          {(phase === "speaking" || phase === "paused") && (
            <button type="button" onClick={stop} className="cartoon-btn px-4 py-1.5 text-sm">
              Stop
            </button>
          )}
          {speechOk && phase === "idle" && turns.some((t) => t.role === "assistant") && (
            <button type="button" onClick={replayLast} className="cartoon-btn px-4 py-1.5 text-sm">
              Replay
            </button>
          )}
        </div>
        {canListen && (
          <label className="flex items-center gap-2 text-xs text-ink/70">
            <input type="checkbox" checked={handsFree} onChange={(e) => setHandsFree(e.target.checked)} />
            Hands-free: listen again after each answer
          </label>
        )}
      </div>

      {!canListen && (
        <p className="text-center text-sm text-ink/60">
          Voice input needs Chrome, Edge or Safari. You can still type, and answers are read aloud.
        </p>
      )}
      {!speechOk ? (
        <p className="text-center text-sm text-ink/60">This browser can&apos;t speak aloud; answers appear as text.</p>
      ) : voices.length > 0 && !voice ? (
        <p className="text-center text-sm text-ink/60">
          No {lang.label} voice is installed on this device, so a default voice may be used. Add one in your
          system&apos;s speech settings.
        </p>
      ) : null}

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-ink bg-accent-yellow/40 px-4 py-3 text-sm">
          <span>{error.message}</span>
          <button type="button" onClick={error.retry} className="cartoon-btn px-3 py-1 text-xs">
            Retry
          </button>
        </div>
      )}

      {turns.length > 0 && (
        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1" aria-label="Conversation">
          {turns.map((t, i) => (
            <div
              key={i}
              className={`rounded-2xl border-2 border-ink px-4 py-3 text-sm leading-relaxed ${t.role === "user" ? "ml-8 bg-accent-blue/30" : "mr-8 bg-white"}`}
            >
              <p className="font-hand text-base text-ink/60">{t.role === "user" ? "You" : "Tutor"}</p>
              {t.role === "assistant" ? (
                <p lang={lang.speech}>
                  {splitSentences(t.content).map((s, j) => (
                    <span key={j} className={speakingTurn === i && sentence === j ? "bg-accent-yellow" : undefined}>
                      {s}{" "}
                    </span>
                  ))}
                </p>
              ) : (
                <p>{t.content}</p>
              )}
              {t.role === "assistant" && (
                <div className="mt-2 flex items-center gap-3">
                  {speechOk && (
                    <button
                      type="button"
                      onClick={() => speakTurn(t.content, i)}
                      className="text-xs font-semibold underline underline-offset-2"
                    >
                      {speakingTurn === i ? "Speaking…" : "Play"}
                    </button>
                  )}
                  {t.warnings && t.warnings.length > 0 && (
                    <span className="text-xs text-ink/55">Some figures couldn&apos;t be verified against your report.</span>
                  )}
                </div>
              )}
            </div>
          ))}
          {phase === "thinking" && <p className="mr-8 text-sm italic text-ink/60">Tutor is thinking…</p>}
          <div ref={transcriptEnd} />
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="font-hand text-lg">Try asking</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                disabled={phase === "thinking"}
                className="rounded-full border-2 border-ink bg-white px-3 py-1.5 text-left text-xs font-medium disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={800}
          placeholder="Or type your question…"
          aria-label="Type a question for the tutor"
          className="min-w-0 flex-1 rounded-2xl border-2 border-ink bg-white px-3.5 py-2.5 text-ink outline-none transition-shadow placeholder:text-ink/35 focus:shadow-[3px_3px_0_0_#111]"
        />
        <button
          type="submit"
          disabled={phase === "thinking" || !input.trim()}
          className="cartoon-btn px-4 py-2.5 text-sm disabled:opacity-50"
        >
          Send
        </button>
        {turns.length > 0 && (
          <button type="button" onClick={newSession} className="cartoon-btn px-4 py-2.5 text-sm">
            New session
          </button>
        )}
      </form>
    </section>
  );
}
