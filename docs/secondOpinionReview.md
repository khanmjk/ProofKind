# ProofKind Second Opinion Review

Status: processed Claude review and ProofKind response  
Date: 2026-06-16  
Source: Claude second-opinion review shared by the owner  
Related: [Pre-Build Architecture Review](./preBuildArchitectureReview.md), [Technical Architecture](./technicalArchitecturePlan.md), [Data Ingestion Architecture](./dataIngestionArchitecture.md), [Connector And Multi-Tenant Architecture](./connectorMultiTenantArchitecture.md)

## 2026-06-18 Scope Note

This review is retained as historical adversarial input. Its recommendation to build a hand-approved public profile slice before ingestion is now superseded by the founder's explicit Phase 1 priority: prove ingestion-to-profile-generation from real source evidence. The multi-tenant spine, public/private boundary, allow-list public materialization, and leak-risk warnings still stand.

## Executive Verdict

Claude's final call was:

```text
Proceed with changes.
```

I agree with that verdict.

I do **not** accept Claude's recommendation to avoid a multi-tenant platform spine from day one. ProofKind should remain tenant-scoped from the start. The founder MVP can have one personal tenant, but the data model, storage layout, tool broker, retrieval boundaries, and connector installs must be built as multi-tenant primitives now. Retrofitting that later would be more expensive and riskier than doing it correctly at the beginning.

The adjusted build principle is:

```text
solid tenant-safe platform spine
  + thin vertical product slice
  + no speculative connector breadth
```

So the correction is not "skip the spine." The correction is "build the minimum spine that prevents rewrites, then validate the public profile/fit-advisor quickly."

## What Claude Got Right

### 1. Public Text Generation Is A Bigger Leak Risk Than Retrieval

Claude correctly identified a subtle issue:

```text
public retriever over approved corpus is not enough
if approved public text was drafted from private context.
```

If a model sees psychometrics, journals, client-sensitive work, rejected claims, or private feedback, it can paraphrase those details into a public claim. Owner approval helps, but it is not a technical boundary.

Decision:

- Public-facing text generation must not run over raw private corpus.
- Public profile generation should use either hand-authored/owner-authored claims or a public-safe generation flow over already approved evidence.
- Private-context generated wording can be used only as a draft suggestion for the owner, and must be re-generated or sanitized through a public-only approval flow before publication.

### 2. Embedding Configuration Is A One-Way Door

Claude flagged that Gemini embedding defaults may exceed Firestore Vector Search dimensions. Whether the exact default changes over time, the architecture point is correct: embedding model, dimension, distance measure, and normalization are schema-level choices.

Decision:

- Pin embedding model and output dimension before first indexing.
- Store `embeddingModel`, `embeddingDim`, `embeddingDistance`, `embeddingNormalized`, and `embeddingVersion` on every embedded chunk.
- Prefer one canonical v1 dimension, likely `768`, unless a retrieval spike proves a higher dimension is worth the cost.
- Re-embedding must be an explicit migration/backfill, never an accidental side effect.

### 3. Admin SDK Isolation Needs A Structural Guardrail

Claude correctly challenged "the broker enforces tenancy" as too weak by itself. Backend SDKs bypass Firestore Security Rules, so raw server queries are dangerous.

Decision:

- Build a `TenantScopedRepository` abstraction from sprint 1.
- Ban raw Firestore access outside repository modules.
- All server-side reads/writes must derive `tenantId` from authenticated context, not model input.
- Vector retrieval must route through one tenant/visibility-scoped chokepoint.
- Returned documents must be post-asserted against expected `tenantId` and visibility.

### 4. Model-Set Authority Fields Are Unsafe

Claude correctly pointed out that structured output only constrains shape, not truth or authority. Prompt injection can still influence values like `confidence`, `visibility`, or `approvalStatus`.

Decision:

- The model can propose content, evidence links, and rationale.
- The server computes authority fields such as `approvalStatus`, `visibility`, `publishState`, and any gating confidence.
- `approve`, `publish`, and `setVisibility` are human UI actions, not agent tools.

### 5. Cloud Tasks Should Target Cloud Run Services For Per-File Work

Claude correctly corrected our wording. Cloud Tasks is good for per-file dispatch, but per-file Cloud Tasks should call a Cloud Run **service** endpoint, not a Cloud Run **job** as the normal execution unit.

Decision:

- Cloud Tasks dispatches per-source/per-file/per-version tasks to Cloud Run services.
- Cloud Run Jobs are reserved for bulk backfills or long batch operations.
- Cloud Tasks task names are not the durable idempotency ledger.
- Firestore stores processed task records transactionally.

### 6. Drive OAuth Verification Can Reshape Beta Scope

Claude correctly sharpened the Google Drive issue:

- Broad Drive access is a restricted OAuth scope.
- Public SaaS use may require Google verification/security assessment.
- Testing-mode refresh token behavior can make long-lived automated refresh unreliable for external test users.

Decision:

- Founder/personal MVP may use Drive in testing/internal mode.
- Public beta must treat Google Drive recursive sync as a gated connector with a `verificationTier`.
- Manual upload and export/import remain necessary fallback paths.

### 7. Canonical Schema Drift Must Be Fixed

Claude correctly observed that the docs had overlapping names and partial field lists.

Decision:

- Create a canonical data model doc before implementation.
- Use `sourceItems`, `sourceVersions`, `sourceChunks`, `entities`, `entityAliases`, `relationships`, `timelineEvents`, `claims`, and `claimEvidence` consistently.
- Every document should include `schemaVersion`.

### 8. Public Fit Advisor Needs Spend, Abuse, And Liability Boundaries

