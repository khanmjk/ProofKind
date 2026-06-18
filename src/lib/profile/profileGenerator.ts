import { z } from "zod";
import { sha256, stableDocId } from "@/lib/common/hash";
import { getServerEnv } from "@/lib/env";
import type { CorpusChunkRecord } from "@/lib/repositories/corpusRepository";
import type {
  PrivateClaim,
  PublicClaim,
  PublicProfile,
  PublicSection,
  SourceSensitivity,
  SourceVisibility
} from "@/lib/types";

export const PROFILE_SYNTHESIS_PROMPT_VERSION = "profile-synthesis-v1";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const generatedClaimSchema = z.object({
  claimText: z.string().min(20),
  claimType: z.string().min(2),
  themeTags: z.array(z.string()).default([]),
  capabilityTags: z.array(z.string()).default([]),
  evidenceSummary: z.string().min(10),
  sourceVersionIds: z.array(z.string()).default([]),
  chunkContentHashes: z.array(z.string()).default([]),
  sensitivity: z.enum(["public", "internal", "confidential", "sensitive", "highly_sensitive"]).default("internal"),
  visibility: z.enum(["private", "private_supported", "public_candidate", "public"]).default("public_candidate")
});

const generatedProfileSchema = z.object({
  displayName: z.string().min(2),
  headline: z.string().min(10),
  summary: z.string().min(40),
  locationLabel: z.string().default(""),
  availabilityLabel: z.string().default(""),
  sections: z
    .array(
      z.object({
        heading: z.string().min(2),
        body: z.string().min(20)
      })
    )
    .min(2)
    .max(8),
  claims: z.array(generatedClaimSchema).min(5).max(60),
  missingContextQuestions: z.array(z.string()).default([])
});

export type GeneratedProfile = z.infer<typeof generatedProfileSchema>;

type GenerateOptions = {
  displayName: string;
  locationLabel: string;
  availabilityLabel: string;
  maxContextChars: number;
};

type MaterializeOptions = {
  tenantId: string;
  slug: string;
  ownerUid: string;
  publish: boolean;
  bookingUrl: string;
  interestCaptureUrl: string;
  agentRunId: string;
};

function buildContext(records: CorpusChunkRecord[], maxChars: number) {
  const entries: string[] = [];
  let usedChars = 0;

  for (const record of records) {
    const sourceTitle = record.sourceItem?.title ?? "Untitled source";
    const sourcePath = record.sourceItem?.resolvedPath ?? "";
    const documentFamily = record.sourceVersion?.documentFamily ?? "unknown";
    const entry = [
      `SOURCE_VERSION_ID: ${record.chunk.sourceVersionId}`,
      `CHUNK_CONTENT_HASH: ${record.chunk.contentHash}`,
      `TITLE: ${sourceTitle}`,
      `PATH: ${sourcePath}`,
      `DOCUMENT_FAMILY: ${documentFamily}`,
      `SENSITIVITY: ${record.chunk.sensitivity}`,
      "TEXT:",
      record.chunk.text
    ].join("\n");

    if (usedChars + entry.length > maxChars) break;
    entries.push(entry);
    usedChars += entry.length;
  }

  return entries.join("\n\n---\n\n");
}

function extractGeminiText(payload: unknown) {
  const parsed = z
    .object({
      candidates: z
        .array(
          z.object({
            content: z.object({
              parts: z.array(z.object({ text: z.string().optional() }))
            })
          })
        )
        .optional()
    })
    .safeParse(payload);

  if (!parsed.success) return null;

  return (
    parsed.data.candidates?.[0]?.content.parts
      .map((part) => part.text)
      .filter(Boolean)
      .join("\n") || null
  );
}

function promptForProfile(context: string, options: GenerateOptions) {
  return `You are ProofKind's private professional profile synthesis agent.

Build a professional profile candidate from the supplied owner-approved corpus excerpts.
Use only the supplied evidence. Do not invent employers, dates, products, qualifications, metrics, or personal traits.
Generate public-safe wording, but keep source lineage for every claim.

Sensitive source handling:
- Psychometric, performance, feedback, journal, family, finance, medical, and identity documents are private evidence.
- You may synthesize operating-style or professional-development themes from sensitive sources.
- Do not expose raw psychometric scores, private health, family, financial, legal, identity, address, account, or salary details.
- If evidence is weak, say so through modest wording.

Return only JSON with this shape:
{
  "displayName": "string",
  "headline": "string",
  "summary": "string",
  "locationLabel": "string",
  "availabilityLabel": "string",
  "sections": [{"heading": "string", "body": "string"}],
  "claims": [{
    "claimText": "string",
    "claimType": "string",
    "themeTags": ["string"],
    "capabilityTags": ["string"],
    "evidenceSummary": "public-safe evidence summary",
    "sourceVersionIds": ["SOURCE_VERSION_ID values from context"],
    "chunkContentHashes": ["CHUNK_CONTENT_HASH values from context"],
    "sensitivity": "public | internal | confidential | sensitive | highly_sensitive",
    "visibility": "private | private_supported | public_candidate | public"
  }],
  "missingContextQuestions": ["string"]
}

Prefer 20-35 claims if the corpus supports them. Every claim must cite at least one provided sourceVersionId or chunkContentHash.

Owner metadata:
displayName: ${options.displayName}
locationLabel: ${options.locationLabel}
availabilityLabel: ${options.availabilityLabel}

Corpus excerpts:
${context}`;
}

