import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toVoiceAgentError } from "@/lib/services/voice-agent.service";
import { reportInclude, serializeAnalysisReport } from "@/lib/report-serialize";
import { buildReportFacts, type ReportFacts } from "./facts";

/**
 * Facts for one of the user's completed reports, compared with their previous
 * completed report for the same company. Null when the report isn't theirs or isn't done.
 */
export async function loadVoiceFacts(
  jobId: string,
  userId: string
): Promise<{ facts: ReportFacts; cacheKey: string } | null> {
  const job = await prisma.analysisJob.findFirst({
    where: { id: jobId, userId, status: "COMPLETED" },
    include: reportInclude,
  });
  if (!job?.metrics) return null;

  const previous = await prisma.analysisJob.findFirst({
    where: {
      userId,
      companyId: job.companyId,
      // Company is one row per user, so the name keeps e.g. Nike from being compared with SvsFoods.
      companyName: { equals: job.companyName, mode: "insensitive" },
      status: "COMPLETED",
      createdAt: { lt: job.createdAt },
      metrics: { isNot: null },
    },
    orderBy: { createdAt: "desc" },
    include: reportInclude,
  });

  return {
    facts: buildReportFacts(
      serializeAnalysisReport(job),
      previous ? serializeAnalysisReport(previous) : null
    ),
    cacheKey: `${job.id}:${previous?.id ?? "none"}`,
  };
}

/** Shared error mapping for the voice API routes. */
export function voiceErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const e = toVoiceAgentError(error);
  return NextResponse.json(
    { error: e.message },
    {
      status: e.status,
      headers: e.retryAfter ? { "Retry-After": e.retryAfter } : undefined,
    }
  );
}
