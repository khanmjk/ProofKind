import type { FitAdvisorResult, FitCategory, PublicClaim, PublicProfile } from "@/lib/types";

export const FIT_PROMPT_VERSION = "public-profile-chat-v1";

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

function claimMatchesTerms(claim: PublicClaim, terms: string[]) {
  const haystack = [
    claim.approvedPublicText,
    claim.claimType,
    claim.publicEvidenceSummary,
    ...claim.themeTags,
    ...claim.capabilityTags
  ]
    .join(" ")
    .toLowerCase();

  return terms.some((term) => haystack.includes(term));
}

function formatClaimLines(claims: PublicClaim[]) {
  return claims.map((claim) => `- ${claim.approvedPublicText}`).join("\n");
}

function publicProfileIntro(profile: PublicProfile) {
  const sectionSummary = profile.sections
    .slice(0, 2)
    .map((section) => `${section.heading}: ${section.body}`)
    .join(" ");

  return `${profile.displayName} is presented in the approved public profile as ${profile.headline}. ${profile.summary} ${sectionSummary}`.trim();
}

export function evaluateFitLocally(question: string, profile: PublicProfile): FitAdvisorResult {
  const normalizedQuestion = question.toLowerCase();
  const unsafeTerm = privateOrUnsafeTerms.find((term) => normalizedQuestion.includes(term));

  if (unsafeTerm) {
    return {
      response:
        "I can only answer from Muhammad's approved public ProofKind profile. I cannot use private documents, raw psychometrics, journals, raw source data, or make employment decisions. Ask about public experience, work themes, capabilities, approved recommendations, approved work samples, or role fit.",
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
  const asksForOverview = /\b(who is|tell me about|overview|summary|profile)\b/.test(normalizedQuestion);
  const asksForEmployment = /\b(where has|where did|worked|employers?|companies|career history|timeline)\b/.test(
    normalizedQuestion
  );
  const asksForRecommendations = /\b(recommendation|recommendations|recommended|testimonial|testimonials|reference|references)\b/.test(
    normalizedQuestion
  );
  const asksForWorkSamples = /\b(work sample|portfolio|artifact|presentation|document|spreadsheet|show me.*work)\b/.test(
    normalizedQuestion
  );
  const asksForFit = /\b(fit|role|job|hire|candidate|project|need|looking|advisor|consult|collaborat|problem)\b/.test(
    normalizedQuestion
  );

  if (asksForOverview) {
    const introClaims = profile.claims.slice(0, 3);

    return {
      response: `${publicProfileIntro(profile)}\n\nApproved public signals:\n${formatClaimLines(introClaims)}`,
      fitCategory: "unclear_fit",
      claimIdsUsed: introClaims.map((claim) => claim.id),
      model: "local-rule-fallback",
      modelVersion: "1",
      promptVersion: FIT_PROMPT_VERSION
    };
  }

  if (asksForEmployment) {
    const employmentClaims = profile.claims
      .filter((claim) => claimMatchesTerms(claim, ["employment", "employer", "company", "role", "career", "timeline"]))
      .slice(0, 4);

    if (!employmentClaims.length) {
      return {
        response:
          "The approved public profile does not yet expose a detailed employment timeline. I can answer from public claims and sections, but I should not invent companies, dates, or roles that have not been approved for the public profile.",
        fitCategory: "unclear_fit",
        claimIdsUsed: [],
        model: "local-rule-fallback",
        modelVersion: "1",
        promptVersion: FIT_PROMPT_VERSION
      };
    }

    return {
      response: `The approved public profile gives these work-history signals:\n${formatClaimLines(employmentClaims)}`,
      fitCategory: "unclear_fit",
      claimIdsUsed: employmentClaims.map((claim) => claim.id),
      model: "local-rule-fallback",
      modelVersion: "1",
      promptVersion: FIT_PROMPT_VERSION
    };
  }

  if (asksForRecommendations) {
    const recommendationClaims = profile.claims
      .filter((claim) => claimMatchesTerms(claim, ["recommendation", "testimonial", "reference", "recommended"]))
      .slice(0, 4);

    if (!recommendationClaims.length) {
      return {
        response:
          "No recommendations or testimonials have been approved into this public profile yet. I can only show recommendations after the owner has explicitly approved public-safe recommendation summaries.",
        fitCategory: "unclear_fit",
        claimIdsUsed: [],
        model: "local-rule-fallback",
        modelVersion: "1",
        promptVersion: FIT_PROMPT_VERSION
      };
    }

    return {
      response: `Approved public recommendations:\n${formatClaimLines(recommendationClaims)}`,
      fitCategory: "unclear_fit",
      claimIdsUsed: recommendationClaims.map((claim) => claim.id),
      model: "local-rule-fallback",
      modelVersion: "1",
      promptVersion: FIT_PROMPT_VERSION
    };
  }

  if (asksForWorkSamples) {
    const artifactClaims = profile.claims
      .filter((claim) => claimMatchesTerms(claim, ["artifact", "portfolio", "work sample", "presentation", "document"]))
      .slice(0, 4);

    if (!artifactClaims.length) {
      return {
        response:
          "No public work samples or artifact summaries have been approved for this profile yet. The profile can discuss approved capabilities, but it should not expose private documents or unapproved work outputs.",
        fitCategory: "unclear_fit",
        claimIdsUsed: [],
        model: "local-rule-fallback",
        modelVersion: "1",
        promptVersion: FIT_PROMPT_VERSION
      };
    }

    return {
      response: `Approved public work-sample signals:\n${formatClaimLines(artifactClaims)}`,
      fitCategory: "unclear_fit",
      claimIdsUsed: artifactClaims.map((claim) => claim.id),
      model: "local-rule-fallback",
      modelVersion: "1",
      promptVersion: FIT_PROMPT_VERSION
    };
  }

  if (!used.length) {
    return {
      response:
        "The approved public profile does not give me enough evidence to answer that confidently. I should treat this as unclear unless the owner approves more public profile material or you provide a more specific public question.",
      fitCategory,
      claimIdsUsed: [],
      model: "local-rule-fallback",
      modelVersion: "1",
      promptVersion: FIT_PROMPT_VERSION
    };
  }

  const claimLines = used.map((item) => `- ${item.claim.approvedPublicText}`).join("\n");

  if (!asksForFit) {
    return {
      response: `From the approved public profile, the strongest public signals are:\n${claimLines}\n\nI can only use approved public profile content, so anything not represented here should be treated as unknown rather than assumed.`,
      fitCategory,
      claimIdsUsed: used.map((item) => item.claim.id),
      model: "local-rule-fallback",
      modelVersion: "1",
      promptVersion: FIT_PROMPT_VERSION
    };
  }

  return {
    response: `This looks like a ${humanCategory(fitCategory)} based on the approved public profile. The strongest public signals are:\n${claimLines}\n\nI would still validate the exact context in a conversation, especially if the work depends on domain-specific delivery history that is not yet represented in this Phase 1 profile.`,
    fitCategory,
    claimIdsUsed: used.map((item) => item.claim.id),
    model: "local-rule-fallback",
    modelVersion: "1",
    promptVersion: FIT_PROMPT_VERSION
  };
}
