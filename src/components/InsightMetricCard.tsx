"use client";

export type MetricTone = "poor" | "fair" | "good" | "na";

export function scoreTone(value: number | null | undefined): MetricTone {
  if (value == null || Number.isNaN(value)) return "na";
  if (value < 35) return "poor";
  if (value < 65) return "fair";
  return "good";
}

const TONE_STYLES: Record<
  MetricTone,
  { badge: string; label: string }
> = {
  poor: {
    badge: "bg-red-200",
    label: "Poor",
  },
  fair: {
    badge: "bg-accent-yellow",
    label: "Fair",
  },
  good: {
    badge: "bg-accent-green",
    label: "Good",
  },
  na: {
    badge: "bg-white",
    label: "N/A",
  },
};

export function InsightMetricCard({
  title,
  description,
  value,
  tone,
}: {
  title: string;
  description: string;
  value: string;
  tone: MetricTone;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      className={"cartoon-card relative flex min-h-[170px] flex-col justify-between p-5 sm:p-6"}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-hand text-xl">{title}</h3>
          {tone !== "na" && (
            <span
              className={`shrink-0 rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${styles.badge}`}
            >
              {styles.label}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          {description}
        </p>
      </div>
      <p className="font-display mt-6 text-5xl font-bold tracking-tight">
        {value}
      </p>
    </div>
  );
}
