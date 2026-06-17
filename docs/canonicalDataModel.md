# ProofKind Canonical Data Model

Status: canonical v1 schema direction  
Date: 2026-06-16  
Related: [Technical Architecture](./technicalArchitecturePlan.md), [Data Ingestion Architecture](./dataIngestionArchitecture.md), [Connector And Multi-Tenant Architecture](./connectorMultiTenantArchitecture.md), [Second Opinion Review](./secondOpinionReview.md)

## Purpose

This document is the implementation source of truth for v1 data naming and schema direction. It also reserves names for later product areas where doing so prevents naming drift, but reserved collections are not v1 implementation scope.

Other documents describe product, architecture, and ingestion behavior. This document defines canonical collection names and fields so implementation does not drift into conflicting names such as `sources` vs `sourceItems` or `careerTimelineEvents` vs `timelineEvents`.

## Schema Rules

Every private tenant document should include:

```text
schemaVersion
tenantId
createdAt
updatedAt
createdBy
updatedBy
```

Field lists below focus on domain-specific fields. The shared metadata fields above still apply even when not repeated in every collection section.

Every derived AI document should also include:

```text
model
modelVersion
promptVersion
schemaVersion
agentRunId
sourceVersionIds
chunkContentHashes
lineageStatus
staleStatus
```

Authority fields are server-computed:

```text
approvalStatus
visibility
publishState
gatingConfidence
```

The model can propose values and rationale, but the server decides authority.

## Private Tenant Root

```text
tenants/{tenantId}
tenants/{tenantId}/members/{uid}
tenants/{tenantId}/profiles/{profileId}
tenants/{tenantId}/connectorInstalls/{installId}
tenants/{tenantId}/sourceRoots/{rootId}
tenants/{tenantId}/sourceItems/{sourceItemId}
tenants/{tenantId}/sourceVersions/{sourceVersionId}
tenants/{tenantId}/sourceArtifacts/{artifactId}
tenants/{tenantId}/sourceChunks/{chunkId}
tenants/{tenantId}/entities/{entityId}
tenants/{tenantId}/entityAliases/{aliasId}
tenants/{tenantId}/relationships/{relationshipId}
tenants/{tenantId}/timelineEvents/{timelineEventId}
tenants/{tenantId}/claims/{claimId}
tenants/{tenantId}/claimEvidence/{claimEvidenceId}
tenants/{tenantId}/interviewAnswers/{answerId}
tenants/{tenantId}/psychometricAssessments/{assessmentId}
tenants/{tenantId}/webResearchCandidates/{candidateId}
tenants/{tenantId}/agentSessions/{sessionId}
tenants/{tenantId}/agentRuns/{runId}
tenants/{tenantId}/syncRuns/{syncRunId}
tenants/{tenantId}/syncEvents/{syncEventId}
tenants/{tenantId}/ingestionJobs/{jobId}
tenants/{tenantId}/ingestionTasks/{taskId}
tenants/{tenantId}/processedTaskRecords/{recordId}
tenants/{tenantId}/auditEvents/{auditEventId}
tenants/{tenantId}/deletionEvents/{deletionEventId}
tenants/{tenantId}/usageLedger/{ledgerEntryId}
```

## Reserved Later-Phase Private Collections

These names are reserved for the professional memory and AI coach direction, but they are **not** v1 implementation scope. Do not build repositories, security rules, UI, or agent tools for these collections until the professional-coach surface is explicitly pulled into scope.

```text
tenants/{tenantId}/personalInsights/{insightId}
tenants/{tenantId}/feedbackReports/{reportId}
tenants/{tenantId}/reflectionEntries/{entryId}
tenants/{tenantId}/personalizationMemory/{memoryId}
tenants/{tenantId}/goals/{goalId}
tenants/{tenantId}/developmentExperiments/{experimentId}
tenants/{tenantId}/decisionJournalEntries/{entryId}
tenants/{tenantId}/opportunityEvaluations/{evaluationId}
tenants/{tenantId}/coachingSessions/{sessionId}
```

