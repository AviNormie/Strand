/**
 * Languages offered by the voice agent. `speech` is the BCP-47 tag handed to the browser voice;
 * `script` (non-Latin languages only) is used to verify replies are actually written in that script.
 */
export const VOICE_LANGUAGES = [
  { code: "en", label: "English", speech: "en-US", prompt: "English" },
  { code: "hi", label: "हिन्दी (Hindi)", speech: "hi-IN", prompt: "Hindi, in Devanagari script", script: /[\u0900-\u097F]/ },
  {
    code: "hinglish",
    label: "Hinglish",
    // Romanized Hindi reads better through an Indian-English voice than a Hindi one.
    speech: "en-IN",
    prompt:
      "Hinglish: conversational Hindi mixed with English, written in Latin (Roman) script, the way people in India text",
  },
  { code: "bn", label: "বাংলা (Bengali)", speech: "bn-IN", prompt: "Bengali, in Bengali script", script: /[\u0980-\u09FF]/ },
  { code: "ta", label: "தமிழ் (Tamil)", speech: "ta-IN", prompt: "Tamil, in Tamil script", script: /[\u0B80-\u0BFF]/ },
  { code: "te", label: "తెలుగు (Telugu)", speech: "te-IN", prompt: "Telugu, in Telugu script", script: /[\u0C00-\u0C7F]/ },
  { code: "mr", label: "मराठी (Marathi)", speech: "mr-IN", prompt: "Marathi, in Devanagari script", script: /[\u0900-\u097F]/ },
  { code: "gu", label: "ગુજરાતી (Gujarati)", speech: "gu-IN", prompt: "Gujarati, in Gujarati script", script: /[\u0A80-\u0AFF]/ },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)", speech: "kn-IN", prompt: "Kannada, in Kannada script", script: /[\u0C80-\u0CFF]/ },
  { code: "es", label: "Español", speech: "es-ES", prompt: "Spanish" },
  { code: "fr", label: "Français", speech: "fr-FR", prompt: "French" },
  { code: "de", label: "Deutsch", speech: "de-DE", prompt: "German" },
  { code: "pt", label: "Português", speech: "pt-BR", prompt: "Brazilian Portuguese" },
  { code: "it", label: "Italiano", speech: "it-IT", prompt: "Italian" },
  { code: "ja", label: "日本語", speech: "ja-JP", prompt: "Japanese", script: /[\u3040-\u30FF\u4E00-\u9FFF]/ },
  { code: "ar", label: "العربية", speech: "ar-SA", prompt: "Modern Standard Arabic", script: /[\u0600-\u06FF]/ },
] as const;

export type VoiceLanguageCode = (typeof VOICE_LANGUAGES)[number]["code"];
export type VoiceLanguage = (typeof VOICE_LANGUAGES)[number] & { script?: RegExp };

export const VOICE_LANGUAGE_CODES = VOICE_LANGUAGES.map((l) => l.code) as [
  VoiceLanguageCode,
  ...VoiceLanguageCode[],
];

export function getVoiceLanguage(code: string): VoiceLanguage {
  return VOICE_LANGUAGES.find((l) => l.code === code) ?? VOICE_LANGUAGES[0];
}

/** False when a non-Latin language reply came back romanized. */
export function isInLanguageScript(text: string, code: string): boolean {
  const { script } = getVoiceLanguage(code);
  return !script || script.test(text);
}
