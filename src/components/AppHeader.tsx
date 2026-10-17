import Link from "next/link";
import type { AuthUser } from "@/lib/auth";

export function AppHeader({
  user,
  tone = "dark",
}: {
  user: AuthUser | null;
  tone?: "dark" | "paper";
}) {
  if (tone === "paper") return <PaperHeader user={user} />;
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-white"
          >
            Strand
          </Link>
          {user ? (
            <nav className="flex gap-4 text-sm text-zinc-400">
              <Link href="/analyze" className="hover:text-white">
                New analysis
              </Link>
              <Link href="/dashboard" className="hover:text-white">
                History
              </Link>
            </nav>
          ) : null}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <span className="hidden text-sm text-zinc-400 sm:inline">
              {user.name || user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}

function PaperHeader({ user }: { user: AuthUser | null }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full border-2 border-ink/10 bg-paper/90 px-3 py-2 shadow-[3px_3px_0_0_rgba(17,17,17,0.08)] backdrop-blur-md sm:gap-4 sm:px-5 sm:py-2.5"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        <Link
          href="/"
          className="relative block h-11 w-28 shrink-0 overflow-hidden sm:h-12 sm:w-36"
          aria-label="Strand home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/strandlogo.svg"
            alt="Strand"
            className="absolute left-1/2 top-1/2 h-[340%] w-auto max-w-none -translate-x-1/2 -translate-y-[48%] select-none object-contain"
            draggable={false}
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm text-ink/75 transition-colors hover:text-ink sm:inline"
              >
                History
              </Link>
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-ink"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="cartoon-btn px-3 py-1.5 text-xs uppercase tracking-wider"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login?next=/analyze"
              className="sticker-btn !gap-1.5 !border-ink !bg-ink !px-4 !py-1.5 !text-sm !text-paper"
            >
              <span>Log in</span>
              <span
                className="sticker-arrow !h-5 !w-5 !bg-paper !text-[10px] !text-ink"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
