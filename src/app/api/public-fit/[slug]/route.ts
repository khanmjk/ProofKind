import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { publicFitAdvisorEnabled } from "@/lib/env";
import { evaluateFit } from "@/lib/fit/geminiEvaluator";
import { checkRateLimit } from "@/lib/fit/rateLimit";
import { PublicProfileRepository } from "@/lib/repositories/publicProfileRepository";
import type { PublicFitSession } from "@/lib/types";

const requestSchema = z.object({
  question: z.string().min(8).max(900)
});

type PublicFitRouteProps = {
  params: Promise<{ slug: string }>;
};

function visitorKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "local";
}

export async function POST(request: NextRequest, { params }: PublicFitRouteProps) {
  if (!publicFitAdvisorEnabled()) {
    return NextResponse.json({ error: "Fit advisor is currently disabled." }, { status: 503 });
  }

  const { slug } = await params;
  const rateLimit = checkRateLimit(`${slug}:${visitorKey(request)}`);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many fit checks. Try again later." }, { status: 429 });
  }

  const body = requestSchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json({ error: "Enter a fit question between 8 and 900 characters." }, { status: 400 });
  }

  const repository = new PublicProfileRepository();
  const profile = await repository.getPublishedProfile(slug);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const result = await evaluateFit(body.data.question, profile);
  const now = new Date();
  const visitorSessionId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);

  const session: PublicFitSession = {
    schemaVersion: 1,
    slug,
    visitorSessionId,
    question: body.data.question,
    response: result.response,
    fitCategory: result.fitCategory,
    claimIdsUsed: result.claimIdsUsed,
    refusalReason: result.refusalReason ?? null,
    model: result.model,
    modelVersion: result.modelVersion,
    promptVersion: result.promptVersion,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  await repository.createFitSession(slug, session);

  return NextResponse.json({ result });
}
