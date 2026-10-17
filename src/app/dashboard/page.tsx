import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STATUS_BG: Record<string, string> = {
  COMPLETED: "bg-accent-green",
  FAILED: "bg-red-200",
  PROCESSING: "bg-accent-blue/60",
};

export default async function DashboardListPage() {
  const user = await requireUser();
  const jobs = await prisma.analysisJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { metrics: { select: { visibilityScore: true } } },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader user={user} tone="paper" />
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-28 sm:px-6 md:pt-32">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full border-2 border-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
              History
            </span>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Your analyses
            </h1>
          </div>
          <Link href="/analyze" className="sticker-btn-fill !px-5 !py-2.5 !text-sm">
            <span>New analysis</span>
            <span className="sticker-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="cartoon-card p-8 text-center">
            <p className="font-hand text-2xl">No analyses yet.</p>
            <Link href="/analyze" className="mt-2 inline-block underline decoration-accent-yellow decoration-4 underline-offset-4">
              Run your first one
            </Link>
          </div>
        ) : (
          <ul className="cartoon-card divide-y-2 divide-ink/10 overflow-hidden">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/dashboard/${job.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent-yellow/25"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{job.companyName}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/55">
                      {job.createdAt.toLocaleString()}
                      <span
                        className={`rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink ${STATUS_BG[job.status] ?? "bg-accent-yellow"}`}
                      >
                        {job.status}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {job.metrics ? (
                      <>
                        <p className="font-hand text-sm text-ink/60">Visibility</p>
                        <p className="font-display text-2xl font-bold tabular-nums">
                          {job.metrics.visibilityScore.toFixed(1)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-ink/60">{job.progressMessage || "—"}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
