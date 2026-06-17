import type { PrivateClaim, PublicProfile, PublicSection } from "@/lib/types";
import { serializePublicClaim } from "@/lib/profile/publicSerializer";

const now = "2026-06-17T00:00:00.000Z";
const tenantId = "founder-mjk";
const ownerUid = "owner-mjk";
const slug = "mjk";
const publicProfileId = "mjk";

const privateClaimInputs: Array<Pick<PrivateClaim, "id" | "claimText" | "claimType" | "evidenceSummary"> & {
  themeTags: string[];
  capabilityTags: string[];
}> = [
  {
    id: "claim-001",
    claimType: "positioning",
    claimText:
      "Turns ambiguous product, platform, and operating-model problems into a clearer execution path that technical and business stakeholders can act on.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["strategy", "clarity"],
    capabilityTags: ["problem framing", "stakeholder alignment"]
  },
  {
    id: "claim-002",
    claimType: "architecture",
    claimText:
      "Approaches AI products as systems with policy boundaries, data ownership, evaluation gates, and cost controls rather than isolated model prompts.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["AI systems", "governance"],
    capabilityTags: ["system architecture", "AI safety"]
  },
  {
    id: "claim-003",
    claimType: "product",
    claimText:
      "Prioritizes thin validation slices that test market behaviour before committing to heavy platform infrastructure.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["product strategy", "validation"],
    capabilityTags: ["MVP scoping", "experimentation"]
  },
  {
    id: "claim-004",
    claimType: "delivery",
    claimText:
      "Can separate foundational architecture that prevents rewrites from speculative platform breadth that delays learning.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["delivery", "architecture"],
    capabilityTags: ["technical judgement", "scope control"]
  },
  {
    id: "claim-005",
    claimType: "leadership",
    claimText:
      "Uses adversarial review and second opinions to harden product and architecture decisions before implementation starts.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["leadership", "quality"],
    capabilityTags: ["review discipline", "decision quality"]
  },
  {
    id: "claim-006",
    claimType: "AI",
    claimText:
      "Designs AI experiences as conversation-led workflows where the system interviews for missing context and keeps humans in control of publication decisions.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["agentic AI", "human-in-the-loop"],
    capabilityTags: ["AI product design", "workflow design"]
  },
  {
    id: "claim-007",
    claimType: "security",
    claimText:
      "Treats public and private data boundaries as product-critical, with separate public materialization rather than exposing private records directly.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["privacy", "security"],
    capabilityTags: ["tenant isolation", "data governance"]
  },
  {
    id: "claim-008",
    claimType: "cost",
    claimText:
      "Builds with explicit cost controls, preferring free or low-cost managed services until product demand justifies higher spend.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["cost control", "pragmatism"],
    capabilityTags: ["cloud cost management", "platform planning"]
  },
  {
    id: "claim-009",
    claimType: "data",
    claimText:
      "Models professional identity as an evidence graph of claims, sources, roles, products, projects, outcomes, and owner-approved public narratives.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["data model", "professional identity"],
    capabilityTags: ["canonical modelling", "knowledge design"]
  },
  {
    id: "claim-010",
    claimType: "product",
    claimText:
      "Frames ProofKind as a professional memory and proof platform, with public profile validation first and private coaching deferred until there is signal.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["product vision", "sequencing"],
    capabilityTags: ["product positioning", "roadmapping"]
  },
  {
    id: "claim-011",
    claimType: "architecture",
    claimText:
      "Selects a deliberately narrow Google-first stack to reduce integration overhead while still preserving a path to agentic ingestion and retrieval.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["Google Cloud", "stack discipline"],
    capabilityTags: ["technical selection", "platform architecture"]
  },
  {
    id: "claim-012",
    claimType: "quality",
    claimText:
      "Insists that public AI answers cite approved public claims or admit insufficient evidence rather than inventing credibility.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["trust", "AI quality"],
    capabilityTags: ["grounded generation", "eval design"]
  },
  {
    id: "claim-013",
    claimType: "delivery",
    claimText:
      "Moves from product idea to written vision, marketing narrative, architecture, data model, and implementation backlog before coding the platform.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["execution", "planning"],
    capabilityTags: ["product discovery", "technical planning"]
  },
  {
    id: "claim-014",
    claimType: "AI",
    claimText:
      "Recognizes that public generation boundaries matter as much as retrieval boundaries because private context can leak through paraphrase.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["AI safety", "privacy"],
    capabilityTags: ["threat modelling", "prompt boundary design"]
  },
  {
    id: "claim-015",
    claimType: "architecture",
    claimText:
      "Keeps multi-tenancy in the data and repository spine from day one while avoiding enterprise features before the founder slice proves demand.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["multi-tenancy", "MVP"],
    capabilityTags: ["SaaS architecture", "scope discipline"]
  },
  {
    id: "claim-016",
    claimType: "product",
    claimText:
      "Uses a candid fit advisor as a conversion test: if visitors ask real questions, book conversations, or request their own profile, the concept has signal.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["market validation", "conversion"],
    capabilityTags: ["validation design", "go-to-market testing"]
  },
  {
    id: "claim-017",
    claimType: "security",
    claimText:
      "Requires anonymous public sessions to go through server API routes rather than direct Firestore writes, reducing abuse and stored-injection risk.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["security", "abuse prevention"],
    capabilityTags: ["server-side boundaries", "Firestore rules"]
  },
  {
    id: "claim-018",
    claimType: "delivery",
    claimText:
      "Can turn critical review feedback into concrete implementation gates rather than letting review become endless documentation polish.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["execution", "feedback"],
    capabilityTags: ["iteration", "decision-making"]
  },
  {
    id: "claim-019",
    claimType: "data",
    claimText:
      "Separates current v1 schema from reserved future coaching collections, avoiding accidental build scope expansion.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["data design", "scope control"],
    capabilityTags: ["schema governance", "roadmap discipline"]
  },
  {
    id: "claim-020",
    claimType: "product",
    claimText:
      "Understands that a professional profile product succeeds only if its claims are specific, falsifiable, and credible to a skeptical senior peer.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["positioning", "credibility"],
    capabilityTags: ["content strategy", "market empathy"]
  },
  {
    id: "claim-021",
    claimType: "architecture",
    claimText:
      "Designs connector extensibility as an adapter boundary for later phases rather than a reason to build every integration upfront.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["connectors", "platform"],
    capabilityTags: ["plugin architecture", "sequencing"]
  },
  {
    id: "claim-022",
    claimType: "delivery",
    claimText:
      "Uses CLI-driven setup and automation where possible, reserving human involvement for authentication, billing, and sensitive credential steps.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["automation", "delivery"],
    capabilityTags: ["developer workflow", "cloud setup"]
  },
  {
    id: "claim-023",
    claimType: "cost",
    claimText:
      "Treats provider-level budget controls as mandatory before public AI endpoints are shared, because app-level rate limits can fail.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["cost", "risk"],
    capabilityTags: ["budget controls", "operational risk"]
  },
  {
    id: "claim-024",
    claimType: "AI",
    claimText:
      "Plans prompt-injection, unsupported-claim, private-leak, and tone/candor evals as deployment gates for the public fit advisor.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["evals", "AI safety"],
    capabilityTags: ["evaluation design", "deployment gates"]
  },
  {
    id: "claim-025",
    claimType: "leadership",
    claimText:
      "Pushes for a strong architecture spine even in an MVP, while accepting that the first market test must stay narrow and fast.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["leadership", "architecture"],
    capabilityTags: ["technical leadership", "MVP judgement"]
  },
  {
    id: "claim-026",
    claimType: "product",
    claimText:
      "Positions LinkedIn as an input source and distribution context rather than trying to replace the network directly in v1.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["market positioning", "strategy"],
    capabilityTags: ["competitive framing", "product strategy"]
  },
  {
    id: "claim-027",
    claimType: "data",
    claimText:
      "Treats journals, psychometrics, feedback, and performance data as private-by-default sources that must not leak into public visitor answers.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["privacy", "personalization"],
    capabilityTags: ["sensitive data handling", "public/private policy"]
  },
  {
    id: "claim-028",
    claimType: "delivery",
    claimText:
      "Can absorb opposing recommendations, reject the parts that conflict with product principles, and still take concrete corrections from the critique.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["judgement", "collaboration"],
    capabilityTags: ["critical thinking", "stakeholder collaboration"]
  },
  {
    id: "claim-029",
    claimType: "architecture",
    claimText:
      "Avoids relying on MCP or external connectors as a security boundary; ProofKind owns tenancy, authorization, lineage, and visibility policy.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["security", "MCP"],
    capabilityTags: ["tool governance", "authorization design"]
  },
  {
    id: "claim-030",
    claimType: "product",
    claimText:
      "Defines success by real visitor behaviour: fit advisor use, bookings, qualified conversations, and requests to create another ProofKind profile.",
    evidenceSummary: "Owner-curated Phase 1 proof point.",
    themeTags: ["validation", "metrics"],
    capabilityTags: ["market testing", "success criteria"]
  }
];