function sentenceCandidates(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 80 && sentence.length <= 260);
}

function fallbackProfile(records: CorpusChunkRecord[], options: GenerateOptions): GeneratedProfile {
  const claims = records
    .flatMap((record) =>
      sentenceCandidates(record.chunk.text).slice(0, 2).map((sentence) => ({
        claimText: sentence,
        claimType: record.sourceVersion?.documentFamily ?? "evidence",
        themeTags: [record.sourceVersion?.documentFamily ?? "evidence"].filter(Boolean),
        capabilityTags: [],
        evidenceSummary: `Extracted from ${record.sourceItem?.title ?? "an ingested source"}.`,
        sourceVersionIds: [record.chunk.sourceVersionId],
        chunkContentHashes: [record.chunk.contentHash],
        sensitivity: record.chunk.sensitivity,
        visibility: record.chunk.visibility === "private" ? "private_supported" : record.chunk.visibility
      }))
    )
    .slice(0, 30);

  return {
    displayName: options.displayName,
    headline: "Professional profile generated from ingested evidence",
    summary:
      "This profile candidate was generated from the ingested ProofKind corpus. It should be reviewed for tone, specificity, and public-safe wording before broader sharing.",
    locationLabel: options.locationLabel,
    availabilityLabel: options.availabilityLabel,
    sections: [
      {
        heading: "Evidence Base",
        body: `ProofKind ingested ${records.length} text chunks from approved source material and generated a profile candidate with source lineage.`
      },
      {
        heading: "Review Needed",
        body: "The deterministic fallback generated extractive claims because no Gemini API key was available or model output was invalid."
      }
    ],
    claims: claims.length
      ? claims
      : [
          {
            claimText: "The ingested corpus did not contain enough parsed professional evidence to generate a credible public claim.",
            claimType: "insufficient_evidence",
            themeTags: ["evidence gap"],
            capabilityTags: [],
            evidenceSummary: "No sufficiently long source sentences were available after parsing.",
            sourceVersionIds: [],
            chunkContentHashes: [],
            sensitivity: "internal",
            visibility: "private_supported"
          }
        ],
    missingContextQuestions: [
      "Which source folders should be treated as professional evidence versus personal archive?",
      "Which generated claims should be approved for public publication?"
    ]
  };
}

function filterLineage(profile: GeneratedProfile, records: CorpusChunkRecord[]) {
  const allowedVersionIds = new Set(records.map((record) => record.chunk.sourceVersionId));
  const allowedChunkHashes = new Set(records.map((record) => record.chunk.contentHash));

  return {
    ...profile,
    claims: profile.claims.map((claim) => {
      const sourceVersionIds = claim.sourceVersionIds.filter((id) => allowedVersionIds.has(id));
      const chunkContentHashes = claim.chunkContentHashes.filter((hash) => allowedChunkHashes.has(hash));

      return {
        ...claim,
        sourceVersionIds,
        chunkContentHashes,
        visibility: claim.visibility === "public" ? "public_candidate" : claim.visibility
      };
    })
  };
}

export async function generateProfileFromCorpus(
  records: CorpusChunkRecord[],
  options: GenerateOptions
): Promise<{ profile: GeneratedProfile; model: string; modelVersion: string }> {
  const context = buildContext(records, options.maxContextChars);
  const env = getServerEnv();

  if (!context || !env.GEMINI_API_KEY) {
    return {
      profile: fallbackProfile(records, options),
      model: "local-extractive-fallback",
      modelVersion: "1"
    };
  }

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: promptForProfile(context, options) }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      return {
        profile: fallbackProfile(records, options),
        model: "local-extractive-fallback",
        modelVersion: "1"
      };
    }

    const text = extractGeminiText(await response.json());
    const parsed = text ? generatedProfileSchema.safeParse(JSON.parse(text)) : null;

    if (!parsed?.success) {
      return {
        profile: fallbackProfile(records, options),
        model: "local-extractive-fallback",
        modelVersion: "1"
      };
    }

    return {
      profile: filterLineage(parsed.data, records),
      model: `googleai/${GEMINI_MODEL}`,
      modelVersion: GEMINI_MODEL
    };
  } catch {
    return {
      profile: fallbackProfile(records, options),
      model: "local-extractive-fallback",
      modelVersion: "1"
    };
  }
}

