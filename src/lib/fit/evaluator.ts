import type { FitAdvisorResult, FitCategory, PublicClaim, PublicProfile } from "@/lib/types";

export const FIT_PROMPT_VERSION = "public-fit-v1";

const privateOrUnsafeTerms = [
  "psychometric",
  "journal",
  "private",
  "source data",
  "raw document",
  "diagnose",
  "medical",
  "mental health",
  "protected trait",
  "rank this person",
  "hiring recommendation",
  "employment decision",
  "salary",
  "password",
  "secret"
];

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);
}

function scoreClaim(questionTokens: Set<string>, claim: PublicClaim) {
  const claimTokens = [
    ...tokenize(claim.approvedPublicText),
    ...claim.themeTags.flatMap(tokenize),
    ...claim.capabilityTags.flatMap(tokenize)
  ];

  return claimTokens.reduce((score, token) => score + (questionTokens.has(token) ? 1 : 0), 0);
}

function categoryFromScore(score: number): FitCategory {
  if (score >= 8) return "strong_fit";
  if (score >= 3) return "partial_fit";
  if (score === 0) return "unclear_fit";
  return "partial_fit";
}

function humanCategory(category: FitCategory) {
  return category.replaceAll("_", " ");
}

export function evaluateFitLocally(question: string, profile: PublicProfile): FitAdvisorResult {
  const normalizedQuestion = question.toLowerCase();
  const unsafeTerm = privateOrUnsafeTerms.find((term) => normalizedQuestion.includes(term));

  if (unsafeTerm) {
    return {
      response:
        "I can only answer from Muhammad's approved public ProofKind profile. I cannot use private documents, psychometrics, journals, raw source data, or make employment decisions. Ask about a role, project, product problem, or capability you want to compare against the public profile.",
      fitCategory: "out_of_scope",
      claimIdsUsed: [],
      refusalReason: `Question requested unsupported or private scope: ${unsafeTerm}`,
      model: "local-rule-fallback",
      modelVersion: "1",
      promptVersion: FIT_PROMPT_VERSION
    };
  }

  const questionTokens = new Set(tokenize(question));
  const scoredClaims = profile.claims
    .map((claim) => ({ claim, score: scoreClaim(questionTokens, claim) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const topScore = scoredClaims.reduce((sum, item) => sum + item.score, 0);
  const used = scoredClaims.filter((item) => item.score > 0).slice(0, 4);
  const fitCategory = categoryFromScore(topScore);

  if (!used.length) {
    return {
      response:
        "The approved public profile does not give me enough evidence to make a confident fit call for that request. I would treat this as unclear and ask for more context about the role, product area, or problem.",
      fitCategory,
      claimIdsUsed: [],
      model: "local-rule-fallback",
      modelVersion: "1",
      promptVersion: FIT_PROMPT_VERSION
    };
  }

  const claimLines = used
    .map((item) => `- ${item.claim.approvedPublicText}`)
    .join("\n");

  return {
    response: `This looks like a ${humanCategory(fitCategory)} based on the approved public profile. The strongest public signals are:\n${claimLines}\n\nI would still validate the exact context in a conversation, especially if the work depends on domain-specific delivery history that is not yet represented in this Phase 1 profile.`,
    fitCategory,
    claimIdsUsed: used.map((item) => item.claim.id),
    model: "local-rule-fallback",
    modelVersion: "1",
    promptVersion: FIT_PROMPT_VERSION
  };
}

