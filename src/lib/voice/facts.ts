import type { SerializedReport } from "@/lib/report-serialize";
import { brandMatches } from "@/lib/services/metrics.service";
import { parseRecommendationContent } from "@/lib/services/recommendation.service";

/**
 * Everything the voice agent is allowed to talk about, computed deterministically
 * from stored reports. Claude only ever sees this object, so every insight it
 * voices has to trace back to a field here.
 */
export type ReportFacts = {
  brand: string;
  reportDate: string;
  previousReportDate: string | null;
  providers: string[];
  metrics: MetricSet;
  /** Current minus previous, in percentage points (avgRanking in positions). Null without a previous report. */
  changes: Partial<MetricSet> | null;
  competitors: Array<{
    name: string;
    shareOfVoice: number;
    previousShareOfVoice: number | null;
    change: number | null;
  }>;
  /** Brands AI answers named this time that no answer named in the previous report. */
  newlyMentionedBrands: Array<{ name: string; mentions: number }>;
  /** Brands named in the previous report that no answer named this time. */
  droppedBrands: string[];
  citations: {
    topSources: Array<{ source: string; count: number }>;
    /** Sources cited in answers that mention the brand. */
    brandSources: string[];
    gainedSources: string[];
    lostSources: string[];
  };
  categories: Array<{
    category: string;
    prompts: number;
    brandMentionRate: number;
    avgRanking: number | null;
  }>;
  strongestPrompts: Array<{ prompt: string; category: string; brandMentionRate: number }>;
  /** Prompts where the brand never appeared but competitors did. */
  gapPrompts: Array<{ prompt: string; category: string; competitorsMentioned: string[] }>;
  contentSuggestions: Array<{ type: string; title: string }>;
  recommendationExcerpt: string;
};

type MetricSet = {
  visibilityScore: number;
  mentionRate: number;
  shareOfVoice: number;
  citationRate: number;
  recommendationRate: number;
  avgRanking: number | null;
  positiveSentimentRate: number | null;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

function metricSet(report: SerializedReport): MetricSet | null {
  const m = report.metrics;
  if (!m) return null;
  return {
    visibilityScore: r1(m.visibilityScore),
    mentionRate: r1(m.mentionRate),
    shareOfVoice: r1(m.shareOfVoice),
    citationRate: r1(m.citationRate),
    recommendationRate: r1(m.recommendationRate),
    avgRanking: m.avgRanking == null ? null : r1(m.avgRanking),
    positiveSentimentRate:
      m.positiveSentimentRate == null ? null : r1(m.positiveSentimentRate),
  };
}

function diff(a: number | null, b: number | null) {
  return a == null || b == null ? null : r1(a - b);
}

type Extracted = {
  mentionedBrands?: unknown;
  citations?: unknown;
  ranking?: number | null;
};

function extractions(report: SerializedReport) {
  return report.prompts.flatMap((p) =>
    p.responses
      .filter((r) => r.extracted)
      .map((r) => ({ prompt: p, extracted: r.extracted as Extracted }))
  );
}

const asStrings = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];

function sourceKey(raw: string) {
  const s = raw.trim();
  try {
    return new URL(s.startsWith("http") ? s : `https://${s}`).hostname.replace(/^www\./, "");
  } catch {
    return s.toLowerCase();
  }
}

function countBrands(report: SerializedReport) {
  const counts = new Map<string, { name: string; mentions: number }>();
  for (const { extracted } of extractions(report)) {
    for (const b of new Set(asStrings(extracted.mentionedBrands))) {
      const key = b.toLowerCase().trim();
      const entry = counts.get(key) ?? { name: b.trim(), mentions: 0 };
      entry.mentions += 1;
      counts.set(key, entry);
    }
  }
  return counts;
}

function countSources(report: SerializedReport) {
  const counts = new Map<string, number>();
  const brandSources = new Set<string>();
  for (const { extracted } of extractions(report)) {
    const brandHit = brandMatches(report.companyName, asStrings(extracted.mentionedBrands));
    for (const c of asStrings(extracted.citations)) {
      const key = sourceKey(c);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (brandHit) brandSources.add(key);
    }
  }
  return { counts, brandSources };
}

function promptStats(report: SerializedReport) {
  const brand = report.companyName;
  return report.prompts.map((p) => {
    const rows = p.responses.filter((r) => r.extracted).map((r) => r.extracted as Extracted);
    const hits = rows.filter((e) => brandMatches(brand, asStrings(e.mentionedBrands)));
    const ranks = hits
      .map((e) => e.ranking)
      .filter((n): n is number => typeof n === "number" && n > 0);
    const competitorsMentioned = report.competitors.filter((c) =>
      rows.some((e) => brandMatches(c, asStrings(e.mentionedBrands)))
    );
    return {
      prompt: p.prompt,
      category: p.category,
      responses: rows.length,
      hits: hits.length,
      ranks,
      competitorsMentioned,
    };
  });
}

const shareOf = (report: SerializedReport | null, name: string) => {
  const share = report?.metrics?.competitorShare?.[name];
  return typeof share === "number" ? r1(share * 100) : null;
};

