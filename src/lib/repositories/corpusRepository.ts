import type { WriteBatch } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  PrivateClaim,
  PublicClaim,
  PublicProfile,
  PublicSection,
  SourceChunk,
  SourceItem,
  SourceRoot,
  SourceVersion
} from "@/lib/types";

export type CorpusChunkRecord = {
  chunk: SourceChunk;
  sourceItem: SourceItem | null;
  sourceVersion: SourceVersion | null;
};

type GeneratedProfileWrite = {
  profile: PublicProfile;
  privateClaims: PrivateClaim[];
  publicClaims: PublicClaim[];
  publicSections: PublicSection[];
};

export class CorpusRepository {
  private readonly db = getAdminDb();

  private tenantRef(tenantId: string) {
    return this.db.collection("tenants").doc(tenantId);
  }

  async upsertSourceRoot(root: SourceRoot) {
    await this.tenantRef(root.tenantId).collection("sourceRoots").doc(root.id).set(root, { merge: true });
  }

  async upsertParsedSource(input: {
    sourceItem: SourceItem;
    sourceVersion: SourceVersion;
    chunks: SourceChunk[];
  }) {
    const tenantRef = this.tenantRef(input.sourceItem.tenantId);
    const sourceItemRef = tenantRef.collection("sourceItems").doc(input.sourceItem.id);
    const sourceVersionRef = tenantRef.collection("sourceVersions").doc(input.sourceVersion.id);

    let batch = this.db.batch();
    let operationCount = 0;

    const commitIfNeeded = async (force = false) => {
      if (operationCount > 0 && (force || operationCount >= 400)) {
        await batch.commit();
        batch = this.db.batch();
        operationCount = 0;
      }
    };

    batch.set(sourceItemRef, input.sourceItem, { merge: true });
    operationCount += 1;
    batch.set(sourceVersionRef, input.sourceVersion, { merge: true });
    operationCount += 1;

    for (const chunk of input.chunks) {
      await commitIfNeeded();
      batch.set(tenantRef.collection("sourceChunks").doc(chunk.id), chunk, { merge: true });
      operationCount += 1;
    }

    await commitIfNeeded(true);
  }

  async readCorpusChunks(tenantId: string, limit: number): Promise<CorpusChunkRecord[]> {
    const tenantRef = this.tenantRef(tenantId);
    const chunkSnap = await tenantRef.collection("sourceChunks").limit(limit).get();
    const chunks = chunkSnap.docs.map((doc) => doc.data() as SourceChunk);
    const versionIds = Array.from(new Set(chunks.map((chunk) => chunk.sourceVersionId)));
    const itemIds = Array.from(new Set(chunks.map((chunk) => chunk.sourceItemId)));

    const [versionSnaps, itemSnaps] = await Promise.all([
      Promise.all(versionIds.map((id) => tenantRef.collection("sourceVersions").doc(id).get())),
      Promise.all(itemIds.map((id) => tenantRef.collection("sourceItems").doc(id).get()))
    ]);

    const versions = new Map(
      versionSnaps
        .filter((snap) => snap.exists)
        .map((snap) => [snap.id, snap.data() as SourceVersion])
    );
    const items = new Map(
      itemSnaps
        .filter((snap) => snap.exists)
        .map((snap) => [snap.id, snap.data() as SourceItem])
    );

    return chunks.map((chunk) => ({
      chunk,
      sourceItem: items.get(chunk.sourceItemId) ?? null,
      sourceVersion: versions.get(chunk.sourceVersionId) ?? null
    }));
  }

  async createAgentRun(input: {
    tenantId: string;
    runType: string;
    model: string;
    modelVersion: string;
    promptVersion: string;
    createdBy: string;
  }) {
    const now = new Date().toISOString();
    const ref = this.tenantRef(input.tenantId).collection("agentRuns").doc();

    await ref.set({
      schemaVersion: 1,
      tenantId: input.tenantId,
      runType: input.runType,
      status: "running",
      model: input.model,
      modelVersion: input.modelVersion,
      promptVersion: input.promptVersion,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      updatedBy: input.createdBy
    });

    return ref.id;
  }

  async completeAgentRun(tenantId: string, agentRunId: string, output: Record<string, unknown>) {
    await this.tenantRef(tenantId).collection("agentRuns").doc(agentRunId).set(
      {
        status: "completed",
        output,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }

  async failAgentRun(tenantId: string, agentRunId: string, errorSummary: string) {
    await this.tenantRef(tenantId).collection("agentRuns").doc(agentRunId).set(
      {
        status: "failed",
        errorSummary,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }

  async writeGeneratedProfile(input: GeneratedProfileWrite) {
    const tenantRef = this.tenantRef(input.profile.owningTenantId);
    const profileRef = this.db.collection("publicProfiles").doc(input.profile.slug);
    const { sections: _sections, claims: _claims, ...profileDocument } = input.profile;

    let batch = this.db.batch();
    const commit = async () => {
      await batch.commit();
      batch = this.db.batch();
    };

    input.privateClaims.forEach((claim) => {
      batch.set(tenantRef.collection("claims").doc(claim.id), claim, { merge: true });
    });

    if (input.profile.publishState !== "published") {
      await commit();
      return;
    }

    for (const collectionId of ["publicClaims", "publicSections"] as const) {
      const existing = await profileRef.collection(collectionId).get();
      existing.docs.forEach((doc) => batch.delete(doc.ref));
      if (existing.size > 350) await commit();
    }

    batch.set(profileRef, profileDocument, { merge: true });

    await commit();

    let claimBatch: WriteBatch = this.db.batch();
    let operationCount = 0;
    const commitClaimBatchIfNeeded = async (force = false) => {
      if (operationCount > 0 && (force || operationCount >= 400)) {
        await claimBatch.commit();
        claimBatch = this.db.batch();
        operationCount = 0;
      }
    };

    for (const section of input.publicSections) {
      claimBatch.set(profileRef.collection("publicSections").doc(section.id), section);
      operationCount += 1;
    }

    for (const claim of input.publicClaims) {
      await commitClaimBatchIfNeeded();
      claimBatch.set(profileRef.collection("publicClaims").doc(claim.id), claim);
      operationCount += 1;
    }

    await commitClaimBatchIfNeeded(true);
  }
}
