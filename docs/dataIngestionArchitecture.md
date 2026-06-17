# ProofKind Data Ingestion Architecture

Status: v1 ingestion architecture  
Date: 2026-06-16  
Related: [Product Vision](./productVision.md), [Technical Architecture](./technicalArchitecturePlan.md), [Canonical Data Model](./canonicalDataModel.md), [Connector And Multi-Tenant Architecture](./connectorMultiTenantArchitecture.md), [Stack Diagram](./architectureStackDiagram.md)

## Goal

ProofKind must build a living professional evidence base from the owner's real footprint:

- Google Drive documents, folders, and subfolders
- long history of CVs and resumes
- psychometric reports
- journals and reflection notes
- performance reviews, feedback reports, goals, and development plans
- Blogger posts
- LinkedIn profile exports, recommendations, and posts where available
- public web research about companies, products, articles, and work context
- future updates as data changes

The ingestion system must do more than "upload files into RAG." It must discover, classify, parse, version, refresh, extract, reconcile, and preserve evidence lineage.

## Core Decision

Use a connector-based ingestion system with one normalized, tenant-scoped source registry.

```text
connector
  -> source inventory
  -> owner review / consent
  -> queue idempotent ingestion tasks
  -> fetch changed content
  -> parse
  -> classify
  -> chunk
  -> embed
  -> extract entities and claims
  -> reconcile timeline and contradictions
  -> refresh schedule
```

The system should feel agentic to the owner, but the implementation should be deterministic around consent, source identity, versioning, and refresh.

Connector extensibility and tenant isolation are defined in [Connector And Multi-Tenant Architecture](./connectorMultiTenantArchitecture.md). Every connector install is tenant-specific; every sync, fetch, parse, classification, embedding, extraction, and refresh job must carry `tenantId`.

## Locked Google Services

| Capability | Service |
|---|---|
| Connector auth | Firebase Authentication plus Google OAuth |
| Source metadata and normalized records | Cloud Firestore |
| Raw and parsed artifacts | Cloud Storage for Firebase |
| Ingestion workers | Cloud Run Services behind Cloud Tasks |
| Bulk backfills | Cloud Run Jobs |
| Scheduled refresh | Cloud Scheduler triggering Cloud Tasks |
| Task queue | Cloud Tasks for per-source and per-file ingestion work |
| Agentic orchestration | Genkit |
| Connector runtime | ProofKind Connector Runtime |
| Tool authorization | Policy-aware Tool Broker |
| Parsing support | Docling, MarkItDown, Unstructured inside Cloud Run workers |
| AI classification/extraction | Gemini API |
| Retrieval | Firestore Vector Search |
| Web research | Gemini Grounding with Google Search and URL Context |

## Source Connector Contract

Every connector should implement the same conceptual interface:

```text
discover()
  returns candidate roots, accounts, feeds, folders, or public handles

inventory(root, cursor)
  returns source items and folder structure without fetching full content where possible

fetch(sourceItem, version)
  downloads or exports the current content version

delta(cursor)
  returns new, changed, removed, or moved items since the last sync

normalize(rawArtifact)
  converts raw content into canonical text, markdown, JSON, tables, images, and metadata

classify(sourceVersion)
  assigns document family, sensitivity, rights, evidence value, and parsing strategy
```

This keeps Google Drive, Blogger, LinkedIn import, and public web research consistent even though their APIs differ.

The connector contract must also support future connectors such as GitHub, Canva, Trello, Notion, Dropbox, OneDrive, and MCP-backed tools without changing the normalized ingestion pipeline.

Connector methods must receive server-generated `tenantContext`; they must not trust the LLM to provide tenant, user, path, token, or visibility scope.

## Google Drive Connector

Google Drive is the primary ingestion surface.

### Scope Strategy

There are two modes:

1. **Owner/personal alpha**
   - Use `drive.readonly` to support broad recursive inventory and download/export.
   - This is acceptable for your own workspace and test users.

