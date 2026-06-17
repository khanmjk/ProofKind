import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";

describe("firestore.rules", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "proofkind-rules-test",
      firestore: {
        rules: readFileSync("firestore.rules", "utf8")
      }
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc("publicProfiles/mjk").set({
        publishState: "published",
        publicEndpointEnabled: true
      });
      await db.doc("publicProfiles/mjk/publicClaims/claim-1").set({
        approvedPublicText: "Public claim"
      });
      await db.doc("publicProfiles/mjk/publicFitSessions/session-1").set({
        question: "private server-written session"
      });
      await db.doc("tenants/tenant-a/claims/claim-1").set({
        tenantId: "tenant-a",
        claimText: "Private tenant claim"
      });
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("allows anonymous reads of published public profile content", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await expect(assertSucceeds(db.doc("publicProfiles/mjk").get())).resolves.toBeDefined();
    await expect(
      assertSucceeds(db.doc("publicProfiles/mjk/publicClaims/claim-1").get())
    ).resolves.toBeDefined();
  });

  it("denies anonymous tenant reads and public writes", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await expect(assertFails(db.doc("tenants/tenant-a/claims/claim-1").get())).resolves.toBeDefined();
    await expect(
      assertFails(db.doc("publicProfiles/mjk").set({ publishState: "published" }))
    ).resolves.toBeDefined();
    await expect(
      assertFails(db.doc("publicProfiles/mjk/publicFitSessions/session-2").set({ question: "x" }))
    ).resolves.toBeDefined();
    await expect(
      assertFails(db.doc("publicProfiles/mjk/publicFitSessions/session-1").get())
    ).resolves.toBeDefined();
  });
});

