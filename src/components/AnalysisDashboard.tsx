"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AiProviderStrip } from "@/components/AiProviderStrip";
import { BrandLogo } from "@/components/BrandLogo";
import { ContentSuggestions } from "@/components/ContentSuggestions";
import {
  InsightMetricCard,
  scoreTone,
  type MetricTone,
} from "@/components/InsightMetricCard";
import { MarkdownReport } from "@/components/MarkdownReport";
import { ReportRankingHero } from "@/components/ReportRankingHero";
import { VoiceSummaryButton } from "@/components/VoiceSummaryButton";
import {
  parseRecommendationContent,
  type ContentSuggestion,
} from "@/lib/services/recommendation.service";

type StatusPayload = {
  status: string;
  progress: number;
  progressMessage: string | null;
  error: string | null;
  warnings: unknown;
  companyName: string;
  dbHost?: string;
  polledAt?: string;
};

type ResultsPayload = {
  id: string;
  companyName: string;
  website?: string | null;
  competitors: string[];
  brandLogos?: Record<string, string>;
  brandDomains?: Record<string, string>;
  providers?: string[];
  status: string;
  progress: number;
  progressMessage: string | null;
  error: string | null;
  warnings: string[];
  metrics: {
    visibilityScore: number;
    mentionRate: number;
    shareOfVoice: number;
    citationRate: number;
    recommendationRate: number;
    avgRanking: number | null;
    positiveSentimentRate: number | null;
    competitorShare: Record<string, number>;
  } | null;
  recommendation: { content: string } | null;
  prompts: Array<{
    id: string;
    category: string;
    prompt: string;
    responses: Array<{
      id: string;
      provider: string;
      model: string;
      rawResponse: string | null;
      latencyMs: number | null;
      error: string | null;
      extracted: {
        mentionedBrands: string[];
        ranking: number | null;
        sentiment: string | null;
        reasoning: string | null;
      } | null;
    }>;
  }>;
};

