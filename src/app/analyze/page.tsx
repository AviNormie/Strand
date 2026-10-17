/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { BrandLogoCarousel } from "@/components/BrandLogoCarousel";
import { getOptionalUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const geist = { fontFamily: "var(--font-geist-sans)" };

export default async function AnalyzePage() {
  const user = await getOptionalUser();
  const company = user
    ? await prisma.company.findUnique({ where: { userId: user.id } })
    : null;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader user={user} tone="paper" />
      <main>
        <section className="overflow-hidden px-4 pb-6 pt-28 text-center sm:px-6 md:pt-32">
          <span className="inline-flex items-center rounded-full border-2 border-ink bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
            AI Visibility Platform
          </span>
          <h1 className="font-display mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-[3.35rem]">
            Optimize {company?.name || "your brand"}&apos;s{" "}
            <span className="relative inline-block">
              AI visibility
              <svg
                className="absolute -bottom-1 left-0 h-3 w-full"
                viewBox="0 0 160 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8 C 35 2, 70 10, 100 5 C 125 2, 145 9, 158 6"
                  fill="none"
                  stroke="#FFD85A"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            today
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg"
            style={geist}
          >
            Choose the prompts and topics that matter most, track your mentions
            over time, and take actions to boost your visibility.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href={user ? "#analyze" : "/login?next=/analyze"}
              className="sticker-btn-fill !px-5 !py-3 !text-sm uppercase tracking-wide"
            >
              <span>{user ? "New analysis" : "Log in to start"}</span>
              <span className="sticker-arrow" aria-hidden="true">
                →
              </span>
            </a>
            {user ? (
              <Link href="/dashboard" className="sticker-btn !px-5 !py-3 !text-sm">
                <span>View history</span>
              </Link>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-55" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
              </span>
              Live
            </span>
            <p className="text-sm text-ink/60" style={geist}>
              Tracking ChatGPT · Claude · Gemini · Groq
            </p>
          </div>
          <BrandLogoCarousel />
        </section>

        <section id="analyze" className="relative scroll-mt-24 px-4 pb-24 pt-10 sm:px-6">
          <div className="relative mx-auto max-w-xl">
            <img
              src="/assets/searching.svg"
              alt=""
              className="pointer-events-none absolute -left-80 -top-6 hidden w-80 select-none object-contain lg:block"
              draggable={false}
            />
            <div className="cartoon-card p-6 sm:p-8">
              <div className="mb-6 text-center">
                <h2 className="font-display text-3xl font-bold text-ink">
                  Start an analysis
                </h2>
                <p className="mt-2 text-sm text-ink/65" style={geist}>
                  We query ChatGPT, Gemini, Claude, and Groq with live web
                  search, then score how often your brand is mentioned and
                  recommended.
                </p>
              </div>
              <AnalyzeForm
                company={
                  company
                    ? {
                        name: company.name,
                        website: company.website,
                        description: company.description,
                        competitors: company.competitors,
                      }
                    : null
                }
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
