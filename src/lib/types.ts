export type PublishState = "draft" | "published" | "unpublished";

export type FitCategory =
  | "strong_fit"
  | "partial_fit"
  | "unclear_fit"
  | "likely_mismatch"
  | "out_of_scope";

export type PublicClaim = {
  id: string;
  schemaVersion: number;
  slug: string;
  publicProfileId: string;
  owningTenantId: string;
  sourcePrivateClaimId: string;
  approvedPublicText: string;
  claimType: string;
  themeTags: string[];
  capabilityTags: string[];
  publicEvidenceSummary: string;
  publicCitationRefs: string[];
  visibility: "public";
  staleStatus: "current" | "stale";
  approvedByUid: string;
  approvedAt: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicSection = {
  id: string;
  schemaVersion: number;
  slug: string;
  publicProfileId: string;
  heading: string;
  body: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicProfile = {
  id: string;
  schemaVersion: number;
  slug: string;
  owningTenantId: string;
  displayName: string;
  headline: string;
  summary: string;
  locationLabel: string;
  availabilityLabel: string;
  bookingUrl: string;
  interestCaptureUrl: string;
  publishState: PublishState;
  publicEndpointEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  sections: PublicSection[];
  claims: PublicClaim[];
};

export type PrivateClaim = {
  id: string;
  schemaVersion: number;
  tenantId: string;
  claimText: string;
  claimType: string;
  proposedByAgentRunId: null;
  evidenceStrength: "owner_asserted" | "weak" | "moderate" | "strong";
  evidenceSummary: string;
  sourceVersionIds: string[];
  chunkContentHashes: string[];
  relatedEntityIds: string[];
  relatedRelationshipIds: string[];
  approvalStatus: "approved";
  visibility: "public";
  sensitivity: "public";
  publishState: "published";
  staleStatus: "current";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type TenantContext = {
  tenantId: string;
  uid: string;
  roles: Array<"owner" | "editor" | "viewer">;
};

export type FitAdvisorResult = {
  response: string;
  fitCategory: FitCategory;
  claimIdsUsed: string[];
  refusalReason?: string | null;
  model: string;
  modelVersion: string;
  promptVersion: string;
};

export type PublicFitSession = {
  schemaVersion: number;
  slug: string;
  visitorSessionId: string;
  question: string;
  response: string;
  fitCategory: FitCategory;
  claimIdsUsed: string[];
  refusalReason?: string | null;
  model: string;
  modelVersion: string;
  promptVersion: string;
  createdAt: string;
  expiresAt: string;
};
