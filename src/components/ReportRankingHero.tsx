"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { CopyReportLink } from "@/components/CopyReportLink";

export type RankRow = {
  name: string;
  share: number; // 0-1 or 0-100 — we normalize
  isYou?: boolean;
  logoUrl?: string | null;
  domain?: string | null;
  website?: string | null;
};

function asPercent(share: number) {
  const pct = share <= 1 ? share * 100 : share;
  return pct;
}

export function ReportRankingHero({
  companyName,
  website,
  logoUrl,
  brandDomain,
  rows,
  reportPath,
  showCta = true,
}: {
  companyName: string;
  website?: string | null;
  logoUrl?: string | null;
  brandDomain?: string | null;
  rows: RankRow[];
  reportPath: string;
  showCta?: boolean;
}) {
  const ranked = [...rows]
    .map((r) => ({ ...r, pct: asPercent(r.share) }))
    .sort((a, b) => b.pct - a.pct);

  const yourIndex = ranked.findIndex((r) => r.isYou);
  const yourRank = yourIndex >= 0 ? yourIndex + 1 : ranked.length || 1;
  const top = ranked.slice(0, 8);
  const you =
    yourIndex >= 0
      ? ranked[yourIndex]
      : {
          name: companyName,
          pct: 0,
          isYou: true,
          logoUrl,
          domain: brandDomain,
          website,
        };

  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <section className="cartoon-card grid gap-10 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-10 lg:py-10">
      <div className="flex flex-col justify-center">
        <div className="font-hand mb-4 flex items-center gap-2 text-lg">
          <BrandLogo
            name={companyName}
            website={website}
            domain={brandDomain}
            logoUrl={logoUrl}
            size={22}
          />
          <span>
            {companyName} AEO Report
          </span>
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          You rank {ordinal(yourRank)} in AI Visibility
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65">
          Read your AEO report below to understand and improve your brand&apos;s
          AI presence.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {showCta && (
            <a href="/analyze" className="sticker-btn-fill !px-5 !py-2.5 !text-sm">
              <span>Try Strand for free</span>
              <span className="sticker-arrow" aria-hidden="true">
                →
              </span>
            </a>
          )}
          <CopyReportLink reportPath={reportPath} />
        </div>
      </div>

      <div className="space-y-1">
        {top.map((r, i) => {
          const isYou = r.isYou || r.name === companyName;
          return (
            <div
              key={`${r.name}-${i}`}
              className={`flex items-center gap-3 px-1 py-2.5 text-sm ${
                isYou ? "rounded-2xl border-2 border-ink bg-accent-yellow/40 px-3 shadow-[2px_2px_0_0_#111]" : ""
              }`}
            >
              <span className="w-5 font-semibold tabular-nums text-ink/50">{i + 1}</span>
              <BrandLogo
                name={r.name}
                domain={r.domain}
                website={r.website}
                logoUrl={r.logoUrl}
                size={28}
              />
              <span className="min-w-0 flex-1 truncate">
                {r.name}
                {isYou && (
                  <span className="ml-2 inline-flex rounded-full border-2 border-ink bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    Your brand
                  </span>
                )}
              </span>
              <span className="font-semibold tabular-nums">
                {r.pct.toFixed(1)}%
              </span>
                          </div>
          );
        })}

        {yourIndex >= 8 || yourIndex === -1 ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-ink bg-accent-yellow/40 px-3 py-3 text-sm shadow-[2px_2px_0_0_#111]">
            <span className="w-5 font-semibold tabular-nums text-ink/60">{yourRank}</span>
            <BrandLogo
              name={you.name}
              domain={you.domain}
              website={you.website}
              logoUrl={you.logoUrl}
              size={28}
            />
            <span className="min-w-0 flex-1 truncate font-semibold">
              {you.name}
              <span className="ml-2 inline-flex rounded-full border-2 border-ink bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Your brand
              </span>
            </span>
            <span className="font-semibold tabular-nums">
              {you.pct.toFixed(1)}%
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