Claude correctly flagged anonymous public chat as both a cost surface and a write/injection surface.

Decision:

- Public fit chat must be rate-limited.
- Use App Check and bot protection before beta.
- Never allow URL Context, web grounding, connector inventory, or private retrieval in public visitor mode.
- Add TTL to public fit sessions.
- Treat visitor messages as untrusted content.

## What We Reject Or Modify

### Rejected: "Do Not Build Multi-Tenancy From Day One"

We reject this recommendation.

Reason:

- ProofKind's safety model depends on tenant boundaries.
- The data model, storage paths, tool broker, retrieval scopes, and connector installs are much harder to retrofit later.
- Building tenant-safe primitives early does not mean building enterprise features, teams, billing, or dozens of connectors.

Modified decision:

```text
Build multi-tenancy as a foundation.
Do not build multi-tenant SaaS features yet.
```

Keep:

- `tenants/{tenantId}` data layout
- tenant-prefixed storage
- tenant membership
- tenant-scoped repositories
- tenant-scoped connector installs
- tenant-scoped usage ledger
- cross-tenant security tests

Defer:

- team roles beyond owner
- enterprise tenants
- billing plans
- admin support workflows
- broad connector catalog
- marketplace/recruiter features

### Modified: "Ship Hand-Authored Public Fit Advisor First"

The concept is useful, but it should sit on the spine rather than replace the spine.

Decision:

- Sprint 1 builds the tenant-safe platform skeleton plus a thin public profile/fit-advisor slice.
- The first public fit advisor can use 30-60 hand-approved public claims in `publicProfiles/{slug}` with no vector search.
- This validates visitor behavior early while preserving the correct architecture.

### Modified: "Cut Cloud Tasks From V1"

We reject cutting Cloud Tasks entirely.

Reason:

- It is part of the ingestion spine and prevents brittle long-running scripts.

Modification:

- Use Cloud Tasks only for the first real ingestion pipeline, not for the hand-authored public profile slice.

### Modified: "Cut Connector Registry From V1"

We keep the connector registry, but keep it small.

V1 connector definitions:

- `manual-upload`
- `google-drive`
- `blogger`
- `linkedin-export`
- `public-web-research`

The adapter contract must be implemented against at least two different connector shapes before generalizing further:

- manual upload
- Google Drive

## Accepted Fixes Before Sprint 1

These are now sprint-1 architectural requirements:

1. Canonical data model.
2. Tenant-scoped repository abstraction.
3. Public/private generation boundary.
4. Server-computed authority fields.
5. Public materialization serializer with allow-list, never object spread.
6. Prompt/tool/schema/model versioning for the public fit flow.
7. Private-vs-public leak tests before any public chat.
8. Project spend cap and public endpoint kill switch.
9. Region/environment decision before Firebase project creation.

## Accepted Fixes Before First Ingestion Pipeline

These are required before manual/Drive corpus ingestion, not before the hand-approved public profile slice:

1. Embedding config pinned before indexing.
2. Cloud Tasks to Cloud Run Service worker pattern documented.
3. Idempotency ledger split into work identity and processing version.
4. Source/version/chunk schema implemented through the canonical model.
5. Deletion lineage and source revocation behavior.

## Accepted Fixes Before Beta

These are not required for the first local/founder slice but are required before outside users:

1. Google OAuth verification/CASA plan for Drive if recursive Drive sync is offered publicly.
2. Privacy policy and terms.
3. POPIA/GDPR data handling and residency review.
4. Employer/client IP and NDA handling policy.
5. Owner identity verification posture.
6. Fit-advisor liability disclaimer and moderation path.
7. Account recovery and ownership re-binding.
8. Offboarding and export policy.
9. Admin/support access boundary.
10. Abuse controls for anonymous chat.

## Updated Build Sequence

The build sequence should now be:

```text
Sprint 1:
  tenant registry
  TenantScopedRepository
  canonical schema
  publicProfiles materialization model
  minimal policy-aware tool broker
  hand-approved public claims
  public profile page
  public fit advisor over approved claims only
  private-vs-public leak eval

Sprint 2:
  manual upload/import flow
  source registry and source versioning
  Cloud Storage tenant paths
  parser route
  private chunks
  embeddings and private retrieval
  owner private workbench

Sprint 3:
  claim extraction
  evidence graph
  approval UI
  public materialization serializer

Sprint 4:
  Google Drive connector in founder/testing mode
  Cloud Tasks ingestion worker
  idempotency ledger
  scheduled refresh and sync cursors
```

This keeps the architecture spine, but tests the visitor thesis earlier.

## Follow-Up Reconciliation

Claude's follow-up review correctly identified that the architecture language had been tightened, but the phase plan still front-loaded the ingestion and connector platform.

Decision:

- Phase 1 is the tenant-safety spine plus a thin public profile and visitor fit-advisor slice.
- Phase 1 does not require Cloud Tasks, connector installs, Drive sync, durable ingestion workers, vector search, or extraction automation.
- Phase 2+ adds manual corpus ingestion and owner private workbench.
- Phase 4+ adds the full connector ingestion spine.
- Professional-memory and coaching collections are reserved for later phases and must not be implemented as v1 repositories, security rules, or UI until that product surface is explicitly pulled into scope.

## Final Decision

Proceed with changes.

The architecture remains directionally sound. Claude's review improves it by forcing sharper boundaries around generation safety, embedding/index config, server-side tenant enforcement, task dispatch mechanics, and canonical schema. The only major strategic disagreement is build philosophy: ProofKind should still be multi-tenant from day one, but the first product slice should remain thin enough to validate quickly.
