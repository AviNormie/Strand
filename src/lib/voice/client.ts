import { getVoiceLanguage, type VoiceLanguageCode } from "./languages";

/** Shared by the voice briefing panel and the tutor so both remember one language choice. */
export const VOICE_LANG_KEY = "strand.voiceLanguage";

export function readStoredLanguage(): VoiceLanguageCode {
  try {
    return getVoiceLanguage(localStorage.getItem(VOICE_LANG_KEY) ?? "en").code;
  } catch {
    return "en";
  }
}

export function storeLanguage(code: VoiceLanguageCode) {
  try {
    localStorage.setItem(VOICE_LANG_KEY, code);
  } catch {
    // Preference just won't persist.
  }
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const wait = res.headers.get("Retry-After");
    throw new Error(
      `${data.error || `Request failed (${res.status})`}${wait ? ` Retry in ~${wait}s.` : ""}`
    );
  }
  return data as T;
}