Until then, journals, performance reviews, feedback files, and decision notes can enter the system as `sourceItems` and `sourceVersions` with sensitive classifications, not as dedicated coach-domain records.

## Public Profile Root

Public data is materialized separately and must contain no private source paths or raw private content.

```text
publicProfiles/{slug}
publicProfiles/{slug}/publicClaims/{publicClaimId}
publicProfiles/{slug}/publicArtifactSummaries/{artifactId}
publicProfiles/{slug}/publicSections/{sectionId}
publicProfiles/{slug}/publicFitSessions/{sessionId}
```

Use distinct public collection IDs such as `publicClaims`, not the same `claims` collection ID, to reduce accidental collection-group rule/query overlap.

## Connector Definition

```text
connectorDefinitions/{connectorId}
  schemaVersion
  id
  displayName
  provider
  version
  adapterType
  authType
  deliveryModel: poll | webhook | hybrid | manual
  verificationTier: none | oauth_sensitive | oauth_restricted | casa_required
  supportedSourceTypes
  capabilities
  requiredScopes
  optionalScopes
  refreshModes
  webhookSupport
  parserHints
  riskLevel
  defaultVisibility
  tenantInstallAllowed
  enabled
```

## Connector Install

```text
tenants/{tenantId}/connectorInstalls/{installId}
  schemaVersion
  tenantId
  connectorId
  installedByUid
  status: active | paused | revoked | needs_reauth | error
  authType
  authRef
  tokenExpiresAt
  scopesGranted
  selectedRoots
  syncCursors
  refreshPolicy
  deliveryModel
  webhookState
  revocationGeneration
  rateLimitState
  lastSyncAt
  lastError
  createdAt
  revokedAt
```

For Google Drive, `syncCursors` should be a map keyed by Drive context, such as `myDrive` and shared drive IDs.

## Source Item

Represents a stable external item across versions.

```text
tenants/{tenantId}/sourceItems/{sourceItemId}
  schemaVersion
  tenantId
  connectorInstallId
  connectorId
  sourceType
  externalId
  externalUrl
  title
  mimeType
  parents
  resolvedPath
  ownerAtSource
  createdAtSource
  modifiedAtSource
  firstSeenAt
  lastSeenAt
  lastFetchedAt
  lastParsedAt
  currentVersionId
  refreshPolicy
  processingStatus
  visibilityDefault
  sensitivityDefault
  rightsStatus
  deletedAtSource
```

## Source Version

Represents one content version of a source item.

```text
tenants/{tenantId}/sourceVersions/{sourceVersionId}
  schemaVersion
  tenantId
  sourceItemId
  connectorInstallId
  versionKey
  contentHash
  sourceModifiedAt
  fetchedAt
  originalStoragePath
  exportedStoragePaths
  parser
  parserVersion
  parseStatus
  classificationStatus
  embeddingStatus
  extractionStatus
  supersededByVersionId
```

## Source Chunk

Represents bounded parsed content suitable for retrieval and evidence.

```text
tenants/{tenantId}/sourceChunks/{chunkId}
  schemaVersion
  tenantId
  sourceItemId
  sourceVersionId
  chunkType
  text
  contentHash
  pageNumber
  spanStart
  spanEnd
  parser
  parserVersion
  sensitivity
  visibility
  rightsStatus
  embedding
  embeddingModel
  embeddingModelVersion
  embeddingDim
  embeddingDistance
  embeddingNormalized
  embeddingVersion
```

## Entity

Represents people, companies, products, projects, skills, themes, roles, credentials, domains, and opportunities.

```text
tenants/{tenantId}/entities/{entityId}
  schemaVersion
  tenantId
  createdAt
  updatedAt
  createdBy
  updatedBy
  entityType
  canonicalName
  description
  confidence
  status
  sourceVersionIds
  createdByAgentRunId
```

## Entity Alias

