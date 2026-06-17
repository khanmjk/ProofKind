# ProofKind Pre-Build Architecture Risk Review

Status: build-readiness review  
Date: 2026-06-16  
Related: [Product Vision](./productVision.md), [Technical Architecture](./technicalArchitecturePlan.md), [Canonical Data Model](./canonicalDataModel.md), [Data Ingestion Architecture](./dataIngestionArchitecture.md), [Connector And Multi-Tenant Architecture](./connectorMultiTenantArchitecture.md), [Second Opinion Review](./secondOpinionReview.md), [Stack Diagram](./architectureStackDiagram.md)

## Verdict

ProofKind is close enough to start building, but not from the UI inward.

The build should start with the tenant-safety spine plus the smallest public validation slice:

```text
tenant registry
  -> TenantScopedRepository
  -> publicProfiles materialization model
  -> allow-list public serializer
  -> hand-approved public claims
  -> public profile
  -> visitor fit advisor
  -> retrieval boundary tests
```

The biggest backtrack risk is not the product vision. It is either building a single-user, happy-path prototype that later needs tenancy retrofitted, or overcorrecting into a connector platform before the public profile and fit-advisor value is tested.

After Claude's second-opinion review, the position is:

```text
Proceed with changes.
Keep multi-tenancy from day one.
Build a thin product slice on top of the tenant-safe spine.
```

We reject the recommendation to skip the multi-tenant spine. We accept the recommendation to validate the public fit-advisor and profile experience earlier.

## Must Fix Before The Relevant Feature Lands

### 1. Pin Embedding Configuration

Embedding model, dimension, distance measure, and normalization are one-way-door choices.

Decision:

- Pin the embedding model before the first indexed corpus.
- Use a Firestore-supported output dimension, likely `768` unless a retrieval spike proves otherwise.
- Use one distance measure and normalization rule consistently.
- Store `embeddingModel`, `embeddingModelVersion`, `embeddingDim`, `embeddingDistance`, `embeddingNormalized`, and `embeddingVersion` on every embedded chunk.

Backtrack risk if ignored:

- Re-indexing fails or mixed-dimension embeddings force a full re-embed.

### 2. Define The Public Generation Boundary

Public retrieval isolation is not enough. Public text can leak private facts if an LLM drafts it from private context.

Decision:

- Public profile text must be hand-authored, owner-authored, or generated only from already approved public-safe evidence.
- Private-context generated text can be a draft suggestion, but not final public copy.
- Public fit chat uses only materialized public profile data.

Backtrack risk if ignored:

- Private psychometrics, feedback, client-sensitive work, or rejected claims get paraphrased into approved public text.

### 3. Implement TenantScopedRepository

Firestore Security Rules do not protect backend Admin SDK code. Tenant isolation must be structural.

Decision:

- Use a `TenantScopedRepository` for all server-side Firestore and Storage access.
- Ban raw `db.collection()` and raw Storage path access outside repository modules.
- Route vector search through a single tenant/visibility-scoped retriever.
- Post-assert tenant and visibility on returned private documents.

Backtrack risk if ignored:

- One missing tenant filter leaks data across users.

### 4. Make Authority Fields Server-Computed

Prompt injection can influence model output values even when JSON shape is valid.

Decision:

- The model can propose claim text, evidence links, and rationale.
- The server computes `approvalStatus`, `visibility`, `publishState`, and gating confidence.
- `approve`, `publish`, and `setVisibility` are human UI actions only.

Backtrack risk if ignored:

- Malicious source text can push claims toward public/approved states.

### 5. Add A Durable Task Queue

Current docs include Cloud Scheduler and Cloud Run Jobs, but Drive ingestion, parsing, embedding, refresh, retries, and per-file rate limits need a real queue.

Decision:

- Add **Cloud Tasks** to the v1 stack.
- Keep Cloud Scheduler for periodic refresh triggers.
- Use Cloud Tasks for per-source, per-file, per-version work dispatch.
- Use Cloud Run service workers to execute normal per-file tasks.
- Use Cloud Run Jobs only for bulk backfills and controlled reprocessing.

Why:

