# ProofKind Build Implementation Plan

Status: scope pivot accepted
Date: 2026-06-18
Owner: ProofKind founder  
Primary scope: Phase 1 AI-maintained professional profile engine
Related docs:

- [Product Vision](../productVision.md)
- [Technical Architecture Plan](../technicalArchitecturePlan.md)
- [Data Ingestion Architecture](../dataIngestionArchitecture.md)
- [Connector And Multi-Tenant Architecture](../connectorMultiTenantArchitecture.md)
- [Canonical Data Model](../canonicalDataModel.md)
- [Pre-Build Architecture Review](../preBuildArchitectureReview.md)

## Scope Pivot

The previous Claude-reviewed plan optimized Phase 1 around a hand-approved public profile and fit advisor. That was architecturally safe, but it does not prove the founder's main thesis.

The founder's priority is now explicit:

```text
approved data sources
  -> ingestion
  -> parsing/classification/chunking
  -> AI synthesis
  -> evidence-backed generated profile
  -> owner publish/review boundary
  -> public ProofKind profile and fit advisor
```

The goal is not primarily to test market fit in Phase 1. The goal is to prove that ProofKind can maintain a professional profile from real source evidence across multiple data streams.

## Phase 1 Product Thesis

ProofKind is valuable if it can turn scattered professional evidence into a living profile without the owner manually writing the profile from scratch.

The MVP must demonstrate:

- ingestion of owner-approved professional source folders
- parsing of common document formats
- classification of source type, sensitivity, and public-use risk
- chunking and lineage preservation
- AI generation of profile sections and public-safe claims
- generated claims linked back to source versions/chunks
- owner-triggered publication into a separate public profile surface
- public fit advisor constrained to materialized public claims only

Manual content seeds are acceptable only as test fixtures. They are not the Phase 1 product path.

## Non-Negotiable Architecture Constraints

- Multi-tenancy remains in the data model from day one.
- Ingestion is tenant-scoped from the first implementation.
- The system must ingest only explicitly selected roots, not the whole Google Drive by accident.
- Private source records live under `tenants/{tenantId}/**`.
- Public profile records live under `publicProfiles/{slug}/**`.
- Public materialization is still allow-list based; generated private claims are never object-spread into public documents.
- AI can propose claims, sections, and questions, but server code owns `tenantId`, paths, visibility, approval status, publish state, and public materialization.
- Sensitive evidence such as psychometrics, journals, feedback, identity documents, family, finance, legal, medical, salary, and client-confidential material is private by default.
- Public generation may summarize sensitive evidence only into owner-safe professional themes and must not expose raw private details.
- Public visitors never access source chunks, source paths, private claims, draft claims, or connector tools.
- The first ingestion implementation may run as CLI scripts, but the schema and repository boundary must match the future web/worker architecture.

## Phase 1 Success Criteria

Phase 1 is complete when:

- An approved local or mounted Google Drive folder can be ingested recursively.
- Supported files create `sourceItems`, `sourceVersions`, and `sourceChunks` under the tenant.
- Source records include parser, content hash, document family, sensitivity, visibility, and lineage metadata.
- Google Workspace pointer files are detected and recorded, with a clear note that full content requires Drive API export.
- The profile generator reads tenant chunks and produces profile sections plus evidence-backed claims.
- Generated claims include source version IDs and chunk content hashes where available.
- Generated private claims are stored under `tenants/{tenantId}/claims`.
- A user-triggered publish command materializes generated profile data into `publicProfiles/{slug}`.
- `/p/{slug}` renders the generated profile.
- The public fit advisor uses only materialized public profile data.
- Firestore rules still deny anonymous private reads and anonymous writes.
- Unit tests cover parser/chunker/classifier/synthesis safety behavior.

## Technology Defaults

| Area | Phase 1 decision |
|---|---|
| App framework | Next.js with TypeScript |
| Database | Cloud Firestore |
| Owner execution path | CLI scripts first, web owner console later |
| Initial connector | Local/mounted folder ingestion, including Google Drive Desktop folders |
| Later connector | Google Drive API export connector using OAuth and selected roots |
| Parsing | Lightweight deterministic parsers for text, HTML, PDF, DOCX, PPTX, XLSX, Google Workspace pointers |
| AI synthesis | Server-side Gemini REST adapter with deterministic fallback |
| Public profile | Existing `/p/[slug]` route over `publicProfiles/{slug}` |
| Fit advisor | Existing public-only fit advisor over approved public claims |
| Tests | Vitest, Firestore emulator rules tests, Playwright smoke tests |
| Hosting target | Firebase App Hosting once billing is linked |

## Phase 1 Data Flow

```text
npm run ingest:local -- --root <approved-folder>
  -> discover supported files
  -> parse text
  -> classify source family/sensitivity/visibility
  -> chunk text
  -> write tenant source records

npm run synthesize:profile -- --tenant founder-mjk --slug mjk
  -> read tenant source chunks
  -> generate profile candidate with Gemini or deterministic fallback
  -> write private generated claims
  -> keep public profile untouched

npm run synthesize:profile -- --tenant founder-mjk --slug mjk --publish
  -> write private generated claims
  -> materialize public profile/sections/claims
  -> enable /p/mjk
```