export function AnalysisDashboard({
  jobId,
  mode = "private",
}: {
  jobId: string;
  mode?: "private" | "public";
}) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const reportPath = `/report/${jobId}`;
  const isPublic = mode === "public";

  const loadStatus = useCallback(async () => {
    if (isPublic) return null;
    const res = await fetch(
      `/api/analysis/status/${jobId}?t=${Date.now()}`,
      {
        cache: "no-store",
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body.error
          ? `${body.error}${body.dbHost ? ` (db: ${body.dbHost})` : ""}`
          : `Failed to load status (${res.status})`
      );
    }
    return (await res.json()) as StatusPayload;
  }, [jobId, isPublic]);

  const loadResults = useCallback(async () => {
    const url = isPublic
      ? `/api/public/report/${jobId}?t=${Date.now()}`
      : `/api/analysis/results/${jobId}?t=${Date.now()}`;
    const res = await fetch(url, {
      cache: "no-store",
      credentials: isPublic ? "omit" : "include",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) {
      throw new Error("Failed to load results");
    }
    return (await res.json()) as ResultsPayload;
  }, [jobId, isPublic]);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setPollCount(0);
    setFetchError(null);
    // The useEffect will automatically restart polling
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        if (isPublic) {
          const r = await loadResults();
          if (!cancelled) {
            setResults(r);
            setStatus({
              status: r.status,
              progress: r.progress,
              progressMessage: r.progressMessage,
              error: r.error,
              warnings: r.warnings,
              companyName: r.companyName,
            });
            setFetchError(null);
          }
          return;
        }

        const s = await loadStatus();
        if (cancelled || !s) return;
        setStatus(s);
        setPollCount((n) => n + 1);
        setFetchError(null);
        setIsRetrying(false);

        if (s.status === "COMPLETED" || s.status === "FAILED") {
          const r = await loadResults();
          if (!cancelled) setResults(r);
          return;
        }

        timer = setTimeout(tick, 2000);
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Error");
          if (!isPublic) timer = setTimeout(tick, 4000);
        }
      }
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loadStatus, loadResults, isPublic, isRetrying]);

  const progress = status?.progress ?? 0;
  const jobStatus = status?.status || results?.status || "…";
  const isDone = jobStatus === "COMPLETED";
  const isFailed = jobStatus === "FAILED";
  const isQueued = jobStatus === "QUEUED";
  const isProcessing = jobStatus === "PROCESSING";
  const brand = results?.companyName || status?.companyName || "…";

  const parsedRec = useMemo(() => {
    if (!results?.recommendation?.content) {
      return { markdown: "", contentSuggestions: [] as ContentSuggestion[] };
    }
    return parseRecommendationContent(results.recommendation.content);
  }, [results?.recommendation?.content]);

  const insightCards = useMemo(() => {
    const m = results?.metrics;
    if (!m) return [];
    const positive = m.positiveSentimentRate;
    return [
      {
        title: "Visibility Score",
        description: `${brand} is mentioned in ${fmt(m.mentionRate)}% of responses in your category.`,
        value: `${fmt(m.visibilityScore)}`,
        tone: scoreTone(m.visibilityScore) as MetricTone,
      },
      {
        title: "Positive Sentiment",
        description:
          positive == null
            ? "Positive sentiment could not be measured for this run."
            : `When ${brand} is mentioned, the sentiment is positive ${fmt(positive)}% of the time.`,
        value: positive == null ? "N/A" : `${fmt(positive)}%`,
        tone:
          positive == null
            ? ("na" as MetricTone)
            : (scoreTone(positive) as MetricTone),
      },
      {
        title: "Citation Share",
        description: `${brand} is cited in ${fmt(m.citationRate)}% of responses in your category.`,
        value: `${fmt(m.citationRate)}%`,
        tone: scoreTone(m.citationRate) as MetricTone,
      },
      {
        title: "Recommendation Rate",
        description: `Assistants recommend ${brand} in ${fmt(m.recommendationRate)}% of tracked answers.`,
        value: `${fmt(m.recommendationRate)}%`,
        tone: scoreTone(m.recommendationRate) as MetricTone,
      },
    ];
  }, [results?.metrics, brand]);

  const voiceSummary = useMemo(() => {
    const m = results?.metrics;
    if (!m) return "";
    const rivals = Object.entries(m.competitorShare || {})
      .filter(([k]) => !k.startsWith("__") && k !== brand)
      .sort((a, b) => b[1] - a[1]);
    const parts = [
      `Here is the AI visibility summary for ${brand}.`,
      `${brand} has a visibility score of ${fmt(m.visibilityScore)} and appears in ${fmt(m.mentionRate)} percent of AI answers.`,
      `Its share of voice is ${fmt(m.shareOfVoice)} percent, and assistants recommend it in ${fmt(m.recommendationRate)} percent of answers.`,
    ];
    if (m.avgRanking != null) parts.push(`Its average ranking is ${fmt(m.avgRanking)}.`);
    if (m.positiveSentimentRate != null)
      parts.push(`Sentiment is positive ${fmt(m.positiveSentimentRate)} percent of the time.`);
    if (rivals.length)
      parts.push(`The leading competitor is ${rivals[0][0]}, with ${fmt(rivals[0][1] * 100)} percent share of voice.`);
    if (parsedRec.contentSuggestions.length)
      parts.push(`The report includes ${parsedRec.contentSuggestions.length} content suggestions to improve your visibility.`);
    return parts.join(" ");
  }, [results?.metrics, brand, parsedRec.contentSuggestions.length]);

  const rankingRows = useMemo(() => {
    const share = results?.metrics?.competitorShare || {};
    const logos = results?.brandLogos || {};
    const domains = results?.brandDomains || {};
    const names = new Set<string>([
      brand,
      ...(results?.competitors || []),
      ...Object.keys(share).filter((k) => !k.startsWith("__")),
    ]);
    return [...names].map((name) => ({
      name,
      share: share[name] ?? (name === brand ? (results?.metrics?.shareOfVoice || 0) / 100 : 0),
      isYou: name === brand,
      logoUrl: logos[name],
      domain: domains[name],
      website: name === brand ? results?.website : null,
    }));
  }, [results, brand]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-5xl space-y-10 px-4 pb-24 pt-28 sm:px-6 md:pt-32">
        <header>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full border-2 border-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                AI Visibility Report
              </span>
              <div className="mt-4 flex items-center gap-3">
                <BrandLogo
                  name={brand}
                  website={results?.website}
                  domain={results?.brandDomains?.[brand]}
                  logoUrl={results?.brandLogos?.[brand]}
                  size={40}
                />
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  {brand}
                </h1>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65">
                {isPublic
                  ? "Shared AEO report — no login required."
                  : status?.progressMessage ||
                    "Querying answer engines and analyzing the responses."}
                {!isPublic && (
                  <>
                    {" "}
                    <span
                      className={`ml-1 inline-flex rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                        isProcessing
                          ? "bg-accent-green"
                          : isFailed
                            ? "bg-red-300"
                            : isDone
                              ? "bg-white"
                              : "bg-accent-yellow"
                      }`}
                    >
                      {jobStatus}
                    </span>
                  </>
                )}
              </p>
            </div>
            {isDone && voiceSummary && <VoiceSummaryButton text={voiceSummary} />}
          </div>

          {(results?.providers?.length || isDone) && (
            <AiProviderStrip
              providers={results?.providers}
              className="mt-6"
            />
          )}

          {results?.competitors?.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-hand text-lg">Tracked competitors</span>
              {results.competitors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 py-1 text-xs font-medium"
                >
                  <BrandLogo
                    name={c}
                    domain={results.brandDomains?.[c]}
                    logoUrl={results.brandLogos?.[c]}
                    size={16}
                  />
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {!isPublic && !isDone && !isFailed && (
          <div className="cartoon-card space-y-3 p-5 sm:p-6">
            <div className="flex justify-between">
              <span className="font-hand text-xl">Progress</span>
              <span className="font-display text-xl font-bold tabular-nums">
                {progress}%
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
              <div
                className="h-full bg-accent-yellow transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            {isQueued && pollCount >= 10 && (
              <div className="mt-3 space-y-3 rounded-2xl border-2 border-ink bg-accent-yellow/40 p-4">
                <p className="text-sm">
                  Analysis is taking longer than expected. The worker may be processing other jobs or starting up.
                </p>
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="cartoon-btn px-4 py-1.5 text-sm disabled:opacity-50"
                >
                  {isRetrying ? "Checking..." : "Check Status Again"}
                </button>
              </div>
            )}
          </div>
        )}

        {fetchError && (
          <p className="rounded-2xl border-2 border-ink bg-accent-yellow/40 px-4 py-3 text-sm">
            {isPublic ? "Could not load report: " : "Status poll error: "}
            {fetchError}
          </p>
        )}

        {isFailed && (
          <p className="rounded-2xl border-2 border-ink bg-red-100 px-4 py-3 text-sm text-red-900">
            {status?.error || "Analysis failed"}
          </p>
        )}

        {isDone && results?.metrics && (
          <>
            <ReportRankingHero
              companyName={brand}
              website={results.website}
              logoUrl={results.brandLogos?.[brand]}
              brandDomain={results.brandDomains?.[brand]}
              rows={rankingRows}
              reportPath={reportPath}
              showCta={isPublic}
            />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {insightCards.map((card) => (
                <InsightMetricCard key={card.title} {...card} />
              ))}
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <MiniStat
                label="Share of voice"
                value={`${fmt(results.metrics.shareOfVoice)}%`}
              />
              <MiniStat
                label="Mention rate"
                value={`${fmt(results.metrics.mentionRate)}%`}
              />
              <MiniStat
                label="Avg ranking"
                value={
                  results.metrics.avgRanking == null
                    ? "—"
                    : fmt(results.metrics.avgRanking)
                }
              />
            </section>

            <section className="cartoon-card p-5 sm:p-8">
              <h2 className="font-display text-2xl font-bold">
                Competitor share of voice
              </h2>
              <div className="mt-5 space-y-3">
                {Object.entries(results.metrics.competitorShare || {})
                  .filter(([k]) => !k.startsWith("__"))
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, share]) => (
                    <div key={name} className="flex items-center gap-3 text-sm">
                      <BrandLogo
                        name={name}
                        domain={results.brandDomains?.[name]}
                        logoUrl={results.brandLogos?.[name]}
                        website={name === brand ? results.website : null}
                        size={24}
                      />
                      <span
                        className={`w-36 truncate ${name === brand ? "font-semibold" : "text-ink/80"}`}
                      >
                        {name}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
                        <div
                          className={`h-full ${name === brand ? "bg-accent-yellow" : "bg-accent-blue"}`}
                          style={{ width: `${Math.min(100, share * 100)}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-medium tabular-nums">
                        {(share * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </section>

            {parsedRec.contentSuggestions.length > 0 && (
              <ContentSuggestions suggestions={parsedRec.contentSuggestions} />
            )}

            {parsedRec.markdown && (
              <section className="cartoon-card p-5 sm:p-8">
                <h2 className="font-display mb-6 text-3xl font-bold tracking-tight">
                  Strategic recommendations
                </h2>
                <MarkdownReport content={parsedRec.markdown} />
              </section>
            )}

            {Array.isArray(results.warnings) && results.warnings.length > 0 && (
              <p className="text-sm text-ink/60">
                Warnings: {results.warnings.join("; ")}
              </p>
            )}

            {!isPublic && (
              <section>
                <h2 className="font-display text-2xl font-bold">
                  Prompt results
                </h2>
                <div className="mt-4 space-y-3">
                  {results.prompts.map((p) => (
                    <details
                      key={p.id}
                      className="overflow-hidden rounded-2xl border-2 border-ink bg-white/60 open:bg-white open:shadow-[3px_3px_0_0_#111]"
                    >
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                        <span className="mr-2 rounded-full border-2 border-ink bg-accent-yellow px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          {p.category}
                        </span>
                        {p.prompt}
                      </summary>
                      <div className="space-y-4 border-t-2 border-ink px-4 py-4">
                        {p.responses.map((r) => (
                          <div key={r.id} className="text-sm">
                            <div className="flex flex-wrap items-center gap-2 font-semibold">
                              <span className="capitalize">{r.provider}</span>
                              <span className="text-xs font-normal text-ink/50">
                                {r.model}
                                {r.latencyMs != null
                                  ? ` · ${r.latencyMs}ms`
                                  : ""}
                              </span>
                              {r.extracted?.sentiment && (
                                <span className="rounded-full border border-ink bg-accent-green/60 px-2 py-0.5 text-xs font-medium">
                                  {r.extracted.sentiment}
                                </span>
                              )}
                              {r.extracted?.ranking != null && (
                                <span className="text-xs font-normal text-ink/50">
                                  Rank #{r.extracted.ranking}
                                </span>
                              )}
                            </div>
                            {r.error ? (
                              <p className="mt-1 text-red-700">{r.error}</p>
                            ) : (
                              <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-ink/70">
                                {r.rawResponse}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cartoon-card px-5 py-4">
      <p className="font-hand text-lg text-ink/70">{label}</p>
      <p className="font-display mt-1 text-3xl font-bold tabular-nums">
        {value}
      </p>
    </div>
  );
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
