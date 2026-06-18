import type { PublicProfile } from "@/lib/types";

const now = "2026-06-18T00:00:00.000Z";

export const publicProfileFixture: PublicProfile = {
  id: "mjk",
  schemaVersion: 1,
  slug: "mjk",
  owningTenantId: "founder-mjk",
  displayName: "Muhammad Khan",
  headline: "AI product and architecture leader",
  summary: "Generated profile fixture used for unit tests.",
  locationLabel: "Cape Town",
  availabilityLabel: "Selected conversations",
  bookingUrl: "",
  interestCaptureUrl: "",
  publishState: "published",
  publicEndpointEnabled: true,
  createdAt: now,
  updatedAt: now,
  sections: [
    {
      id: "section-1",
      schemaVersion: 1,
      slug: "mjk",
      publicProfileId: "mjk",
      heading: "AI Product Architecture",
      body: "Designs AI product architecture with tenant-safe data boundaries and cost controls.",
      sortOrder: 1,
      createdAt: now,
      updatedAt: now
    }
  ],
  claims: [
    {
      id: "claim-1",
      schemaVersion: 1,
      slug: "mjk",
      publicProfileId: "mjk",
      owningTenantId: "founder-mjk",
      sourcePrivateClaimId: "private-claim-1",
      approvedPublicText:
        "Designs AI product architecture with tenant-safe data boundaries, public/private retrieval separation, and explicit cloud cost controls.",
      claimType: "architecture",
      themeTags: ["AI systems", "governance"],
      capabilityTags: ["AI product architecture", "tenant isolation", "cost control"],
      publicEvidenceSummary: "Generated from ingested professional evidence.",
      publicCitationRefs: ["sourceVersion:version-1"],
      visibility: "public",
      staleStatus: "current",
      approvedByUid: "owner-mjk",
      approvedAt: now,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now
    }
  ]
};
