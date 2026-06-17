import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { evaluateFitLocally, FIT_PROMPT_VERSION } from "@/lib/fit/evaluator";
import type { FitAdvisorResult, PublicProfile } from "@/lib/types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const fitSchema = z.object({
  response: z.string().min(1),
  fitCategory: z.enum([
    "strong_fit",
    "partial_fit",
    "unclear_fit",
    "likely_mismatch",
    "out_of_scope"
  ]),
  claimIdsUsed: z.array(z.string()),
  refusalReason: z.string().nullable().optional()
});

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(
            z.object({
              text: z.string().optional()
            })
          )
        })
      })
    )
    .optional()
});

function publicContext(profile: PublicProfile) {
  return {
    displayName: profile.displayName,
    headline: profile.headline,
    summary: profile.summary,
    sections: profile.sections.map((section) => ({
      heading: section.heading,
      body: section.body
    })),
    claims: profile.claims.map((claim) => ({
      id: claim.id,
      claim: claim.approvedPublicText,
      type: claim.claimType,
      themes: claim.themeTags,
      capabilities: claim.capabilityTags,
      proof: claim.publicEvidenceSummary
    }))
  };
}

function fitPrompt(question: string, profile: PublicProfile) {
  return `You are the public ProofKind fit advisor.

You may use only the approved public profile JSON below.
You must not infer private data, psychometrics, journals, raw source content, protected traits, salary, or confidential work.
You must not make a hiring recommendation or employment decision.
If the profile lacks evidence, say the fit is unclear or out of scope.
Be candid but not reflexively negative.
Return cited claim IDs used in the answer.

Return only JSON with this exact shape:
{
  "response": "string",
  "fitCategory": "strong_fit | partial_fit | unclear_fit | likely_mismatch | out_of_scope",
  "claimIdsUsed": ["public claim IDs"],
  "refusalReason": "string or null"
}

Approved public profile JSON:
${JSON.stringify(publicContext(profile), null, 2)}

Visitor question:
${question}`;
}

function extractGeminiText(payload: unknown) {
  const parsed = geminiResponseSchema.safeParse(payload);

  if (!parsed.success) return null;

  return (
    parsed.data.candidates?.[0]?.content.parts
      .map((part) => part.text)
      .filter(Boolean)
      .join("\n") || null
  );
}

function parseFitJson(text: string, profile: PublicProfile) {
  const parsedJson = JSON.parse(text) as unknown;
  const parsedResult = fitSchema.safeParse(parsedJson);

  if (!parsedResult.success) return null;

  const allowedClaimIds = new Set(profile.claims.map((claim) => claim.id));
  const claimIdsUsed = parsedResult.data.claimIdsUsed.filter((id) => allowedClaimIds.has(id));

  return {
    ...parsedResult.data,
    claimIdsUsed,
    refusalReason: parsedResult.data.refusalReason ?? null
  };
}

export async function evaluateFit(question: string, profile: PublicProfile): Promise<FitAdvisorResult> {
  const env = getServerEnv();

  if (!env.GEMINI_API_KEY) {
    return evaluateFitLocally(question, profile);
  }

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: fitPrompt(question, profile) }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      return evaluateFitLocally(question, profile);
    }

    const text = extractGeminiText(await response.json());

    if (!text) {
      return evaluateFitLocally(question, profile);
    }

    const result = parseFitJson(text, profile);

    if (!result) {
      return evaluateFitLocally(question, profile);
    }

    return {
      ...result,
      model: `googleai/${GEMINI_MODEL}`,
      modelVersion: GEMINI_MODEL,
      promptVersion: FIT_PROMPT_VERSION
    };
  } catch {
    return evaluateFitLocally(question, profile);
  }
}