- A Drive folder can contain hundreds or thousands of files.
- A single ingestion run needs retries, backoff, rate limiting, idempotency, and progress tracking.
- Cloud Tasks is designed to dispatch queued work reliably to workers. Source: [Cloud Tasks queues](https://docs.cloud.google.com/tasks/docs/creating-queues), [Firebase task queue functions](https://firebase.google.com/docs/functions/task-functions).

Backtrack risk if ignored:

- Ingestion code becomes a brittle long-running script.
- Reprocessing and retries become unsafe.
- One failed file can poison an entire sync run.

### 6. Define Idempotency Before Building Ingestion

Every ingestion task must be safe to retry.

Use two concepts:

```text
workIdentity:
tenantId
connectorInstallId
sourceItemId
sourceVersionId
contentHash
taskType

processingVersion:
parserVersion
embeddingModelVersion
extractionPromptVersion
schemaVersion
```

Cloud Tasks task names are not the durable idempotency ledger. Store processed task records in Firestore transactionally.

Backtrack risk if ignored:

- Duplicate chunks, duplicate embeddings, duplicate claims, and inconsistent source histories.

### 7. Finalize Token Storage

Connector installs need OAuth tokens and refresh tokens. The docs say not to store tokens directly in Firestore, but the implementation choice must be explicit before building connectors.

Recommended v1:

- Store connector auth records in a dedicated encrypted credential store.
- Keep only `authRef` in Firestore.
- Use Secret Manager for low-volume founder/beta use.
- Revisit envelope encryption with Cloud KMS if per-user Secret Manager operational cost becomes awkward.

Backtrack risk if ignored:

- Tokens leak into Firestore exports, logs, prompts, or admin screens.

### 8. Lock Firestore Vector Index Shape

The docs use tenant subcollections. That is fine only if the vector retrieval implementation is validated early with tenant and visibility filters.

Validation spike:

- create a small Firestore vector dataset across two tenants
- test private retrieval with `tenantId`
- test public retrieval with only `publicProfiles/{slug}`
- test collection group indexing if using nested subcollections
- prove no cross-tenant retrieval under adversarial prompts

Backtrack risk if ignored:

- Discovering late that the chosen Firestore layout makes vector search/indexing awkward.

### 9. Add Relationship/Graph Edge Collections

The current model has sources, chunks, claims, and evidence. That is not enough for the professional identity graph.

Add first-class relationship records:

```text
tenants/{tenantId}/entities/{entityId}
tenants/{tenantId}/entityAliases/{aliasId}
tenants/{tenantId}/relationships/{relationshipId}
tenants/{tenantId}/timelineEvents/{eventId}
```

Relationship examples:

- person worked_at company
- person worked_on product
- product belongs_to company
- claim supported_by sourceVersion
- skill demonstrated_by project
- project occurred_during role
- blog_post discusses theme
- CV_version targets role_type

Backtrack risk if ignored:

- The app becomes a bag of chunks and claims instead of an evidence graph.
- Timeline reconstruction, contradiction detection, and "what from my past helps this problem?" become weak.

### 10. Define Derived Data Lineage

Deletion cannot mean "delete the file." Derived data must be traced.

Every generated artifact needs lineage:

```text
sourceVersionIds
chunkIds
claimIds
model
promptVersion
parserVersion
createdAt
visibility
approvalStatus
staleStatus
```

Backtrack risk if ignored:

- You cannot safely delete, export, refresh, or explain generated claims.

### 11. Decide Region And Environment Strategy

Firebase/Firestore location choices can be painful to move later.

Required before project creation:

- choose dev/stage/prod Firebase projects
- choose Firestore location deliberately
- decide whether v1 uses regional or multi-region
- document backup/export plan

Backtrack risk if ignored:

- Production data ends up in a throwaway project or wrong region.
- Migration becomes manual and risky.

### 12. Build Security Tests Before Public Chat

The architecture says the boundaries are strict. They need executable tests.

Minimum tests:

- Tenant A cannot read Tenant B Firestore docs.
- Tenant A cannot access Tenant B Storage paths.
- Owner private chat cannot retrieve another tenant's chunks.
- Public visitor chat cannot retrieve private chunks.
- Public visitor chat cannot call connector inventory or fetch tools.
- The LLM cannot override `tenantId`, `uid`, tool list, Firestore path, Storage path, or visibility.

Backtrack risk if ignored:

- A visually impressive demo with an unprovable data boundary.

### 13. Create Prompt, Tool, And Schema Versioning

Prompts are production code in this product.

Version:

- extraction prompts
- classification prompts
- gap interview prompts
- public fit prompts
- structured output schemas
- model choices
- eval datasets

Backtrack risk if ignored:

- Regeneration becomes non-repeatable.
- Claim drift is impossible to explain.

### 14. Define Tenant Quotas

Agentic ingestion can burn money quickly.

Track by tenant:

- source count
- file bytes
- parsed bytes
- embedding calls
- model input/output tokens
- public chat sessions
- refresh frequency
- active connector installs
- failed job retries

Backtrack risk if ignored:

- One user or bad connector can create unexpected cost.

### 15. Define Public Materialization Serializer

Public profile documents must be projected through an allow-list serializer.

Rules:

- Never object-spread private claim/source/chunk documents into public collections.
- Public collections use distinct names such as `publicClaims`, `publicSections`, and `publicArtifactSummaries`.
- Public claims keep backrefs to private source claims and source versions.
- Source deletion or broken lineage suppresses affected public claims before owner review.

Backtrack risk if ignored:

- Private IDs, Drive links, Storage paths, or source metadata leak into anonymous public documents.

### 16. Add Safety Evals Before Public Chat

Public chat must ship behind an eval gate.

Minimum suites:

- private-vs-public leak tests
- prompt-injection regurgitation tests
- unsupported-claim tests
- refusal/jailbreak tests
- defamation/protected-trait output checks

Backtrack risk if ignored:

- The public fit advisor becomes a trust and liability surface before the safety boundary is executable.

### 17. Add Spend Caps And Kill Switches

Cost controls must be implemented, not just documented.

Required:

- Google Cloud budget alert around `$20`.
- Project spend cap or equivalent provider cap where available.
- Public endpoint kill switch if spend exceeds a hard threshold.
- Model-pinning ADR.
- Logging retention and exclusion policy.

Backtrack risk if ignored:

- Anonymous public chat, ingestion retries, or model drift exceed the intended frugal budget.

## Should Decide Soon, But Not Blocking Day One

### Public Profile Access Model

Decide whether profiles support:

- public slug
- unlisted link
- expiring link
- password-protected link
- disabled public chat
- disabled public artifact display

This can be modeled now and implemented later.

### Legal/Compliance Review

Before onboarding real external users, ProofKind needs:

- privacy policy
- terms of use
- connector data-use language
- delete/export policy
- AI limitation disclosures
- psychometric data handling policy
- hiring/recruiting non-decisioning language

Do not wait until recruiter workflows exist.

### Admin And Support Boundary

Decide whether a ProofKind admin can ever inspect private tenant content.

Recommended default:

```text
admin metadata access by default
private content access only through explicit tenant-granted support session
```

### Backup And Disaster Recovery

Define:

- Firestore export cadence
- Storage lifecycle policy
- deleted-source retention window
- tenant export format
- restore test cadence

### Observability

Add structured logs for:

- connector calls
- AI tool calls
- retrieval calls
- public chat refusals
- source processing failures
- tenant quota usage
- publish events
- deletion/export events

## Biggest Architecture Trap

The dangerous path is:

```text
build chat UI
  -> connect Drive
  -> dump chunks into vector search
  -> ask Gemini questions
  -> later try to add tenancy, connectors, approvals, and deletion
```

That would work as a demo and fail as a platform.

The correct path is:

```text
tenant-safety spine
  -> hand-approved public claims
  -> public profile + visitor fit advisor
  -> manual private corpus
  -> source registry + parsing + private retrieval
  -> extraction + approval automation
  -> connector runtime + scheduled refresh
```

## Build Readiness Checklist

Start implementation with the Phase 1 tenant-safety spine and public validation slice.

Phase 1 must include:

- tenant registry
- membership model
- TenantScopedRepository
- canonical data model
- public profile materialization model
- public materialization allow-list serializer
- public generation boundary
- server-computed authority fields
- hand-approved public claims
- public profile page
- public fit advisor over approved public claims only
- public/profile retriever endpoint separated from any owner/private retriever
- cross-tenant tests
- private-vs-public leak evals
- minimal prompt/tool/schema/model versioning for public fit flow
- tenant quota counters
- spend cap and public endpoint kill switch
- region/environment decision

Phase 2+ ingestion and connector spine must include before the first connected corpus:

- connector registry
- tenant connector installs
- policy-aware tool broker for connector tools
- Cloud Tasks queue design
- Cloud Run service worker pattern
- idempotency ledger with work identity and processing version
- encrypted connector credential storage decision
- source/version/chunk schema
- entity/relationship schema
- embedding model/dimension/distance/normalization decision before indexing
- owner/private retriever and public/profile retriever separation
- deletion lineage and source revocation behavior

## Final Call

Yes, we can start building. The first sprint should be a tenant-safe platform spine plus a thin public profile/fit-advisor slice, not a broad connector platform and not a standalone landing page.