export const privateClaims: PrivateClaim[] = privateClaimInputs.map((claim) => ({
  id: claim.id,
  schemaVersion: 1,
  tenantId,
  claimText: claim.claimText,
  claimType: claim.claimType,
  proposedByAgentRunId: null,
  evidenceStrength: "owner_asserted",
  evidenceSummary: claim.evidenceSummary,
  sourceVersionIds: [],
  chunkContentHashes: [],
  relatedEntityIds: [],
  relatedRelationshipIds: [],
  approvalStatus: "approved",
  visibility: "public",
  sensitivity: "public",
  publishState: "published",
  staleStatus: "current",
  createdAt: now,
  updatedAt: now,
  createdBy: ownerUid,
  updatedBy: ownerUid
}));

export const publicSections: PublicSection[] = [
  {
    id: "section-positioning",
    schemaVersion: 1,
    slug,
    publicProfileId,
    heading: "Positioning",
    body:
      "A product and systems thinker focused on turning messy professional, AI, and platform problems into clear product slices, defensible architecture, and practical validation loops.",
    sortOrder: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "section-fit",
    schemaVersion: 1,
    slug,
    publicProfileId,
    heading: "Best Fit",
    body:
      "Useful where the work needs clear product judgement, AI-enabled workflow design, tenant-safe platform thinking, cost discipline, and a bias toward getting a real market signal quickly.",
    sortOrder: 2,
    createdAt: now,
    updatedAt: now
  }
];

const publicClaims = privateClaims.map((privateClaim, index) => {
  const source = privateClaimInputs[index];

  return serializePublicClaim({
    slug,
    publicProfileId,
    owningTenantId: tenantId,
    privateClaim,
    themeTags: source.themeTags,
    capabilityTags: source.capabilityTags,
    publicEvidenceSummary: source.evidenceSummary,
    approvedByUid: ownerUid,
    sortOrder: index + 1,
    now
  });
});

export const localSeedProfile: PublicProfile = {
  id: publicProfileId,
  schemaVersion: 1,
  slug,
  owningTenantId: tenantId,
  displayName: "Muhammad Khan",
  headline: "Product-minded systems architect for AI-enabled professional identity",
  summary:
    "Currently shaping ProofKind: an AI-led professional identity platform that turns owner-approved professional proof into a public profile and candid fit advisor.",
  locationLabel: "United Kingdom / South Africa time zones",
  availabilityLabel: "Open to targeted conversations",
  bookingUrl: "",
  interestCaptureUrl: "",
  publishState: "published",
  publicEndpointEnabled: true,
  createdAt: now,
  updatedAt: now,
  sections: publicSections,
  claims: publicClaims
};
