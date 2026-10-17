"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type CompanyPrefill = {
  name: string;
  website: string | null;
  description: string | null;
  competitors: string[] | unknown;
} | null;

export function AnalyzeForm({ company }: { company: CompanyPrefill }) {
  const router = useRouter();
  const competitorsList = Array.isArray(company?.competitors)
    ? (company!.competitors as string[])
    : [];

  const [companyName, setCompanyName] = useState(company?.name || "");
  const [website, setWebsite] = useState(company?.website || "");
  const [description, setDescription] = useState(company?.description || "");
  const [competitors, setCompetitors] = useState(competitorsList.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/analysis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          website: website || null,
          description: description || null,
          competitors: competitors
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/analyze")}`);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to start analysis");
      }

      router.push(`/dashboard/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-xl space-y-5">
      <div>
        <label htmlFor="companyName" className="font-hand block text-lg text-ink">
          Company name <span className="text-[#d9534f]">*</span>
        </label>
        <input
          id="companyName"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border-2 border-ink bg-white px-3.5 py-2.5 text-ink outline-none transition-shadow placeholder:text-ink/35 focus:shadow-[3px_3px_0_0_#111]"
          placeholder="Nike"
        />
      </div>

      <div>
        <label htmlFor="website" className="font-hand block text-lg text-ink">
          Website
        </label>
        <input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border-2 border-ink bg-white px-3.5 py-2.5 text-ink outline-none transition-shadow placeholder:text-ink/35 focus:shadow-[3px_3px_0_0_#111]"
          placeholder="https://nike.com"
        />
      </div>

      <div>
        <label htmlFor="description" className="font-hand block text-lg text-ink">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border-2 border-ink bg-white px-3.5 py-2.5 text-ink outline-none transition-shadow placeholder:text-ink/35 focus:shadow-[3px_3px_0_0_#111]"
          placeholder="Leading athletic footwear and apparel company."
        />
      </div>

      <div>
        <label htmlFor="competitors" className="font-hand block text-lg text-ink">
          Competitors{" "}
          <span className="text-sm text-ink/55">
            (optional, one per line — we typo-correct names and auto-add top 5 more)
          </span>
        </label>
        <textarea
          id="competitors"
          rows={4}
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border-2 border-ink bg-white px-3.5 py-2.5 text-ink outline-none transition-shadow placeholder:text-ink/35 focus:shadow-[3px_3px_0_0_#111]"
          placeholder={"Adidas\nPuma\nNew Balance"}
        />
        <p className="mt-1.5 text-xs text-ink/55">
          Brand names are corrected automatically. We also discover five additional
          competitors and dedupe against your brand and inputs.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border-2 border-ink bg-[#E8A598]/40 px-3 py-2 text-sm text-ink">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="sticker-btn-fill w-full justify-center !py-3 uppercase tracking-wide disabled:opacity-60"
      >
        <span>{loading ? "Starting analysis…" : "Analyze"}</span>
        {!loading && (
          <span className="sticker-arrow" aria-hidden="true">
            →
          </span>
        )}
      </button>
    </form>
  );
}
