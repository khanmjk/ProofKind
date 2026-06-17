import { describe, expect, it } from "vitest";
import { serializePublicClaim } from "@/lib/profile/publicSerializer";
import type { PrivateClaim } from "@/lib/types";

describe("serializePublicClaim", () => {
  it("copies only public allow-listed fields", () => {
    const privateClaim = {
      id: "claim-private",
      schemaVersion: 1,
      tenantId: "tenant-a",
      claimText: "Can reason about tenant-safe public AI.",
      claimType: "architecture",
      proposedByAgentRunId: null,
      evidenceStrength: "owner_asserted",
      evidenceSummary: "Private note that must not be copied.",
      sourceVersionIds: ["source-secret"],
      chunkContentHashes: ["hash-secret"],
      relatedEntityIds: ["entity-1"],
      relatedRelationshipIds: ["rel-1"],
      approvalStatus: "approved",
      visibility: "public",
      sensitivity: "public",
      publishState: "published",
      staleStatus: "current",
      createdAt: "2026-06-17T00:00:00.000Z",
      updatedAt: "2026-06-17T00:00:00.000Z",
      createdBy: "owner",
      updatedBy: "owner"
    } satisfies PrivateClaim;

    const publicClaim = serializePublicClaim({
      slug: "mjk",
      publicProfileId: "mjk",
      owningTenantId: "tenant-a",
      privateClaim,
      themeTags: ["privacy"],
      capabilityTags: ["tenant isolation"],
      publicEvidenceSummary: "Owner-curated Phase 1 proof point.",
      approvedByUid: "owner",
      sortOrder: 1,
      now: "2026-06-17T00:00:00.000Z"
    });

    expect(publicClaim.approvedPublicText).toBe(privateClaim.claimText);
    expect(publicClaim.publicEvidenceSummary).toBe("Owner-curated Phase 1 proof point.");
    expect(JSON.stringify(publicClaim)).not.toContain("source-secret");
    expect(JSON.stringify(publicClaim)).not.toContain("hash-secret");
    expect(JSON.stringify(publicClaim)).not.toContain("Private note");
  });
});

