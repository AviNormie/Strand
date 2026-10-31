"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { postJson, readStoredLanguage, storeLanguage } from "@/lib/voice/client";
import {
  VOICE_LANGUAGES,
  getVoiceLanguage,
  type VoiceLanguageCode,
} from "@/lib/voice/languages";
import {
  createRecognition,
  createSpeaker,
  hasSpeechRecognition,
  isSpeechSupported,
  loadVoices,
  pickVoice,
  splitSentences,
} from "@/lib/voice/speech";

type Briefing = {
  script: string;
  highlights: string[];
  nextActions: string[];
  comparedTo: string | null;
  warnings: string[];
};

type Turn = { role: "user" | "assistant"; content: string; warnings?: string[] };

type Playing = { source: "briefing" } | { source: "answer"; turn: number } | null;

// Only mounted after the report loads client-side, so browser APIs are safe to read here.
export function VoiceAgentPanel({ jobId }: { jobId: string }) {
  const [language, setLanguage] = useState<VoiceLanguageCode>(readStoredLanguage);
  const [briefings, setBriefings] = useState<Partial<Record<VoiceLanguageCode, Briefing>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState<Playing>(null);
  const [paused, setPaused] = useState<Playing>(null);
  const [sentence, setSentence] = useState(-1);
  const [briefingResumeAt, setBriefingResumeAt] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaker] = useState(() =>
    createSpeaker({
      onSentence: setSentence,
      onEnd: () => {
        setPlaying(null);
        setSentence(-1);
      },
    })
  );

  const speechOk = isSpeechSupported();
  const lang = getVoiceLanguage(language);
  const voice = pickVoice(voices, lang.speech);
  const briefing = briefings[language];
  const briefingSentences = briefing ? splitSentences(briefing.script) : [];
  const canListen = hasSpeechRecognition();

  useEffect(() => {
    loadVoices().then(setVoices);
    return () => speaker.stop();
  }, [speaker]);

  function stopAll() {
    speaker.stop();
    setPlaying(null);
    setPaused(null);
    setSentence(-1);
  }

  function changeLanguage(code: VoiceLanguageCode) {
    stopAll();
    setBriefingResumeAt(null);
    setError(null);
    setLanguage(code);
    storeLanguage(code);
  }

  function speakBriefing(b: Briefing, startAt = 0) {
    setPaused(null);
    setBriefingResumeAt(null);
    if (!speechOk) return;
    setPlaying({ source: "briefing" });
    speaker.play(splitSentences(b.script), lang.speech, voice, startAt);
  }

  async function loadBriefing() {
    setLoading(true);
    setError(null);
    try {
      const b = await postJson<Briefing>(`/api/voice/${jobId}/briefing`, { language });
      setBriefings((prev) => ({ ...prev, [language]: b }));
      speakBriefing(b);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Could not load the briefing",
        retry: loadBriefing,
      });
    } finally {
      setLoading(false);
    }
  }

  function play() {
    if (briefing) speakBriefing(briefing);
    else void loadBriefing();
  }

  function pause() {
    speaker.pause();
    setPaused(playing);
    setPlaying(null);
  }

  function resume() {
    setPlaying(paused);
    setPaused(null);
    speaker.resume();
  }

  /** Interrupt: questions pause the briefing and remember where it stopped. */
  function interruptBriefing() {
    if (playing?.source === "briefing" || paused?.source === "briefing") {
      setBriefingResumeAt(speaker.index);
    }
    speaker.pause();
    setPlaying(null);
    setPaused(null);
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || asking) return;
    interruptBriefing();
    setQuestion("");
    setAsking(true);
    setError(null);
    const history = turns.map(({ role, content }) => ({ role, content }));
    const withQuestion: Turn[] = [...turns, { role: "user", content: q }];
    setTurns(withQuestion);
    try {
      const res = await postJson<{ answer: string; warnings: string[] }>(
        `/api/voice/${jobId}/ask`,
        { language, question: q, history }
      );
      const index = withQuestion.length;
      setTurns([...withQuestion, { role: "assistant", content: res.answer, warnings: res.warnings }]);
      speakAnswer(res.answer, index);
    } catch (err) {
      setTurns(turns);
      setQuestion(q);
      setError({
        message: err instanceof Error ? err.message : "Could not answer that",
        retry: () => void ask(q),
      });
    } finally {
      setAsking(false);
    }
  }

  function speakAnswer(text: string, turn: number) {
    if (!speechOk) return;
    setPaused(null);
    setPlaying({ source: "answer", turn });
    speaker.play(splitSentences(text), lang.speech, voice);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  function listen() {
    const rec = createRecognition(lang.speech);
    if (!rec) return;
    interruptBriefing();
    setListening(true);
    rec.onresult = (e) => {
      const heard = e.results[0]?.[0]?.transcript ?? "";
      if (heard) void ask(heard);
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError({ message: `Microphone error: ${e.error}`, retry: listen });
      }
    };
    rec.onend = () => setListening(false);
    rec.start();
  }

  const isBriefingActive = playing?.source === "briefing" || paused?.source === "briefing";

  return (
    <section className="cartoon-card space-y-5 p-5 sm:p-8" aria-label="Voice briefing">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Voice briefing</h2>
          <p className="mt-1 text-sm text-ink/65">
            {briefing
              ? briefing.comparedTo
                ? `Compared with your report from ${briefing.comparedTo}.`
                : "First report for this brand, so there's no comparison yet."
              : "A short spoken summary of this report. Ask follow-up questions any time."}
          </p>
          <Link
            href={`/dashboard/${jobId}/tutor`}
            className="mt-2 inline-block text-sm font-semibold underline underline-offset-2"
          >
            Learn with the voice tutor →
          </Link>
        </div>
        <label className="text-sm">
          <span className="font-hand text-lg">Language</span>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value as VoiceLanguageCode)}
            className="ml-2 rounded-2xl border-2 border-ink bg-white px-3 py-1.5 text-ink outline-none focus:shadow-[3px_3px_0_0_#111]"
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {playing ? (
          <button type="button" onClick={pause} className="cartoon-btn px-4 py-2 text-sm">
            Pause
          </button>
        ) : paused ? (
          <button type="button" onClick={resume} className="cartoon-btn px-4 py-2 text-sm">
            Resume
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            disabled={loading}
            className="cartoon-btn px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Preparing briefing…" : briefing ? "Play briefing" : "Generate & play"}
          </button>
        )}
        {briefing && (
          <button type="button" onClick={() => speakBriefing(briefing)} className="cartoon-btn px-4 py-2 text-sm">
            Replay
          </button>
        )}
        {briefing && briefingResumeAt != null && !isBriefingActive && (
          <button
            type="button"
            onClick={() => speakBriefing(briefing, briefingResumeAt)}
            className="cartoon-btn px-4 py-2 text-sm"
          >
            Back to briefing
          </button>
        )}
        {(playing || paused) && (
          <button type="button" onClick={stopAll} className="cartoon-btn px-4 py-2 text-sm">
            Stop
          </button>
        )}
      </div>

      {!speechOk ? (
        <p className="text-sm text-ink/60">
          This browser can&apos;t speak aloud. The transcript and Q&amp;A still work.
        </p>
      ) : voices.length > 0 && !voice ? (
        <p className="text-sm text-ink/60">
          No {lang.label} voice is installed on this device, so it may be read with a default voice.
          Add one in your system&apos;s speech settings, or read the transcript.
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

      {briefing && (
        <div className="space-y-4 rounded-2xl border-2 border-ink bg-white p-4 text-sm leading-relaxed">
          <p lang={lang.speech}>
            {briefingSentences.map((s, i) => (
              <span
                key={i}
                className={playing?.source === "briefing" && sentence === i ? "bg-accent-yellow" : undefined}
              >
                {s}{" "}
              </span>
            ))}
          </p>
          {briefing.highlights.length > 0 && (
            <ul className="list-disc space-y-1 pl-5" lang={lang.speech}>
              {briefing.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
          {briefing.nextActions.length > 0 && (
            <div>
              <p className="font-hand text-lg">Next steps</p>
              <ol className="list-decimal space-y-1 pl-5" lang={lang.speech}>
                {briefing.nextActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ol>
            </div>
          )}
          {briefing.warnings.length > 0 && (
            <p className="text-xs text-ink/55">
              Some figures in this briefing couldn&apos;t be matched to the report data. Check them
              against the numbers below.
            </p>
          )}
        </div>
      )}

      {turns.length > 0 && (
        <div className="space-y-3" aria-live="polite">
          {turns.map((t, i) => (
            <div
              key={i}
              className={`rounded-2xl border-2 border-ink px-4 py-3 text-sm ${t.role === "user" ? "ml-8 bg-accent-blue/30" : "mr-8 bg-white"}`}
            >
              <p lang={t.role === "assistant" ? lang.speech : undefined}>{t.content}</p>
              {t.role === "assistant" && (
                <div className="mt-2 flex items-center gap-3">
                  {speechOk && (
                    <button
                      type="button"
                      onClick={() => speakAnswer(t.content, i)}
                      className="text-xs font-semibold underline underline-offset-2"
                    >
                      {playing?.source === "answer" && playing.turn === i ? "Speaking…" : "Play answer"}
                    </button>
                  )}
                  {t.warnings && t.warnings.length > 0 && (
                    <span className="text-xs text-ink/55">Some figures couldn&apos;t be verified.</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder="Ask about competitors, citations, what to do next…"
          aria-label="Ask a question about this report"
          className="min-w-0 flex-1 rounded-2xl border-2 border-ink bg-white px-3.5 py-2.5 text-ink outline-none transition-shadow placeholder:text-ink/35 focus:shadow-[3px_3px_0_0_#111]"
        />
        {canListen && (
          <button
            type="button"
            onClick={listen}
            disabled={listening || asking}
            aria-label="Ask by voice"
            className="cartoon-btn px-4 py-2.5 text-sm disabled:opacity-60"
          >
            {listening ? "Listening…" : "Speak"}
          </button>
        )}
        <button
          type="submit"
          disabled={asking || !question.trim()}
          className="cartoon-btn px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {asking ? "Thinking…" : "Ask"}
        </button>
      </form>
    </section>
  );
}
