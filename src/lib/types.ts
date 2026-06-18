export type PublishState = "draft" | "published" | "unpublished";

export type FitCategory =
  | "strong_fit"
  | "partial_fit"
  | "unclear_fit"
  | "likely_mismatch"
  | "out_of_scope";

export type SourceSensitivity =
  | "public"
  | "internal"
  | "confidential"
  | "sensitive"
  | "highly_sensitive";

export type SourceVisibility =
  | "private"
  | "private_supported"
  | "public_candidate"
  | "public";

export type EvidenceStrength = "owner_asserted" | "weak" | "moderate" | "strong";

export type ClaimApprovalStatus = "draft" | "needs_context" | "approved" | "rejected" | "archived";

export type SourceRoot = {
  id: string;
  schemaVersion: number;
  tenantId: string;
  connectorId: string;
  displayName: string;
  rootUri: string;
  status: "active" | "paused" | "archived";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type SourceItem = {
  id: string;
  schemaVersion: number;
  tenantId: string;
  connectorInstallId: string;
  connectorId: string;
  sourceType: "file" | "google_workspace_pointer";
  externalId: string;
  externalUrl: string;
  title: string;
  mimeType: string;
  parents: string[];
  resolvedPath: string;
  ownerAtSource: string;
  createdAtSource: string | null;
  modifiedAtSource: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  lastFetchedAt: string | null;
  lastParsedAt: string | null;
  currentVersionId: string | null;
  refreshPolicy: "manual" | "scheduled";
  processingStatus: "discovered" | "parsed" | "skipped" | "failed";
  visibilityDefault: SourceVisibility;
  sensitivityDefault: SourceSensitivity;
  rightsStatus: "owner_provided" | "unknown" | "restricted";
  deletedAtSource: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type SourceVersion = {
  id: string;
  schemaVersion: number;
  tenantId: string;
  sourceItemId: string;
  connectorInstallId: string;
  versionKey: string;
  contentHash: string;
  sourceModifiedAt: string | null;
  fetchedAt: string;
  originalStoragePath: string;
  exportedStoragePaths: string[];
  parser: string;
  parserVersion: string;
  parseStatus: "parsed" | "skipped" | "failed";
  classificationStatus: "classified" | "skipped" | "failed";
  embeddingStatus: "not_started" | "skipped" | "embedded" | "failed";
  extractionStatus: "not_started" | "extracted" | "failed";
  supersededByVersionId: string | null;
  documentFamily: string;
  sensitivity: SourceSensitivity;
  visibility: SourceVisibility;
  wordCount: number;
  errorSummary: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type SourceChunk = {
  id: string;
  schemaVersion: number;
  tenantId: string;
  sourceItemId: string;
  sourceVersionId: string;
  chunkType: "text";
  text: string;
  contentHash: string;
  pageNumber: number | null;
  spanStart: number;
  spanEnd: number;
  parser: string;
  parserVersion: string;
  sensitivity: SourceSensitivity;
  visibility: SourceVisibility;
  rightsStatus: "owner_provided" | "unknown" | "restricted";
  tokenEstimate: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

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
  proposedByAgentRunId: string | null;
  evidenceStrength: EvidenceStrength;
  evidenceSummary: string;
  sourceVersionIds: string[];
  chunkContentHashes: string[];
  relatedEntityIds: string[];
  relatedRelationshipIds: string[];
  approvalStatus: ClaimApprovalStatus;
  visibility: SourceVisibility;
  sensitivity: SourceSensitivity;
  publishState: PublishState;
  staleStatus: "current" | "stale";
  model?: string;
  modelVersion?: string;
  promptVersion?: string;
  agentRunId?: string | null;
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
