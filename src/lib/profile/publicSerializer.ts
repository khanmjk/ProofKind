import type { PrivateClaim, PublicClaim } from "@/lib/types";

type PublicClaimInput = {
  slug: string;
  publicProfileId: string;
  owningTenantId: string;
  privateClaim: PrivateClaim;
  approvedPublicText?: string;
  themeTags: string[];
  capabilityTags: string[];
  publicEvidenceSummary: string;
  publicCitationRefs?: string[];
  approvedByUid: string;
  sortOrder: number;
  now: string;
};

export function serializePublicClaim(input: PublicClaimInput): PublicClaim {
  return {
    id: input.privateClaim.id,
    schemaVersion: 1,
    slug: input.slug,
    publicProfileId: input.publicProfileId,
    owningTenantId: input.owningTenantId,
    sourcePrivateClaimId: input.privateClaim.id,
    approvedPublicText: input.approvedPublicText ?? input.privateClaim.claimText,
    claimType: input.privateClaim.claimType,
    themeTags: input.themeTags,
    capabilityTags: input.capabilityTags,
    publicEvidenceSummary: input.publicEvidenceSummary,
    publicCitationRefs: input.publicCitationRefs ?? [],
    visibility: "public",
    staleStatus: "current",
    approvedByUid: input.approvedByUid,
    approvedAt: input.now,
    sortOrder: input.sortOrder,
    createdAt: input.now,
    updatedAt: input.now
  };
}

