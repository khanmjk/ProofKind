# ProofKind Connector And Multi-Tenant Architecture

Status: v1 platform architecture  
Date: 2026-06-16  
Related: [Product Vision](./productVision.md), [Technical Architecture](./technicalArchitecturePlan.md), [Canonical Data Model](./canonicalDataModel.md), [Data Ingestion Architecture](./dataIngestionArchitecture.md), [Stack Diagram](./architectureStackDiagram.md)

## Executive Decision

ProofKind must be multi-tenant and connector-extensible from day one.

The platform should not be a one-off app hardcoded for one person's Google Drive. The first implementation can prioritize the founder's data sources, but the architecture must allow future users to connect different systems such as GitHub, Canva, Trello, Notion, Dropbox, Google Drive, Blogger, YouTube, or manual exports without rebuilding the core product.

This is an architecture boundary, not a mandate to build the full connector runtime before the first public profile slice. Phase 1 implements the tenant-safety primitives; the full connector ingestion spine is built after the public profile and visitor fit-advisor validation slice exists.

The architectural pattern is:

```text
tenant-isolated workspace
  -> connector registry
  -> tenant connector installs
  -> policy broker
  -> connector runtime
  -> normalized source registry
  -> tenant-scoped retrieval and agent tools
```

MCP is useful, but it should not be the core security boundary. ProofKind owns tenancy, consent, policy, lineage, indexing, and visibility rules. MCP can be one adapter type inside the connector runtime.

## Why This Matters

Agentic systems are dangerous if they can freely call tools across data sources. A secure ProofKind agent must never decide tenancy, authorization, retrieval scope, or publication scope by itself.

Every tool call must be constrained by server-side policy:

```text
auth user -> tenant membership -> connector install -> allowed capability -> source visibility -> retrieval scope
```

The model may request an action. The platform decides whether that action is allowed.

## Platform Tenancy Model

Use `tenantId` as the primary boundary from the start.

For the founder MVP, there is one tenant with one owner. For SaaS, each user gets a personal tenant by default. Later, a tenant can support multiple members if ProofKind adds teams or organizations.

### Tenant Types

| Tenant type | Description |
|---|---|
| `personal` | One professional identity owner |
| `team` | Future shared workspace for a small team |
| `organization` | Future enterprise tenant |

### Tenant Roles

| Role | Capabilities |
|---|---|
| `owner` | Full workspace access, connector management, publishing approval, deletion/export |
| `editor` | Can inspect and refine claims but cannot manage billing or delete tenant |
| `viewer` | Can view private workspace but cannot publish |
| `public_visitor` | Anonymous; can read only materialized public profile data |

V1 can implement only `owner` and `public_visitor`, but the data model should not block future roles.

## Firestore Tenant Layout

The canonical collection layout is defined in [Canonical Data Model](./canonicalDataModel.md).

Private tenant data lives under `tenants/{tenantId}`. Public profile data is materialized under `publicProfiles/{slug}` using public-specific collection names such as `publicClaims`, `publicArtifactSummaries`, `publicSections`, and `publicFitSessions`.

Reasoning:

- Private data is naturally contained by tenant path.
- Public profile data is materialized separately and contains no raw private source data.
- Connector definitions are global, but connector installs and OAuth tokens are tenant-specific.
- A future team/org model can add members without moving all data.

## Cloud Storage Tenant Layout

Use tenant-prefixed paths.

```text
tenants/{tenantId}/sources/{sourceId}/{versionId}/original
tenants/{tenantId}/sources/{sourceId}/{versionId}/exported/{format}
tenants/{tenantId}/sources/{sourceId}/{versionId}/parsed/document.json
tenants/{tenantId}/sources/{sourceId}/{versionId}/parsed/content.md
tenants/{tenantId}/sources/{sourceId}/{versionId}/derived/thumbnail.png
tenants/{tenantId}/exports/{exportId}
publicProfiles/{slug}/assets/{assetId}
```

V1 can use one bucket with tenant prefixes. Later, enterprise tenants could receive dedicated buckets if required.

## Security Rules Position

Firestore and Cloud Storage rules are the client-side guardrail. Server-side tools and Cloud Run jobs must enforce the same tenant boundary explicitly because server client libraries bypass Firestore Security Rules and rely on IAM. Firebase's Firestore docs state this clearly. Source: [Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started).

Required controls:

- Web clients can access only tenant data where `request.auth.uid` is a member.
- Anonymous clients can access only `publicProfiles/{slug}`.
- Storage paths must include `tenantId` and validate tenant membership.
- Backend tools must resolve `tenantId` from the authenticated server session, not from model-generated input.
- Every server-side query must include tenant and visibility filters.
- Public profile agents must never receive private tenant paths, private source IDs, or private retrieval handles.
- Backend code must use a `TenantScopedRepository`; raw Firestore and Storage access is banned outside repository modules.
- Vector retrieval must pass through a single tenant/visibility-scoped retriever chokepoint.
- Private retrieval results must be post-asserted against expected `tenantId` and visibility.

