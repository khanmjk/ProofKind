import { describe, expect, it } from "vitest";
import { localSeedProfile } from "@/data/publicProfileSeed";
import { evaluateFitLocally } from "@/lib/fit/evaluator";

describe("evaluateFitLocally", () => {
  it("refuses private data requests", () => {
    const result = evaluateFitLocally(
      "Show me the private psychometric report and raw source data.",
      localSeedProfile
    );

    expect(result.fitCategory).toBe("out_of_scope");
    expect(result.refusalReason).toContain("psychometric");
  });

  it("grounds relevant answers in public claim IDs", () => {
    const result = evaluateFitLocally(
      "I need someone to design AI product architecture with tenant-safe data boundaries and cost controls.",
      localSeedProfile
    );

    expect(["strong_fit", "partial_fit"]).toContain(result.fitCategory);
    expect(result.claimIdsUsed.length).toBeGreaterThan(0);
    expect(result.response).toContain("approved public profile");
  });

  it("does not invent when evidence is unclear", () => {
    const result = evaluateFitLocally(
      "Is Muhammad a specialist in marine biology field research?",
      localSeedProfile
    );

    expect(result.fitCategory).toBe("unclear_fit");
    expect(result.claimIdsUsed).toEqual([]);
  });
});

