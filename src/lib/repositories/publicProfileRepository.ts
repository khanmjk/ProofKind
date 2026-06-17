import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { localSeedProfile } from "@/data/publicProfileSeed";
import type { PublicClaim, PublicFitSession, PublicProfile, PublicSection } from "@/lib/types";

type FirestoreTimestampLike = Timestamp | string | undefined;

function toIso(value: FirestoreTimestampLike) {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return value;
}

function withDates<T extends Record<string, unknown>>(data: T) {
  return {
    ...data,
    createdAt: toIso(data.createdAt as FirestoreTimestampLike),
    updatedAt: toIso(data.updatedAt as FirestoreTimestampLike)
  };
}

export class PublicProfileRepository {
  private readonly db = getAdminDb();

  async getPublishedProfile(slug: string): Promise<PublicProfile | null> {
    const profileRef = this.db.collection("publicProfiles").doc(slug);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      return process.env.NODE_ENV === "production" ? null : localSeedProfile;
    }

    const profileData = withDates(profileSnap.data() ?? {});

    if (
      profileData.publishState !== "published" ||
      profileData.publicEndpointEnabled !== true
    ) {
      return null;
    }

    const [sectionSnaps, claimSnaps] = await Promise.all([
      profileRef.collection("publicSections").orderBy("sortOrder", "asc").get(),
      profileRef.collection("publicClaims").orderBy("sortOrder", "asc").get()
    ]);

    const sections = sectionSnaps.docs.map((doc) => ({
      id: doc.id,
      ...withDates(doc.data())
    })) as PublicSection[];

    const claims = claimSnaps.docs.map((doc) => ({
      id: doc.id,
      ...withDates(doc.data())
    })) as PublicClaim[];

    return {
      id: profileSnap.id,
      ...(profileData as Omit<PublicProfile, "id" | "sections" | "claims">),
      sections,
      claims
    };
  }

  async createFitSession(slug: string, session: PublicFitSession) {
    await this.db
      .collection("publicProfiles")
      .doc(slug)
      .collection("publicFitSessions")
      .doc(session.visitorSessionId)
      .set(session);
  }
}

