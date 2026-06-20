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
- [Owner Experience And Profile Generation](../ownerExperienceAndProfileGeneration.md)

## Scope Pivot

The previous Claude-reviewed plan optimized Phase 1 around a hand-approved public profile and fit advisor. That was architecturally safe, but it does not prove the founder's main thesis.

The founder's priority is now explicit:

```text
approved data sources
  -> ingestion
  -> parsing/classification/chunking
  -> knowledge graph, dynamic tags, and relationship network
  -> AI synthesis
  -> target/job-spec alignment
  -> evidence-backed generated profile and public Q&A policy
  -> owner publish/review boundary
  -> public ProofKind profile and profile assistant
```

The goal is not primarily to test market fit in Phase 1. The goal is to prove that ProofKind can maintain a professional profile from real source evidence across multiple data streams.

## Phase 1 Product Thesis

ProofKind is valuable if it can turn scattered professional evidence into a living profile without the owner manually writing the profile from scratch.

The MVP must demonstrate:

- ingestion of owner-approved professional source folders
- ingestion of owner-approved Google Drive API selected folders
- ingestion of owner-approved Blogger feeds
- parsing of common document formats
- classification of source type, sensitivity, and public-use risk
- intelligent document family handling, including CV/resume history, psychometric reports, blog content, work samples, and public footprint data
- chunking and lineage preservation
- extraction of entities and relationships across roles, companies, products, projects, skills, themes, artifacts, outcomes, and claims
- dynamic tagging inferred from content rather than only fixed taxonomies
- public research queues for extracted companies, products, and market context
- AI generation of profile sections and public-safe claims
- job-spec or advert driven target-profile generation
- AI generation of interactive profile concepts and structured public page designs
- public visitor Q&A coverage for broad profile questions, not only role fit
- generated claims linked back to source versions/chunks
- owner-triggered publication into a separate public profile surface
- owner approval of the generated profile experience before publication
- public profile assistant constrained to materialized public claims, sections, and artifact summaries only

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
- An approved Google Drive folder ID can be inventoried recursively and fetched/exported through the Drive API.
- An approved Blogger blog URL can be ingested through the public Blogger JSON feed.
- Supported files create `sourceItems`, `sourceVersions`, and `sourceChunks` under the tenant.
- Source records include parser, content hash, document family, sensitivity, visibility, and lineage metadata.
- CVs/resumes are classified as targeted career documents and used carefully as timeline/evidence signals, not treated as fully objective career truth.
- Psychometric reports are classified as sensitive private operating-style evidence by default.
- Blogger posts are classified and dynamically tagged from content, labels, dates, and extracted themes.
- Work samples are classified as private proof assets until public-safe summaries are approved.
- Extracted companies, products, roles, projects, skills, and themes are stored as reviewable entities and relationships.
- Google Workspace pointer files are detected and recorded, with a clear note that full content requires Drive API export.
- The profile generator reads tenant chunks and produces profile sections plus evidence-backed claims.
- The target-profile generator accepts a job spec or advert and maps requirements to evidence, gaps, and generated profile direction.
- The owner workspace supports chat-first iteration over generated profile content and design artifacts.
- Generated profile previews can be reviewed before publication.
- Public visitor question examples can be previewed, including overview, work history, leadership style, AI capability, recommendations, work samples, and fit.
- Generated claims include source version IDs and chunk content hashes where available.
- Generated private claims are stored under `tenants/{tenantId}/claims`.
- A user-triggered publish command materializes generated profile data into `publicProfiles/{slug}`.
- `/p/{slug}` renders the generated profile.
- The public profile assistant uses only materialized public profile data.
- Firestore rules still deny anonymous private reads and anonymous writes.
- Unit tests cover parser/chunker/classifier/synthesis safety behavior.

## Technology Defaults

| Area | Phase 1 decision |
|---|---|
| App framework | Next.js with TypeScript |
| Database | Cloud Firestore |
| Owner execution path | CLI scripts first, web owner console later |
| Initial connectors | Local/mounted folder, Google Drive API selected-folder export, Blogger public feed |
| Parsing | Lightweight deterministic parsers for text, HTML, PDF, DOCX, PPTX, XLSX, Google Workspace pointers |
| AI synthesis | Server-side Gemini REST adapter with deterministic fallback |
| Public profile | Existing `/p/[slug]` route over `publicProfiles/{slug}` |
| Owner UX direction | Chat-first workspace with generated artifacts and interactive profile previews |
| Public page generation | Structured renderer for approved profile experience; sandboxed HTML preview for iteration |
| Public profile assistant | Existing public-only answer endpoint broadened beyond fit while staying on approved public data |
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

npm run ingest:drive -- --folder-id <approved-drive-folder-id>
  -> recursively inventory only that Drive folder
  -> export Google Docs/Sheets/Slides or download binary files
  -> parse/classify/chunk
  -> write tenant source records

npm run ingest:blogger -- --blog-url <approved-blogger-url>
  -> read Blogger JSON feed
  -> parse post bodies and labels
  -> chunk as public-footprint evidence
  -> write tenant source records

npm run synthesize:profile -- --tenant founder-mjk --slug mjk
  -> read tenant source chunks
  -> extract entities, dynamic tags, and relationship candidates
  -> generate profile candidate with Gemini or deterministic fallback
  -> optionally apply target/job-spec brief
  -> write private generated claims
  -> keep public profile untouched

npm run synthesize:profile -- --tenant founder-mjk --slug mjk --publish
  -> write private generated claims
  -> materialize public profile/sections/claims
  -> enable /p/mjk public profile assistant
