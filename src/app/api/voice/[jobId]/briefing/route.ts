import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getBriefing } from "@/lib/services/voice-agent.service";
import { VOICE_LANGUAGE_CODES } from "@/lib/voice/languages";
import { loadVoiceFacts, voiceErrorResponse } from "@/lib/voice/load";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ language: z.enum(VOICE_LANGUAGE_CODES) });

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireUser();
    const { jobId } = await context.params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    const loaded = await loadVoiceFacts(jobId, user.id);
    if (!loaded) {
      return NextResponse.json({ error: "Report not found or not finished" }, { status: 404 });
    }

    const briefing = await getBriefing(
      loaded.cacheKey,
      loaded.facts,
      parsed.data.language,
      user.id
    );
    return NextResponse.json(briefing, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return voiceErrorResponse(error);
  }
}