2. **Public SaaS beta**
   - Prefer user-selected roots and least-privilege behavior.
   - If broad Drive sync is offered, plan for restricted Google OAuth verification and security assessment because Google classifies broad Drive access as restricted when storing or transmitting that data server-side.

Google's Drive auth docs classify broad scopes as restricted and state that storing or transmitting restricted-scope data requires a security assessment. Source: [Google Drive API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

### Recursive Folder Inventory

Drive does not give ProofKind a single "give me this folder recursively" endpoint that also handles all product logic. The connector should build recursion explicitly:

1. Owner selects one or more root folders or consents to a broader inventory.
2. `files.list` finds direct children with a query like:

```text
'{folderId}' in parents and trashed = false
```

3. For each child folder, enqueue another inventory task.
4. For shortcuts, resolve target metadata before deciding whether to follow.
5. Support shared drives with `supportsAllDrives`, `includeItemsFromAllDrives`, and `driveId` when needed.
6. Persist folder paths because Drive's native model is parent-ID based, not path based.

Google documents `files.list`, the `q` query syntax, parent queries, corpora, shared drives, pagination, and field selection. Source: [Drive files.list](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list), [Search files and folders](https://developers.google.com/workspace/drive/api/guides/search-files).

### Metadata To Store

For each Drive item:

- `driveFileId`
- `name`
- `mimeType`
- `parents`
- `resolvedPath`
- `driveId`
- `owners`
- `webViewLink`
- `size`
- `md5Checksum` when available
- `version`
- `modifiedTime`
- `createdTime`
- `trashed`
- `shortcutDetails`
- `exportLinks`
- `capabilities`
- `lastInventoryAt`
- `lastFetchedAt`
- `lastParsedAt`

### Download And Export Routing

For binary files:

- use `files.get` with `alt=media`
- store original bytes in Cloud Storage
- parse according to MIME type

For Google Workspace files:

- use `files.export`
- store exported artifacts in Cloud Storage
- parse exported text/HTML/PDF/Office formats

Google documents blob downloads via `alt=media` and Google Workspace exports via `files.export`; exported Google Workspace content is limited to 10 MB for the export endpoint. Source: [Download and export files](https://developers.google.com/workspace/drive/api/guides/manage-downloads), [files.export](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/export).

Recommended export strategy:

| Drive MIME family | Preferred export |
|---|---|
| Google Docs | HTML and DOCX; PDF fallback for layout |
| Google Slides | PPTX and PDF |
| Google Sheets | XLSX; CSV per sheet where useful |
| Google Drawings | PNG or PDF |
| Binary PDF | original PDF |
| Word/PowerPoint/Excel | original file |
| Images/scans | original image plus OCR/vision path |
| Audio/video | metadata first; transcription later |

### Refresh

Initial sync:

- run a full recursive inventory
- store a Drive `startPageToken` for future changes

Incremental sync:

- use Drive `changes.list` with the stored page token
- update changed, removed, moved, or renamed items
- fetch and parse only when `modifiedTime`, version, or content hash changes

Near-real-time option:

- use Drive `changes.watch` push notifications to a webhook, then run a delta sync
- channels expire and must be renewed

Google documents `changes.getStartPageToken`, `changes.list`, and `changes.watch`; Drive push notifications support both `files` and `changes`. Sources: [Drive changes API](https://developers.google.com/workspace/drive/api/reference/rest/v3), [Drive push notifications](https://developers.google.com/workspace/drive/api/guides/push).

For v1, use scheduled polling first. Add push notifications after basic refresh works.

## CV And Resume Intelligence

CVs are not just documents; they are historical positioning snapshots.

The classifier should detect CVs using:

- filename patterns: cv, resume, curriculum vitae, profile, bio
- structure: roles, dates, skills, education, summary, achievements
- content signals: target job wording, career profile, employment chronology

Extract:

- candidate name and contact fields
- document date or inferred date
- target role or target market
- roles, companies, dates
- project/product references
- skill claims
- outcome claims
- metrics and achievements
- omitted/added claims compared with other CV versions
- wording shifts over time

CV reconciliation rules:

- Older CV claims are evidence of what the owner asserted at that point in time.
- Newer CVs may omit older claims because of targeting; omission is not contradiction by default.
- Date conflicts should be flagged, not automatically resolved.
- Repeated claims across many versions get stronger confidence.
- Claims appearing only in one targeted CV remain lower confidence until corroborated.

CV outputs:

- `careerTimeline`
- `roleHistory`
- `skillEvolution`
- `domainEvolution`
- `claimFirstSeen`
- `claimLastSeen`
- `cvTargetingPattern`
- `contradictionCandidates`

## Psychometric Report Intelligence

Psychometric reports must be treated as sensitive private evidence.

Default visibility:

```text
psychometric source -> private only
psychometric interpretation -> owner workbench only
public use -> only owner-approved operating-style claims
```

Extract:

- assessment provider
- assessment date
- report type
- constructs measured
- scores, bands, percentiles, or qualitative categories
- report definitions
- stated caveats and validity notes
- strengths
- risks/derailers
- motivators
- working style
- leadership style
- team fit signals
- communication preferences
- stress behavior
- recommended development areas

Synthesis output:

- `psychometricProfile`
- `operatingStyleClaims`
- `leadershipStyleClaims`
- `communicationStyleClaims`
- `riskAndCaveatNotes`
- `ownerReflectionQuestions`

Rules:

- Do not diagnose.
- Do not infer protected traits.
- Do not use psychometric data for public fit scoring in v1.
- For owner questions, answer with caveats and source attribution.
- For public profile, expose only explicit owner-approved high-level working-style statements.

## Deep Personalization Sources

Deep personalization sources feed the private owner model and future professional coach.

Examples:

- journals
- reflection notes
- 1:1 notes
- performance reviews
- manager feedback
- peer feedback
- 360 feedback
- OKRs and goals
- development plans
- coaching notes
- self-assessments
- decision journals

Default visibility:

```text
journals -> private only
performance reviews -> private + employer_sensitive
psychometrics -> private + psychometric_sensitive
coaching notes -> private only
public use -> only owner-approved generalized claims
```

Extract:

- recurring strengths
- repeated development areas
- decision patterns
- values and motivators
- energy patterns
- communication preferences
- conflict patterns
- opportunity preferences
- professional goals
- progress against goals
- reflection themes
- perception gaps between self and others

These sources should not be used as public proof by default. They support owner coaching, private synthesis, and draft public positioning only after explicit approval.

## Blogger Connector

The Blogger connector should use the Blogger API rather than generic crawling where possible.

Discovery:

- blog URL
- blog ID via API
- post list
- labels/categories
- published and updated dates
- canonical URLs

Sync:

- use `posts.list`
- page with `pageToken`
- include bodies with `fetchBodies=true`
- order by `updated`
- refresh from the latest known updated timestamp
- keep deleted/missing post handling as a reconciliation task

Blogger's `posts.list` supports public blogs without authorization, private blogs with authorization, pagination, labels, `published`/`updated` ordering, `startDate`, `endDate`, and `fetchBodies`. Source: [Blogger posts.list](https://developers.google.com/blogger/docs/3.0/reference/posts/list).

Normalize:

- HTML to markdown
- embedded links
- images and captions
- labels
- publish/update dates
- author
- canonical URL

Extract:

- writing themes
- domain expertise
- repeated opinions
- frameworks/methods
- product thinking
- technical patterns
- career narrative evidence
- voice and tone
- public claims already safe to cite

Refresh cadence:

- daily for active blogs
- weekly/monthly for dormant blogs
- on-demand refresh button in owner workbench

## LinkedIn Connector

LinkedIn must be handled conservatively because API access is restricted.

Supported v1 paths:

1. LinkedIn data export upload.
2. Saved profile PDF upload.
3. Manually supplied recommendation text or export files.
4. Manually supplied post URLs or copied posts.
5. Public web research for LinkedIn-visible pages only when accessible without bypassing login or platform restrictions.

Do not build unofficial LinkedIn scraping into v1.

Reason:

- LinkedIn's Profile API is restricted to approved developers.
- Post retrieval permissions are restricted and available only to approved users.
- Member data portability APIs are limited by region and program terms.

Sources: [LinkedIn Profile API](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api), [LinkedIn Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api), [LinkedIn Member Portability APIs](https://www.linkedin.com/help/linkedin/answer/a6214075), [LinkedIn data portability](https://www.linkedin.com/help/linkedin/answer/a1341547).

Extract:

- profile headline and summary
- roles
- recommendations
- skills
- certifications
- education
- posts/articles if provided
- social proof claims
- recommender relationship context

Refresh:

- manual re-upload reminder
- optional monthly owner prompt: "Upload latest LinkedIn export or paste recent posts."
- no automatic LinkedIn crawling in v1

## Company And Product Web Research

The owner should not need to manually list every company, product, and public article.

ProofKind should generate research seeds from ingested private and public material:

- employer names
- product names
- project names
- client names where safe and owner-approved
- role titles
- blog themes
- public artifacts
- GitHub repos
- CV claims

The Web Research Agent then:

1. generates search queries from extracted anchors
2. uses Gemini Grounding with Google Search for discovery
3. uses Gemini URL Context to inspect selected URLs
4. stores candidate sources
5. classifies credibility and relevance
6. asks the owner to approve association before using as evidence

Google documents Gemini Grounding with Google Search for real-time web content and citations, and URL Context for model access to provided URLs. Sources: [Gemini Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search), [Gemini URL Context](https://ai.google.dev/gemini-api/docs/url-context).

Candidate source types:

- company pages
- product pages
- press releases
- case studies
- articles
- podcasts/transcripts
- conference pages
- GitHub repositories
- documentation pages
- archived pages where legally accessible

Evidence levels:

- `direct_owner_evidence`: source explicitly names owner
- `direct_product_evidence`: source confirms product/company context
- `contextual_evidence`: source supports domain or market context
- `weak_association`: possible match but needs owner confirmation
- `rejected`: owner says not relevant or unsafe

Refresh:

- monthly for known companies/products
- on demand from owner workbench
- when a new employer/product/project anchor appears in ingested data

## Classification Taxonomy

Every source version should receive multiple classifications.

### Document Family

- `cv_resume`
- `psychometric_report`
- `journal_entry`
- `reflection_note`
- `performance_review`
- `manager_feedback`
- `peer_feedback`
- `okr_goal`
- `development_plan`
- `coaching_note`
- `self_assessment`
- `decision_journal`
- `blog_post`
- `linkedin_profile`
- `linkedin_recommendation`
- `linkedin_post`
- `work_sample`
- `presentation`
- `spreadsheet`
- `project_document`
- `product_document`
- `company_research`
- `public_article`
- `github_repository`
- `credential`
- `reference`
- `email_or_message_export`
- `unknown`

### Sensitivity

- `public`
- `private`
- `private_supported`
- `employer_sensitive`
- `client_sensitive`
- `personal_sensitive`
- `psychometric_sensitive`
- `reflective_private`
- `feedback_sensitive`
- `goal_tracking_sensitive`
- `coaching_sensitive`
- `unknown_sensitive`

### Rights Status

- `owned_by_owner`
- `public_web`
- `employer_owned`
- `client_owned`
- `third_party`
- `unknown`

### Evidence Use

- `timeline`
- `skill_claim`
- `outcome_claim`
- `project_context`
- `product_context`
- `working_style`
- `writing_voice`
- `social_proof`
- `public_citation`
- `private_support_only`
- `owner_coaching`
- `opportunity_fit`
- `performance_review_preparation`
- `development_experiment`
- `decision_reflection`
- `not_evidence`

### Confidence

- `high`
- `medium`
- `low`
- `needs_owner_confirmation`

## Parsing Strategy

Use a router, not one parser.

```text
Google Workspace file
  -> Drive export
  -> parser route by export type

Office/PDF/image/audio file
  -> download original
  -> Docling / MarkItDown / Unstructured
  -> Gemini document understanding for hard cases

HTML/blog/web page
  -> HTML normalization
  -> markdown extraction
  -> link and metadata extraction
```

Docling supports formats such as PDF, DOCX, XLSX, PPTX, EPUB, Markdown, HTML, CSV, images, and audio. MarkItDown supports PDF, PowerPoint, Word, Excel, images, audio, HTML, CSV/JSON/XML, ZIP, YouTube URLs, and ePub. Unstructured supports broad office, PDF, image, HTML, markdown, email, and text formats. Sources: [Docling supported formats](https://docling-project.github.io/docling/usage/supported_formats/), [MarkItDown](https://github.com/microsoft/markitdown), [Unstructured supported file types](https://docs.unstructured.io/open-source/introduction/supported-file-types).

Gemini document understanding should be used selectively for scanned PDFs, complex psychometric reports, charts, and documents where layout matters. Source: [Gemini document understanding](https://ai.google.dev/gemini-api/docs/document-processing).

## Refresh Architecture

Use scheduled refresh first, push notifications second.

### Refresh Policies

| Source | Refresh method | v1 cadence |
|---|---|---|
| Google Drive | Drive changes token polling | daily or every 6 hours |
| Google Drive high priority | Drive changes.watch webhook | later |
| Blogger | posts.list ordered by updated | daily/weekly |
| LinkedIn | manual re-upload/reminder | monthly |
| Public company/product web | Gemini Search grounding rerun | monthly/on-demand |
| Uploaded static files | content hash check | on upload only |

### Change Handling

For every changed source:

1. mark previous source version as superseded
2. fetch or export new content
3. compute content hash
4. skip parsing if hash unchanged
5. parse and classify if changed
6. update chunks and embeddings
7. re-run targeted extraction only for affected claims/entities
8. flag public claims that may be invalidated by source changes
9. ask owner for review if public profile could change

Public profile content should never update automatically from changed private data. It should create draft updates for owner approval.

### Task Dispatch

Use Cloud Tasks for per-source and per-file work. Cloud Tasks should call Cloud Run service endpoints for normal ingestion work; Cloud Run Jobs are reserved for bulk backfills and controlled reprocessing.

```text
inventory_root
fetch_source_version
parse_source_version
classify_source_version
chunk_source_version
embed_source_chunks
extract_source_claims
reconcile_affected_claims
refresh_public_drafts
```

Every task must be idempotent. Cloud Tasks task names provide short-lived in-flight deduplication only; the durable processed-task ledger belongs in Firestore.

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

Changing `processingVersion` should create an explicit backfill plan, not silently reprocess and re-bill the full corpus. Cloud Tasks provides reliable task dispatch to worker services and is appropriate for retryable asynchronous work. Source: [Cloud Tasks queues](https://docs.cloud.google.com/tasks/docs/creating-queues).

## Firestore Collections

The canonical implementation schema is defined in [Canonical Data Model](./canonicalDataModel.md). The ingestion collections below are a subset of that model.

```text
tenants/{tenantId}/connectorInstalls/{installId}
tenants/{tenantId}/sourceRoots/{rootId}
tenants/{tenantId}/sourceItems/{sourceId}
tenants/{tenantId}/sourceVersions/{versionId}
tenants/{tenantId}/sourceArtifacts/{artifactId}
tenants/{tenantId}/sourceChunks/{chunkId}
tenants/{tenantId}/entities/{entityId}
tenants/{tenantId}/claims/{claimId}
tenants/{tenantId}/claimEvidence/{evidenceId}
tenants/{tenantId}/psychometricAssessments/{assessmentId}
tenants/{tenantId}/timelineEvents/{timelineEventId}
tenants/{tenantId}/webResearchCandidates/{candidateId}
tenants/{tenantId}/syncRuns/{syncRunId}
tenants/{tenantId}/syncEvents/{eventId}
tenants/{tenantId}/ingestionTasks/{taskId}
tenants/{tenantId}/agentRuns/{runId}
```

Document classification is stored on source records and derived artifacts in v1, not in a separate `classifications` collection. Professional-memory and coaching collections are reserved in the canonical model for later phases; deep personalization files enter v1 as sensitive `sourceItems` and `sourceVersions`.

## Cloud Storage Layout

```text
tenants/{tenantId}/sources/{sourceId}/{versionId}/original
tenants/{tenantId}/sources/{sourceId}/{versionId}/exported/{format}
tenants/{tenantId}/sources/{sourceId}/{versionId}/parsed/document.json
tenants/{tenantId}/sources/{sourceId}/{versionId}/parsed/content.md
tenants/{tenantId}/sources/{sourceId}/{versionId}/derived/thumbnail.png
```

## Source Item Fields

```text
id
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

## Source Version Fields

```text
id
sourceItemId
tenantId
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

## Agentic Tooling

The owner-facing AI should have explicit tools:

- `connect_google_drive`
- `select_drive_roots`
- `inventory_drive_roots`
- `show_source_inventory`
- `approve_source_ingestion`
- `fetch_source_versions`
- `classify_sources`
- `summarize_source_map`
- `sync_blogger`
- `import_linkedin_export`
- `research_public_company_context`
- `research_public_product_context`
- `extract_cv_timeline`
- `synthesize_psychometric_profile`
- `ingest_reflection_entry`
- `synthesize_feedback_patterns`
- `prepare_performance_review`
- `evaluate_opportunity_fit`
- `create_development_experiment`
- `record_decision_journal_entry`
- `run_professional_coaching_session`
- `find_prior_work_relevant_to_problem`
- `explain_claim_evidence`
- `refresh_sources`

The agent may recommend actions, but ingestion of new private roots and publication of claims require owner confirmation.

## Owner Experience

The owner should see a conversational but inspectable process:

1. "I found these Drive folders that look career-related."
2. "These 137 files look relevant. 42 are likely CVs, 9 are psychometric reports, 31 are work samples, 18 are presentations, 12 are spreadsheets, and 25 need review."
3. "Do you want me to ingest all, skip sensitive-looking client files, or review first?"
4. "I found 11 CV versions from 2012-2026 and reconstructed a timeline. There are 4 date conflicts."
5. "I found public pages for three products you worked on. Please confirm which ones are actually connected to you."
6. "Your psychometric reports consistently suggest these working-style themes, but I will keep them private unless you approve public wording."

This keeps the experience agentic without letting the system silently ingest or publish risky information.

## Hard Boundaries

- Do not auto-publish anything from private sources.
- Do not scrape LinkedIn behind login or use unofficial LinkedIn APIs in v1.
- Do not expose journals, feedback reports, coaching notes, or psychometric details to public visitors by default.
- Do not treat one CV claim as verified fact without corroboration or owner approval.
- Do not automatically associate the owner with a public company/product page without owner confirmation.
- Do not reprocess unchanged files.
- Do not delete lineage when a source is removed; mark derived claims as stale and handle deletion according to the deletion policy.

## Build Order

1. Firestore source registry and source version model.
2. Manual upload ingestion.
3. Google Drive OAuth and selected-root recursive inventory.
4. Drive fetch/export and parser routing.
5. Document classification.
6. CV timeline extraction.
7. Owner private workbench retrieval over ingested content.
8. Blogger connector.
9. Psychometric synthesis.
10. Public web research from extracted anchors.
11. Refresh scheduler and Drive changes polling.
12. LinkedIn export importer.
13. Claim graph integration and approval workflow.
