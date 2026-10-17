"use client";

import type { ContentSuggestion } from "@/lib/services/recommendation.service";

const TYPE_ICON: Record<string, string> = {
  Listicle: "☰",
  "Problem Solution": "◈",
  "Year Specific": "◷",
  Comparison: "⇄",
  "How-To": "↳",
  "FAQ Hub": "?",
  "Buying Guide": "$",
  "Case Study": "▣",
};

export function ContentSuggestions({
  suggestions,
}: {
  suggestions: ContentSuggestion[];
}) {
  if (!suggestions.length) return null;

  return (
    <section className="cartoon-card overflow-hidden">
      <div className="border-b-2 border-ink px-5 py-6 sm:px-8">
        <h2 className="font-display text-3xl font-bold tracking-tight">
          Content suggestions
        </h2>
        <p className="mt-2 text-sm text-ink/65">
          Generated content ideas to boost AEO, based on citation and mention
          patterns from your prompts.
        </p>
      </div>
      <ul className="divide-y-2 divide-ink/10">
        {suggestions.map((s, idx) => (
          <li
            key={`${s.type}-${s.title}-${idx}`}
            className="flex gap-4 px-5 py-5 sm:px-8"
          >
            <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-accent-yellow text-sm font-bold text-ink">
              {TYPE_ICON[s.type] || "📄"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{s.title}</h3>
                <span className="rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {s.type}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                {s.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
