import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "../src/lib/firebase/admin";
import { localSeedProfile, privateClaims, publicSections } from "../src/data/publicProfileSeed";

function timestamp(value: string) {
  return Timestamp.fromDate(new Date(value));
}

function withFirestoreDates<T extends { createdAt: string; updatedAt: string }>(value: T) {
  return {
    ...value,
    createdAt: timestamp(value.createdAt),
    updatedAt: timestamp(value.updatedAt)
  };
}

async function seed() {
  const db = getAdminDb();
  const profile = localSeedProfile;
  const profileRef = db.collection("publicProfiles").doc(profile.slug);
  const tenantRef = db.collection("tenants").doc(profile.owningTenantId);
  const batch = db.batch();

  batch.set(tenantRef, {
    schemaVersion: 1,
    tenantId: profile.owningTenantId,
    displayName: profile.displayName,
    createdAt: timestamp(profile.createdAt),
    updatedAt: timestamp(profile.updatedAt),
    createdBy: "seed-script",
    updatedBy: "seed-script"
  });

  batch.set(profileRef, {
    schemaVersion: profile.schemaVersion,
    slug: profile.slug,
    owningTenantId: profile.owningTenantId,
    displayName: profile.displayName,
    headline: profile.headline,
    summary: profile.summary,
    locationLabel: profile.locationLabel,
    availabilityLabel: profile.availabilityLabel,
    bookingUrl: process.env.PROOFKIND_BOOKING_URL ?? profile.bookingUrl,
    interestCaptureUrl: process.env.PROOFKIND_INTEREST_CAPTURE_URL ?? profile.interestCaptureUrl,
    publishState: profile.publishState,
    publicEndpointEnabled: profile.publicEndpointEnabled,
    createdAt: timestamp(profile.createdAt),
    updatedAt: timestamp(profile.updatedAt)
  });

  for (const privateClaim of privateClaims) {
    batch.set(
      tenantRef.collection("claims").doc(privateClaim.id),
      withFirestoreDates(privateClaim)
    );
  }

  for (const section of publicSections) {
    batch.set(
      profileRef.collection("publicSections").doc(section.id),
      withFirestoreDates(section)
    );
  }

  for (const claim of profile.claims) {
    batch.set(
      profileRef.collection("publicClaims").doc(claim.id),
      {
        ...withFirestoreDates(claim),
        approvedAt: timestamp(claim.approvedAt)
      }
    );
  }

  await batch.commit();
  console.log(`Seeded public profile /p/${profile.slug} into project ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "proofkind-mvp"}`);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