```text
tenants/{tenantId}/entityAliases/{aliasId}
  schemaVersion
  tenantId
  entityId
  aliasText
  aliasType
  sourceVersionIds
  confidence
```

## Relationship

Relationships are first-class edge documents, not embedded arrays.

```text
tenants/{tenantId}/relationships/{relationshipId}
  schemaVersion
  tenantId
  subjectEntityId
  predicate
  objectEntityId
  qualifier
  startDate
  endDate
  sourceVersionIds
  claimIds
  confidence
  status
```

Example predicates:

```text
worked_at
worked_on
belongs_to
demonstrates
supports
contradicts
occurred_during
discusses
targets
```

## Timeline Event

Use `timelineEvents` as the canonical collection name.

```text
tenants/{tenantId}/timelineEvents/{timelineEventId}
  schemaVersion
  tenantId
  eventType
  title
  description
  startDate
  endDate
  entityIds
  sourceVersionIds
  claimIds
  confidence
  contradictionStatus
```

## Claim

```text
tenants/{tenantId}/claims/{claimId}
  schemaVersion
  tenantId
  claimText
  claimType
  proposedByAgentRunId
  evidenceStrength
  evidenceSummary
  sourceVersionIds
  chunkContentHashes
  relatedEntityIds
  relatedRelationshipIds
  graphContext
  approvalStatus: draft | needs_context | approved | rejected | archived
  visibility: private | private_supported | public_candidate | public
  sensitivity
  publishState
  staleStatus
  createdAt
  updatedAt
```

`approvalStatus`, `visibility`, `publishState`, and gating confidence are server-computed or human-set, not model-authoritative.

## Claim Evidence

```text
tenants/{tenantId}/claimEvidence/{claimEvidenceId}
  schemaVersion
  tenantId
  claimId
  sourceItemId
  sourceVersionId
  chunkId
  chunkContentHash
  evidenceStrength
  evidenceNote
  contradictionFlag
```

## Interview Answer

Gap interview answers are first-class owner evidence.

```text
tenants/{tenantId}/interviewAnswers/{answerId}
  schemaVersion
  tenantId
  questionText
  answerText
  relatedClaimIds
  relatedEntityIds
  sensitivity
  visibility
  createdByUid
  createdAt
```

## Public Claim

Public claim documents are materialized through an allow-list serializer.

```text
publicProfiles/{slug}/publicClaims/{publicClaimId}
  schemaVersion
  slug
  publicProfileId
  owningTenantId
  sourcePrivateClaimId
  approvedPublicText
  claimType
  publicEvidenceSummary
  publicCitationRefs
  sourceVersionIds
  visibility: public
  staleStatus
  approvedByUid
  approvedAt
```

Never copy private claim objects into public documents by object spread. Public materialization must allow-list fields.

## Processed Task Record

```text
tenants/{tenantId}/processedTaskRecords/{recordId}
  schemaVersion
  tenantId
  workIdentityHash
  processingVersionHash
  taskType
  sourceItemId
  sourceVersionId
  status: started | completed | failed | skipped
  attempts
  startedAt
  completedAt
  errorSummary
```

## Deletion Event

```text
tenants/{tenantId}/deletionEvents/{deletionEventId}
  schemaVersion
  tenantId
  requestedByUid
  deletionScope
  targetIds
  affectedSourceVersionIds
  affectedClaimIds
  affectedPublicClaimIds
  status
  requestedAt
  completedAt
```

Deletion should fail safe: public claims with broken source lineage should be suppressed before owner review.

## Migration Trigger

Firestore remains the v1 store. Consider Cloud SQL/Postgres plus pgvector only when one of these is true:

- contradiction detection requires repeated full scans
- relationship traversal needs complex anti-joins or multi-hop querying
- Firestore index count/cost becomes a real bottleneck
- materialized graph views become harder to maintain than a relational graph model

Until then, keep extraction outputs storage-neutral so a future migration is a re-import, not a re-model.
