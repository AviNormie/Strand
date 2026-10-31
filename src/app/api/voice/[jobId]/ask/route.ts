import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { answerQuestion } from "@/lib/services/voice-agent.service";
import { VOICE_LANGUAGE_CODES } from "@/lib/voice/languages";
import { loadVoiceFacts, voiceErrorResponse } from "@/lib/voice/load";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  language: z.enum(VOICE_LANGUAGE_CODES),
  question: z.string().trim().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .default([]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireUser();
    const { jobId } = await context.params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid question" },
        { status: 400 }
      );
    }

    const loaded = await loadVoiceFacts(jobId, user.id);
    if (!loaded) {
      return NextResponse.json({ error: "Report not found or not finished" }, { status: 404 });
    }

    const { language, question, history } = parsed.data;
    const result = await answerQuestion(loaded.facts, language, history, question, user.id);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return voiceErrorResponse(error);
  }
}