## Implementation Order

### 1. Ingestion Foundation

Tasks:

- Add source root, item, version, and chunk types.
- Add corpus repository methods for tenant-scoped writes and reads.
- Add recursive local folder discovery with an explicit root.
- Add max file count and max file size controls.
- Skip hidden/system folders by default.
- Detect Google Workspace pointer files from Drive Desktop.

Acceptance criteria:

- Ingestion cannot run without an explicit `--root`.
- Ingestion does not crawl the whole Drive implicitly.
- Every record carries `tenantId`.
- Source paths remain private tenant data.

### 2. Parser And Classifier

Tasks:

- Parse text, markdown, CSV, JSON, HTML, PDF, DOCX, PPTX, XLSX.
- Normalize extracted text.
- Classify source family:
  - CV/resume
  - psychometric report
  - performance/feedback
  - journal/reflection
  - public footprint
  - work sample/client document
  - general document
- Classify sensitivity and default visibility.

Acceptance criteria:

- Parsed content becomes bounded chunks.
- Empty or unsupported content is recorded as skipped/failed, not silently ignored.
- Psychometrics and journals default private/sensitive.
- CVs and public footprint documents can become public candidates but still require materialization.

### 3. Profile Synthesis

Tasks:

- Build a profile synthesis prompt over tenant chunks.
- Require JSON structured output.
- Generate:
  - display name
  - headline
  - summary
  - public profile sections
  - evidence-backed claims
  - missing-context questions
- Filter lineage so generated claims can cite only source IDs/chunk hashes that exist in the tenant corpus.
- Fall back to deterministic extractive claims if Gemini is unavailable.

Acceptance criteria:

- No Gemini key is required for local proof-of-pipeline.
- Gemini output cannot invent source IDs that survive filtering.
- Generated public-safe claims never expose raw sensitive details by design.
- Weak evidence remains modestly worded.

### 4. Materialization And Public Read Path

Tasks:

- Write generated private claims under `tenants/{tenantId}/claims`.
- Materialize public data only when the owner runs with `--publish`.
- Continue using the public profile repository for `/p/[slug]`.
- Keep public fit advisor constrained to materialized public profile data.

Acceptance criteria:

- Draft synthesis does not overwrite the public profile.
- Published synthesis replaces public sections/claims through a controlled writer.
- Anonymous clients cannot write public profile records.
- Public profile documents do not contain raw source paths or private chunks.

### 5. Tests And Evals

Tasks:

- Unit test document classification.
- Unit test chunking and content hashes.
- Unit test generated profile materialization.
- Keep existing Firestore rules tests.
- Keep existing Playwright public profile smoke tests.
- Add prompt/synthesis evals for:
  - private detail leakage
  - unsupported claims
  - missing lineage
  - psychometric raw-score leakage

Acceptance criteria:

- Build fails if generated public claims can include private-only fields.
- Build fails if Firestore rules allow anonymous private reads or public writes.
- Build fails if synthesis materialization publishes claims without public allow-listing.

## Current Known Limitations

- Google Drive Desktop `.gdoc`, `.gsheet`, and `.gslides` files are pointer files; full content requires Drive API export.
- The Phase 1 CLI can ingest local/mounted binary files now; the Drive API OAuth connector is the next connector-specific step.
- No embeddings/vector search are required for the first generation pass.
- The deterministic fallback proves the data path, not final content quality.
- Real profile quality requires carefully selected source roots and review of generated output.

## Immediate User Inputs Needed

- The approved Google Drive folder path or folder set to ingest first.
- Whether generated output may be published automatically for local MVP testing with `--publish`, or should remain draft until inspected.
- Gemini API key placement in `.env.local` when ready.
- Booking URL and interest-capture URL for the public page.

## Claude Review Prompt

Use this prompt for a second opinion:

```text
Please review the updated ProofKind Phase 1 build plan.

Context:
- ProofKind is an AI-led professional memory and profile platform.
- The founder has rejected the previous hand-curated public-profile-first MVP.
- The new Phase 1 goal is to prove ingestion-to-profile-generation: approved source folders -> parsing/classification/chunking -> AI synthesis -> generated private claims -> owner-triggered public materialization -> public profile and fit advisor.
- Multi-tenancy and public/private separation must remain from day one.
- The first ingestion path is local/mounted Google Drive folder ingestion, not broad Drive OAuth.
- Google Drive API export connector comes next because Drive Desktop `.gdoc` files are only pointers.

Review for:
1. Any architecture mistake that would make later Google Drive/Blogger/GitHub connectors hard.
2. Any privacy/security mistake in generated profile publication.
3. Whether CLI-first ingestion is acceptable for this founder MVP.
4. Whether the model/lineage design is strong enough to prove AI-maintained professional profiles.
5. Any test or eval that should block publishing generated profile claims.
```
