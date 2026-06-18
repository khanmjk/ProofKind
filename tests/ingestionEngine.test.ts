import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/ingestion/chunker";
import { classifySource } from "@/lib/ingestion/classifier";
import { parseDocument } from "@/lib/ingestion/documentParser";
import { materializeGeneratedProfile } from "@/lib/profile/profileGenerator";

describe("ingestion engine", () => {
  it("classifies psychometric reports as sensitive private-supported evidence", () => {
    const result = classifySource(
      "CliftonStrengths_All34_Feb2024.pdf",
      "assessments/CliftonStrengths_All34_Feb2024.pdf",
      "Gallup CliftonStrengths report with theme sequence"
    );

    expect(result.documentFamily).toBe("psychometric_report");
    expect(result.sensitivity).toBe("sensitive");
    expect(result.visibility).toBe("private_supported");
  });

  it("chunks parsed text with stable lineage fields", () => {
    const chunks = chunkText({
      tenantId: "tenant-a",
      sourceItemId: "source-1",
      sourceVersionId: "version-1",
      text: "A".repeat(6_000),
      parser: "test-parser",
      parserVersion: "1",
      sensitivity: "internal",
      visibility: "public_candidate",
      rightsStatus: "owner_provided",
      createdAt: "2026-06-18T00:00:00.000Z",
      createdBy: "owner"
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.tenantId).toBe("tenant-a");
    expect(chunks[0]?.sourceVersionId).toBe("version-1");
    expect(chunks[0]?.contentHash).toMatch(/^chunk_/);
  });

  it("parses plain text documents", async () => {
    const dir = await mkdtemp(join(tmpdir(), "proofkind-parser-"));
    const file = join(dir, "profile.txt");

    await writeFile(file, "Led product discovery and platform architecture work.");

    try {
      const parsed = await parseDocument(file);
      expect(parsed.parser).toBe("plain-text");
      expect(parsed.text).toContain("platform architecture");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("materializes generated claims only when publish is requested", () => {
    const generated = {
      displayName: "Muhammad Khan",
      headline: "AI product and architecture leader",
      summary: "Generated from ingested professional evidence with private/public boundaries.",
      locationLabel: "Cape Town",
      availabilityLabel: "Selected conversations",
      sections: [
        {
          heading: "Operating Pattern",
          body: "Turns ambiguous platform and AI product problems into an executable path."
        },
        {
          heading: "Evidence Base",
          body: "Claims are generated from parsed source chunks and preserve lineage."
        }
      ],
      claims: [
        {
          claimText: "Turns ambiguous platform and AI product problems into an executable path.",
          claimType: "architecture",
          themeTags: ["AI systems"],
          capabilityTags: ["product architecture"],
          evidenceSummary: "Supported by an ingested profile document.",
          sourceVersionIds: ["version-1"],
          chunkContentHashes: ["chunk-1"],
          sensitivity: "internal" as const,
          visibility: "public_candidate" as const
        }
      ],
      missingContextQuestions: []
    };

    const draft = materializeGeneratedProfile(generated, {
      tenantId: "tenant-a",
      slug: "mjk",
      ownerUid: "owner",
      publish: false,
      bookingUrl: "",
      interestCaptureUrl: "",
      agentRunId: "run-1",
      model: "test",
      modelVersion: "1"
    });

    const published = materializeGeneratedProfile(generated, {
      tenantId: "tenant-a",
      slug: "mjk",
      ownerUid: "owner",
      publish: true,
      bookingUrl: "",
      interestCaptureUrl: "",
      agentRunId: "run-1",
      model: "test",
      modelVersion: "1"
    });

    expect(draft.publicClaims).toHaveLength(0);
    expect(draft.privateClaims[0]?.approvalStatus).toBe("draft");
    expect(published.publicClaims).toHaveLength(1);
    expect(published.privateClaims[0]?.approvalStatus).toBe("approved");
    expect(published.profile.publicEndpointEnabled).toBe(true);
  });
});
