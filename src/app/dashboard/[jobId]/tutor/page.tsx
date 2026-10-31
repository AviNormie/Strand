import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { VoiceTutor } from "@/components/VoiceTutor";
import { requireUser } from "@/lib/auth";
import { loadVoiceFacts } from "@/lib/voice/load";

export default async function TutorPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const user = await requireUser();
  const { jobId } = await params;
  const loaded = await loadVoiceFacts(jobId, user.id);
  if (!loaded) notFound();
  const { facts } = loaded;

  return (
    <>
      <AppHeader user={user} tone="paper" />
      <div className="min-h-screen bg-paper text-ink">
        <div className="mx-auto max-w-3xl space-y-6 px-4 pb-24 pt-28 sm:px-6 md:pt-32">
          <header>
            <Link
              href={`/dashboard/${jobId}`}
              className="text-sm font-semibold underline underline-offset-2"
            >
              ← Back to report
            </Link>
            <span className="mt-4 block w-fit rounded-full border-2 border-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
              Voice tutor
            </span>
            <h1 className="font-display mt-3 text-4xl font-bold tracking-tight">
              Learn AI visibility with {facts.brand}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">
              Ask out loud in your language. The tutor explains concepts like share of voice,
              citations and GEO using your own report from {facts.reportDate}, and can quiz you.
            </p>
          </header>
          <VoiceTutor
            jobId={jobId}
            brand={facts.brand}
            competitors={facts.competitors.slice(0, 3).map((c) => c.name)}
          />
        </div>
      </div>
    </>
  );
}