```

## Implementation Order

### 1. Ingestion Foundation

Tasks:

- Add source root, item, version, and chunk types.
- Add corpus repository methods for tenant-scoped writes and reads.
- Add recursive local folder discovery with an explicit root.
- Add Google Drive selected-folder recursive inventory with an explicit `--folder-id`.
- Add Blogger feed ingestion with an explicit `--blog-url`.
- Add max file count and max file size controls.
- Skip hidden/system folders by default.
- Detect Google Workspace pointer files from Drive Desktop.

Acceptance criteria:

- Local ingestion cannot run without an explicit `--root`.
- Drive ingestion cannot run without an explicit `--folder-id`.
- Blogger ingestion cannot run without an explicit `--blog-url` or test fixture file.
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
- Extract candidate entities:
  - people
  - companies
  - products
  - roles
  - projects
  - skills
  - themes
  - artifacts
- Extract candidate relationships:
  - person worked at company
  - person worked on product/project
  - source supports claim
  - blog post expresses theme
  - psychometric report informs operating-style theme
  - public research supports company/product context

Acceptance criteria:

- Parsed content becomes bounded chunks.
- Empty or unsupported content is recorded as skipped/failed, not silently ignored.
- Psychometrics and journals default private/sensitive.
- CVs and public footprint documents can become public candidates but still require materialization.
- Dynamic tags and relationships are stored under the tenant and require review before public use.

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
  - dynamic profile themes
  - relationship-backed narrative paths
  - public visitor answer policy
  - missing-context questions
- Accept an optional target brief from a job spec, advert, or opportunity description.
- Generate profile experience options:
  - audience
  - tone
  - layout variant
  - page blocks
  - interaction ideas
  - preview-safe design brief
- Generate target alignment:
  - matched requirements
  - supporting claims/evidence
  - gaps and owner interview questions
  - proposed public page emphasis
- Filter lineage so generated claims can cite only source IDs/chunk hashes that exist in the tenant corpus.
- Fall back to deterministic extractive claims if Gemini is unavailable.

Acceptance criteria:

- No Gemini key is required for local proof-of-pipeline.
- Gemini output cannot invent source IDs that survive filtering.
- Generated public-safe claims never expose raw sensitive details by design.
- Weak evidence remains modestly worded.
- Target-specific profile pages do not overstate fit when evidence is weak or missing.

### 4. Materialization And Public Read Path

Tasks:

- Write generated private claims under `tenants/{tenantId}/claims`.
- Materialize public data only when the owner runs with `--publish`.
- Continue using the public profile repository for `/p/[slug]`.
- Publish an approved profile experience version, not just raw profile text.
- Keep arbitrary AI-generated HTML in sandboxed preview mode unless it is transformed into an approved renderer schema.
- Keep public profile assistant constrained to materialized public profile data.

Acceptance criteria:

- Draft synthesis does not overwrite the public profile.
- Published synthesis replaces public sections/claims through a controlled writer.
- Published profile experience uses approved public data and a deterministic renderer.
- Anonymous clients cannot write public profile records.
- Public profile documents do not contain raw source paths or private chunks.
- Public visitor answers can cover overview, work history, leadership style, AI capability, recommendations, work samples, and fit only to the extent those topics are represented in approved public data.

### 5. Tests And Evals

Tasks:

- Unit test document classification.
- Unit test chunking and content hashes.
- Unit test generated profile materialization.
- Unit test generated profile experience schema and renderer allow-list behavior.
- Keep existing Firestore rules tests.
- Keep existing Playwright public profile smoke tests.
- Add prompt/synthesis evals for:
  - private detail leakage
  - unsupported claims
  - missing lineage
  - psychometric raw-score leakage
  - invented employer/product history
  - target-profile overclaiming against a job spec
  - public Q&A answers that cite private-only evidence

Acceptance criteria:

- Build fails if generated public claims can include private-only fields.
- Build fails if Firestore rules allow anonymous private reads or public writes.
- Build fails if synthesis materialization publishes claims without public allow-listing.
- Build fails if generated public page blocks reference private source paths, private chunks, or unapproved data.

## Current Known Limitations

- Google Drive Desktop `.gdoc`, `.gsheet`, and `.gslides` files are pointer files; full content requires Drive API export.
- The Drive API connector requires Google OAuth credentials and uses readonly Drive scope.
- Blogger feed ingestion supports public Blogger JSON feeds without OAuth.
- No embeddings/vector search are required for the first generation pass.
- The deterministic fallback proves the data path, not final content quality.
- Real profile quality requires carefully selected source roots and review of generated output.

## Immediate User Inputs Needed

- The approved Google Drive folder path or Drive folder ID to ingest first.
- The approved Blogger blog URL to ingest first.
- The first job spec or opportunity brief to use as the target-profile test.
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
- The new Phase 1 goal is to prove ingestion-to-profile-generation: approved source folders -> parsing/classification/chunking -> knowledge graph and dynamic tags -> target-profile alignment -> AI synthesis -> generated private claims -> owner-triggered public materialization -> public profile and profile assistant.
- Multi-tenancy and public/private separation must remain from day one.
- The first ingestion paths are local/mounted folder ingestion, selected-root Google Drive API export, and Blogger feed ingestion.
- Drive API ingestion requires an explicit folder ID and must not perform broad account-wide sync.

Review for:
1. Any architecture mistake that would make later Google Drive/Blogger/GitHub connectors hard.
2. Any privacy/security mistake in generated profile publication.
3. Whether CLI-first ingestion is acceptable for this founder MVP.
4. Whether the model/lineage design is strong enough to prove AI-maintained professional profiles.
5. Any test or eval that should block publishing generated profile claims.
```