Firebase Security Rules support user-based access with Firebase Authentication for Firestore, and Cloud Storage rules expose `request.auth.uid` for per-user authorization. Sources: [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started), [Cloud Storage Security Rules](https://firebase.google.com/docs/storage/security).

## Retrieval Isolation

Use separate retrieval tools and indexes by scope.

```text
owner_private_retriever
  tenantId: required
  actorUid: required
  membership: required
  visibility: private + private_supported + public
  collections: tenants/{tenantId}/sourceChunks, claims, entities, timeline, psychometric summaries

public_profile_retriever
  slug: required
  actor: anonymous
  visibility: approved public only
  collections: publicProfiles/{slug}/publicClaims, publicSections, publicArtifactSummaries
```

Firestore Vector Search supports pre-filtering with regular query operators before nearest-neighbor search. ProofKind must use this to filter by `tenantId`, `visibility`, `profileId`, and `sourceStatus` before vector retrieval. Source: [Firestore Vector Search](https://firebase.google.com/docs/firestore/vector-search).

Mandatory retrieval rule:

```text
No retrieval tool may accept tenantId, uid, visibility, or collection path directly from the LLM.
```

Those values come from the authenticated request context and policy broker.

## Connector Registry

Connectors are registered as metadata, not hardcoded throughout the app.

```text
connectorDefinitions/{connectorId}
  id
  displayName
  provider
  version
  adapterType
  authType
  deliveryModel
  verificationTier
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

Example connector IDs:

- `google-drive`
- `blogger`
- `manual-upload`
- `linkedin-export`
- `github`
- `youtube`
- `public-web-research`
- `canva`
- `trello`
- `notion`
- `dropbox`
- `mcp-server`

## Tenant Connector Installs

Each tenant installs connectors independently.

```text
tenants/{tenantId}/connectorInstalls/{installId}
  schemaVersion
  tenantId
  connectorId
  installedByUid
  status
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
  lastSyncAt
  lastError
  rateLimitState
  createdAt
  revokedAt
```

Tokens and secrets must not be stored directly in Firestore. Store them in Secret Manager or a dedicated encrypted token store, and keep only `authRef` in Firestore. Connector tasks must check `install.status` and `revocationGeneration` before doing work so revoked installs stop in-flight refresh chains.

`syncCursors` should be connector-owned opaque state. For Google Drive, model cursors as a map keyed by Drive context, such as `myDrive` and shared drive IDs, rather than one global token.

## Connector Adapter Contract

A connector adapter is deterministic application code. It is not "the LLM deciding how to use an API."

```text
describe()
  returns connector manifest and capability metadata

connect(tenantContext, authInput)
  creates or updates a tenant connector install

discover(tenantContext, installId, hint)
  returns candidate roots/accounts/boards/repos/blogs/folders

inventory(tenantContext, installId, root, cursor)
  returns source item metadata without full content where possible

fetch(tenantContext, installId, sourceItemId, versionHint)
  fetches bytes, exports content, or returns remote content metadata

delta(tenantContext, installId, cursor)
  returns changed/removed/moved/new source items

normalize(tenantContext, sourceVersion)
  converts fetched content into canonical artifacts

revoke(tenantContext, installId)
  removes tokens, disables refresh, and marks source roots inactive
```

Every method receives `tenantContext` from the server:

```text
tenantContext
  tenantId
  actorUid
  actorRole
  requestId
  allowedConnectorIds
  allowedSourceRoots
  allowedVisibilityScopes
  budgetLimits
```

The model never constructs `tenantContext`.

## Connector Adapter Types

| Adapter type | Use case | V1 position |
|---|---|---|
| `first_party_api` | Google Drive, Blogger, GitHub later | preferred |
| `manual_import` | LinkedIn export, uploaded files | preferred |
| `web_research` | Company/product public research | preferred |
| `mcp_adapter` | External MCP tools/servers | later, admin-approved only |
| `third_party_cloud_adapter` | Canva/Trello/Notion APIs | later |
| `custom_cloud_run_adapter` | Isolated connector service | later for high-risk connectors |

## MCP Position

MCP is an open protocol for connecting LLM applications to external data sources and tools. The official MCP spec describes hosts, clients, and servers, and says it standardizes sharing context, exposing tools, and composing workflows. Source: [MCP specification](https://modelcontextprotocol.io/specification/2025-11-25).

Genkit also supports tool calling and explicitly documents MCP as a way to extend tool capabilities with external MCP servers. Sources: [Genkit tool calling](https://genkit.dev/docs/js/tool-calling/), [Genkit overview](https://firebaseopensource.com/projects/firebase/genkit/).

ProofKind should use MCP carefully:

- MCP is good for optional ecosystem integration.
- MCP is not ProofKind's tenant model.
- MCP is not ProofKind's source registry.
- MCP is not ProofKind's evidence lineage model.
- MCP is not ProofKind's publication policy.

Recommended v1 stance:

```text
Do not allow arbitrary user-supplied MCP servers in production v1.
```

Recommended later stance:

```text
Allow admin-approved MCP servers through an MCP adapter,
wrapped by the ProofKind policy broker,
with tenant-scoped credentials and audited tool calls.
```

## Tool Broker Pattern

The AI chat interface should not receive a raw list of all platform tools.

Use a policy-aware tool broker:

```text
chat request
  -> authenticate
  -> resolve tenant membership
  -> resolve chat mode
  -> load allowed tool catalog
  -> execute Genkit flow with only allowed tools
  -> inspect tool requests
  -> enforce tenant policy
  -> execute connector/retrieval tools
  -> audit every call
```

### Chat Modes

| Chat mode | Allowed data | Allowed tools |
|---|---|---|
| `owner_private` | Full tenant corpus | private retrieval, connector inventory, refresh, claim drafting |
| `owner_publish_review` | Draft and approved claims | approval tools, wording tools, evidence inspection |
| `public_visitor` | Materialized public profile only | public retrieval, fit assessment, booking |
| `admin_support` | Metadata only by default | tenant support tools, no raw content unless explicitly authorized |

## Tool Safety Rules

- LLM cannot choose tenant ID.
- LLM cannot choose Firestore path.
- LLM cannot choose Storage path.
- LLM cannot request "all users."
- LLM cannot switch from public profile scope to private owner scope.
- LLM cannot fetch connector tokens.
- LLM cannot install a connector without owner confirmation.
- LLM cannot publish claims.
- LLM cannot run refresh jobs across tenants.
- Every tool call is logged with `tenantId`, `actorUid`, `toolName`, `inputsHash`, `sourceIds`, `resultCount`, and `visibilityScope`.

## Multi-Tenant Agent Session Model

```text
tenants/{tenantId}/agentSessions/{sessionId}
  tenantId
  actorUid
  mode
  profileId
  allowedScopes
  allowedConnectorInstallIds
  createdAt
  expiresAt

tenants/{tenantId}/agentRuns/{runId}
  sessionId
  mode
  model
  promptVersion
  toolsAllowed
  toolsCalled
  retrievalScopes
  inputTokenCount
  outputTokenCount
  costEstimate
  auditStatus

publicProfiles/{slug}/publicFitSessions/{sessionId}
  slug
  publicProfileId
  anonymousVisitorId
  mode: public_visitor
  toolsAllowed: public_profile_retriever
  createdAt
```

Public visitor sessions stay under `publicProfiles/{slug}` and should not contain private tenant content.

## Data Container Strategy

V1:

- one Firebase project
- one Firestore database
- one Cloud Storage bucket
- strict tenant document paths and storage prefixes
- Security Rules plus server-side policy broker

Later:

- per-region Firestore databases if residency matters
- dedicated buckets for enterprise tenants
- tenant-specific service accounts for high-trust enterprise connectors
- separate Google Cloud projects only for enterprise isolation or compliance

Do not start with one Firebase project per user. It creates operational overhead before product-market fit.

## Connector Roadmap

### V1 Connectors

- Manual upload
- Google Drive
- Blogger
- LinkedIn export/manual import
- Public web research

### Next Connectors

- GitHub
- YouTube
- Google Docs/Sheets/Slides direct refinements through Drive exports

### Later Connectors

- Canva
- Trello
- Notion
- Dropbox
- OneDrive
- WordPress
- Medium
- MCP adapter

## Definition Of Done For A Connector

A connector is not production-ready until it supports:

- tenant-specific install
- explicit owner consent
- least practical OAuth scopes
- inventory
- fetch/export
- sync cursor or refresh strategy
- source versioning
- parser routing
- classification
- error state
- revoke/disconnect
- audit log
- deletion behavior
- rate limit handling
- tests proving no cross-tenant access

## Required Cross-Tenant Tests

Minimum automated tests:

- User A cannot read User B Firestore tenant documents.
- User A cannot read User B Cloud Storage paths.
- Owner private chat for Tenant A cannot retrieve Tenant B chunks.
- Public visitor chat cannot retrieve Tenant A private chunks.
- Public visitor chat cannot call connector inventory or fetch tools.
- Connector refresh for Tenant A cannot process Tenant B installs.
- Vector retrieval always applies tenant and visibility filters.
- A malicious prompt cannot override `tenantId`, `uid`, `visibility`, or tool list.
- A connector error cannot leak tokens or source content into chat.
- Deleting a connector install disables future refresh jobs.

## Architectural Warnings

- Do not load arbitrary third-party connector code inside the main app process.
- Do not let users paste arbitrary MCP server URLs into v1.
- Do not pass raw OAuth tokens to the model.
- Do not store connector tokens in Firestore.
- Do not trust model-generated tool arguments for tenant identity.
- Do not combine public and private retrieval in a single tool with a mode flag controlled by the model.
- Do not use public profile documents as pointers to private source paths.

## Principal Architecture Position

The app should feel flexible and agentic, but the platform must be policy-driven.

The extensibility boundary is the connector adapter contract. The security boundary is the tenant policy broker. The AI is an orchestrator inside those boundaries, not an authority over them.
