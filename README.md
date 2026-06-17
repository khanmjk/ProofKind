# ProofKind

ProofKind is an AI-led professional identity platform concept.

The Phase 1 goal is intentionally narrow: build a tenant-safe public professional profile with hand-approved proof claims and a public fit advisor that can answer only from approved public profile data.

## Current Status

This repository currently contains product, architecture, and build-planning documents. Implementation has not started yet.

## Key Documents

- [Product Vision](docs/productVision.md)
- [Technical Architecture Plan](docs/technicalArchitecturePlan.md)
- [Canonical Data Model](docs/canonicalDataModel.md)
- [Pre-Build Architecture Review](docs/preBuildArchitectureReview.md)
- [Build Implementation Plan](docs/plans/buildPlan.md)

## Build Principle

```text
solid tenant-safe platform spine
  + thin public validation slice
  + no speculative connector breadth
```

Google Drive ingestion, vector search, document parsing, and connector automation are deliberately deferred until after the public profile and fit-advisor slice has been validated.