export function buildReportFacts(
  current: SerializedReport,
  previous: SerializedReport | null
): ReportFacts {
  const metrics = metricSet(current);
  if (!metrics) throw new Error("Report has no metrics yet");
  const prevMetrics = previous ? metricSet(previous) : null;
  const brand = current.companyName;

  const changes = prevMetrics
    ? {
        visibilityScore: diff(metrics.visibilityScore, prevMetrics.visibilityScore) ?? undefined,
        mentionRate: diff(metrics.mentionRate, prevMetrics.mentionRate) ?? undefined,
        shareOfVoice: diff(metrics.shareOfVoice, prevMetrics.shareOfVoice) ?? undefined,
        citationRate: diff(metrics.citationRate, prevMetrics.citationRate) ?? undefined,
        recommendationRate:
          diff(metrics.recommendationRate, prevMetrics.recommendationRate) ?? undefined,
        avgRanking: diff(metrics.avgRanking, prevMetrics.avgRanking),
        positiveSentimentRate: diff(
          metrics.positiveSentimentRate,
          prevMetrics.positiveSentimentRate
        ),
      }
    : null;

  const competitorNames = [
    ...new Set([
      ...current.competitors,
      ...Object.keys(current.metrics?.competitorShare ?? {}),
    ]),
  ].filter((n) => n !== brand && !n.startsWith("__"));
  const competitors = competitorNames
    .map((name) => {
      const shareOfVoice = shareOf(current, name) ?? 0;
      const previousShareOfVoice = previous ? shareOf(previous, name) : null;
      return {
        name,
        shareOfVoice,
        previousShareOfVoice,
        change: diff(shareOfVoice, previousShareOfVoice),
      };
    })
    .sort((a, b) => b.shareOfVoice - a.shareOfVoice);

  const brandsNow = countBrands(current);
  const brandsBefore = previous ? countBrands(previous) : null;
  const isOwnBrand = (name: string) => brandMatches(brand, [name]);
  const newlyMentionedBrands = brandsBefore
    ? [...brandsNow.entries()]
        .filter(([key, v]) => !brandsBefore.has(key) && !isOwnBrand(v.name))
        .map(([, v]) => v)
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 8)
    : [];
  const droppedBrands = brandsBefore
    ? [...brandsBefore.entries()]
        .filter(([key, v]) => !brandsNow.has(key) && !isOwnBrand(v.name))
        .sort((a, b) => b[1].mentions - a[1].mentions)
        .slice(0, 8)
        .map(([, v]) => v.name)
    : [];

  const sourcesNow = countSources(current);
  const sourcesBefore = previous ? countSources(previous).counts : null;
  const topSources = [...sourcesNow.counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }));

  const stats = promptStats(current);
  const categoryMap = new Map<string, typeof stats>();
  for (const s of stats) categoryMap.set(s.category, [...(categoryMap.get(s.category) ?? []), s]);
  const rate = (hits: number, total: number) => (total > 0 ? r1((hits / total) * 100) : 0);
  const categories = [...categoryMap.entries()]
    .map(([category, rows]) => {
      const ranks = rows.flatMap((r) => r.ranks);
      return {
        category,
        prompts: rows.length,
        brandMentionRate: rate(
          rows.reduce((n, r) => n + r.hits, 0),
          rows.reduce((n, r) => n + r.responses, 0)
        ),
        avgRanking: ranks.length ? r1(ranks.reduce((a, b) => a + b, 0) / ranks.length) : null,
      };
    })
    .sort((a, b) => b.brandMentionRate - a.brandMentionRate);

  const strongestPrompts = stats
    .filter((s) => s.hits > 0)
    .map((s) => ({
      prompt: s.prompt,
      category: s.category,
      brandMentionRate: rate(s.hits, s.responses),
    }))
    .sort((a, b) => b.brandMentionRate - a.brandMentionRate)
    .slice(0, 3);
  const gapPrompts = stats
    .filter((s) => s.responses > 0 && s.hits === 0 && s.competitorsMentioned.length > 0)
    .slice(0, 3)
    .map((s) => ({
      prompt: s.prompt,
      category: s.category,
      competitorsMentioned: s.competitorsMentioned,
    }));

  const rec = current.recommendation?.content
    ? parseRecommendationContent(current.recommendation.content)
    : { markdown: "", contentSuggestions: [] };

  return {
    brand,
    reportDate: new Date(current.createdAt).toISOString().slice(0, 10),
    previousReportDate: previous
      ? new Date(previous.createdAt).toISOString().slice(0, 10)
      : null,
    providers: current.providers,
    metrics,
    changes,
    competitors,
    newlyMentionedBrands,
    droppedBrands,
    citations: {
      topSources,
      brandSources: [...sourcesNow.brandSources].slice(0, 8),
      gainedSources: sourcesBefore
        ? [...sourcesNow.counts.keys()].filter((k) => !sourcesBefore.has(k)).slice(0, 8)
        : [],
      lostSources: sourcesBefore
        ? [...sourcesBefore.keys()].filter((k) => !sourcesNow.counts.has(k)).slice(0, 8)
        : [],
    },
    categories,
    strongestPrompts,
    gapPrompts,
    contentSuggestions: rec.contentSuggestions
      .slice(0, 6)
      .map(({ type, title }) => ({ type, title })),
    // ponytail: hard cut keeps the prompt small; summarize the markdown first if reports grow long.
    recommendationExcerpt: rec.markdown.slice(0, 2000),
  };
}
