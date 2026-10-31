/**
 * Browser-native speech layer: Web Speech API only, no external TTS/STT provider.
 * Voice quality and language coverage depend on the voices installed on the device.
 */

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Sentence chunks keep pause/resume precise and dodge Chrome's ~15s utterance cutoff. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।॥])\s+|(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  // Chrome fills the list asynchronously.
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
}

// macOS ships joke voices under en-US; never pick them.
const NOVELTY_VOICE =
  /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Fred|Good News|Grandma|Grandpa|Jester|Junior|Kathy|Organ|Ralph|Rocko|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/;

/**
 * Prefers on-device voices: Chrome's "Google …" voices stream from Google's servers,
 * so they are only a last resort when the device has no local voice for the language.
 */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const target = norm(lang);
  const rank = (v: SpeechSynthesisVoice) => (v.localService ? 0 : 2) - (v.default ? 1 : 0);
  const usable = voices
    .filter((v) => !NOVELTY_VOICE.test(v.name))
    .sort((a, b) => rank(a) - rank(b));
  return (
    usable.find((v) => norm(v.lang) === target) ??
    usable.find((v) => norm(v.lang).split("-")[0] === target.split("-")[0]) ??
    null
  );
}

export type Speaker = ReturnType<typeof createSpeaker>;

/**
 * Speaks a list of sentences in order. Pause cancels and remembers the sentence,
 * resume re-speaks it: more reliable across browsers than speechSynthesis.pause().
 */
export function createSpeaker(handlers: {
  onSentence: (index: number) => void;
  onEnd: () => void;
}) {
  let sentences: string[] = [];
  let lang = "en-US";
  let voice: SpeechSynthesisVoice | null = null;
  let index = 0;
  let run = 0;
  let onDone: (() => void) | undefined;

  function speakFrom(i: number) {
    const synth = window.speechSynthesis;
    const token = ++run;
    synth.cancel();
    index = i;
    const next = () => {
      if (token !== run) return;
      if (index >= sentences.length) {
        handlers.onEnd();
        onDone?.();
        return;
      }
      handlers.onSentence(index);
      const u = new SpeechSynthesisUtterance(sentences[index]);
      u.lang = lang;
      if (voice) u.voice = voice;
      u.onend = () => {
        if (token !== run) return;
        index += 1;
        next();
      };
      u.onerror = (e) => {
        if (token !== run || e.error === "interrupted" || e.error === "canceled") return;
        index += 1;
        next();
      };
      synth.speak(u);
    };
    next();
  }

  return {
    /** `done` runs only if this playback reaches the end (not on pause/stop). */
    play(
      text: string[],
      speechLang: string,
      v: SpeechSynthesisVoice | null,
      startAt = 0,
      done?: () => void
    ) {
      sentences = text;
      lang = speechLang;
      voice = v;
      onDone = done;
      speakFrom(startAt);
    },
    pause() {
      run++;
      window.speechSynthesis.cancel();
    },
    resume() {
      speakFrom(index);
    },
    stop() {
      run++;
      index = 0;
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    },
    get index() {
      return index;
    },
  };
}

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

function recognitionCtor() {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Chrome/Edge/Safari only; Firefox has no speech recognition. */
export function hasSpeechRecognition() {
  return recognitionCtor() !== null;
}

/** `interim` streams partial transcripts for a live caption while the user speaks. */
export function createRecognition(lang: string, interim = false): RecognitionLike | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = lang;
  r.continuous = false;
  r.interimResults = interim;
  r.maxAlternatives = 1;
  return r;
}