function publicSafeSensitivity(value: SourceSensitivity): SourceSensitivity {
  return value === "public" || value === "internal" ? value : "confidential";
}

function publicVisibility(value: SourceVisibility, publish: boolean): SourceVisibility {
  if (!publish) return value === "private" ? "private_supported" : value;
  return value === "private" ? "private_supported" : "public";
}

export function materializeGeneratedProfile(
  generated: GeneratedProfile,
  options: MaterializeOptions & { model: string; modelVersion: string }
) {
  const now = new Date().toISOString();
  const publicProfileId = options.slug;
  const publishState = options.publish ? "published" : "draft";

  const privateClaims: PrivateClaim[] = generated.claims.map((claim, index) => {
    const id = stableDocId("claim", `${options.slug}:${claim.claimText}:${index}`);

    return {
      id,
      schemaVersion: 1,
      tenantId: options.tenantId,
      claimText: claim.claimText,
      claimType: claim.claimType,
      proposedByAgentRunId: options.agentRunId,
      evidenceStrength: claim.sourceVersionIds.length || claim.chunkContentHashes.length ? "moderate" : "weak",
      evidenceSummary: claim.evidenceSummary,
      sourceVersionIds: claim.sourceVersionIds,
      chunkContentHashes: claim.chunkContentHashes,
      relatedEntityIds: [],
      relatedRelationshipIds: [],
      approvalStatus: options.publish ? "approved" : "draft",
      visibility: publicVisibility(claim.visibility, options.publish),
      sensitivity: publicSafeSensitivity(claim.sensitivity),
      publishState,
      staleStatus: "current",
      model: options.model,
      modelVersion: options.modelVersion,
      promptVersion: PROFILE_SYNTHESIS_PROMPT_VERSION,
      agentRunId: options.agentRunId,
      createdAt: now,
      updatedAt: now,
      createdBy: options.ownerUid,
      updatedBy: options.ownerUid
    };
  });

  const publicClaims: PublicClaim[] = privateClaims.map((claim, index) => ({
    id: stableDocId("public_claim", `${options.slug}:${claim.id}`),
    schemaVersion: 1,
    slug: options.slug,
    publicProfileId,
    owningTenantId: options.tenantId,
    sourcePrivateClaimId: claim.id,
    approvedPublicText: claim.claimText,
    claimType: claim.claimType,
    themeTags: generated.claims[index]?.themeTags ?? [],
    capabilityTags: generated.claims[index]?.capabilityTags ?? [],
    publicEvidenceSummary: claim.evidenceSummary,
    publicCitationRefs: claim.sourceVersionIds.map((id) => `sourceVersion:${id}`),
    visibility: "public",
    staleStatus: "current",
    approvedByUid: options.ownerUid,
    approvedAt: now,
    sortOrder: index + 1,
    createdAt: now,
    updatedAt: now
  }));

  const publicSections: PublicSection[] = generated.sections.map((section, index) => ({
    id: stableDocId("section", `${options.slug}:${section.heading}:${index}`),
    schemaVersion: 1,
    slug: options.slug,
    publicProfileId,
    heading: section.heading,
    body: section.body,
    sortOrder: index + 1,
    createdAt: now,
    updatedAt: now
  }));

  const profile: PublicProfile = {
    id: publicProfileId,
    schemaVersion: 1,
    slug: options.slug,
    owningTenantId: options.tenantId,
    displayName: generated.displayName,
    headline: generated.headline,
    summary: generated.summary,
    locationLabel: generated.locationLabel,
    availabilityLabel: generated.availabilityLabel,
    bookingUrl: options.bookingUrl,
    interestCaptureUrl: options.interestCaptureUrl,
    publishState,
    publicEndpointEnabled: options.publish,
    createdAt: now,
    updatedAt: now,
    sections: publicSections,
    claims: publicClaims
  };

  return {
    profile,
    privateClaims,
    publicClaims: options.publish ? publicClaims : [],
    publicSections: options.publish ? publicSections : [],
    generationFingerprint: sha256(JSON.stringify(generated))
  };
}
