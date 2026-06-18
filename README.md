# ProofKind

ProofKind is an AI-led professional identity platform. Its core thesis is that a professional profile should be maintained from real evidence: documents, CVs, work outputs, psychometric reports, public writing, projects, and future connected sources.

## Current Phase

Phase 1 now proves the ingestion-to-profile-generation engine:

```text
approved source folder
  -> parse/classify/chunk
  -> tenant-scoped private corpus
  -> AI profile synthesis
  -> generated claims with lineage
  -> owner-triggered public materialization
  -> public profile and fit advisor
```

The previous hand-curated seed path has been removed from product code. Public profile data should be generated from ingested source material and materialized through the controlled writer.

## Local Commands

Run the app:

```bash
npm run dev
```

Ingest an approved local or mounted Google Drive folder:

```bash
npm run ingest:local -- --root "/path/to/approved/professional-folder" --tenant founder-mjk --owner-uid owner-mjk
```

Generate a draft profile from ingested corpus:

```bash
npm run synthesize:profile -- --tenant founder-mjk --slug mjk --display-name "Muhammad Khan"
```

Generate and publish the public profile:

```bash
npm run synthesize:profile -- --tenant founder-mjk --slug mjk --display-name "Muhammad Khan" --publish
```

Run validation:

```bash
npm run lint
npm test
npm run test:rules
npm run build
npm run test:e2e
```

## Key Documents

- [Product Vision](docs/productVision.md)
- [Technical Architecture Plan](docs/technicalArchitecturePlan.md)
- [Data Ingestion Architecture](docs/dataIngestionArchitecture.md)
- [Canonical Data Model](docs/canonicalDataModel.md)
- [Pre-Build Architecture Review](docs/preBuildArchitectureReview.md)
- [Build Implementation Plan](docs/plans/buildPlan.md)

## Important Boundaries

- Ingest only explicitly approved source roots.
- Private source records stay under `tenants/{tenantId}/**`.
- Public profile data is materialized separately under `publicProfiles/{slug}/**`.
- The public fit advisor can use only materialized public claims and sections.
- Google Drive Desktop `.gdoc`, `.gsheet`, and `.gslides` files are pointers; full content requires the later Google Drive API export connector.
