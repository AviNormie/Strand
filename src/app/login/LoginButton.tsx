"use client";

import { createClient } from "@/lib/supabase/client";

export function LoginButton() {
  async function signInWithGoogle() {
    const supabase = createClient();
    const origin = window.location.origin;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/analyze";

    // Preserve post-login destination without putting query params on redirectTo
    // (Supabase redirect URLs must match the allow list exactly).
    document.cookie = `auth_next=${encodeURIComponent(next)}; path=/; max-age=600; samesite=lax`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="cartoon-card w-full max-w-md p-8 text-center sm:p-10">
        <p className="inline-flex items-center rounded-full border-2 border-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
          Strand
        </p>
        <h1 className="font-display mt-4 text-4xl font-bold tracking-tight">
          AI Visibility
        </h1>
        <p className="mt-3 text-ink/65">
          See how often AI assistants recommend your brand — and how to improve.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="sticker-btn-fill mt-8 w-full justify-center !gap-3 !py-3 !text-sm"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l.1.1 6.3 5.3C39.2 37.3 44 32 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
