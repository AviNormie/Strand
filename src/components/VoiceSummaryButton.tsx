"use client";

import { useEffect, useState } from "react";

// Reads the report summary aloud with the browser's built-in speech synthesis.
// Only mounted after results load client-side, so reading `window` here is safe.
export function VoiceSummaryButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className={`cartoon-btn gap-2 px-4 py-2 text-sm ${speaking ? "bg-accent-yellow" : ""}`}
    >
      {speaking ? "Stop voice" : "Voice summary"}
    </button>
  );
}
