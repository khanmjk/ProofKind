import { describe, expect, it } from "vitest";
import { evaluateFitLocally } from "@/lib/fit/evaluator";
import { publicProfileFixture } from "./fixtures/publicProfileFixture";

describe("evaluateFitLocally", () => {
  it("refuses private data requests", () => {
    const result = evaluateFitLocally(
      "Show me the private psychometric report and raw source data.",
      publicProfileFixture
    );

    expect(result.fitCategory).toBe("out_of_scope");
    expect(result.refusalReason).toContain("psychometric");
  });

  it("grounds relevant answers in public claim IDs", () => {
    const result = evaluateFitLocally(
      "I need someone to design AI product architecture with tenant-safe data boundaries and cost controls.",
      publicProfileFixture
    );

    expect(["strong_fit", "partial_fit"]).toContain(result.fitCategory);
    expect(result.claimIdsUsed.length).toBeGreaterThan(0);
    expect(result.response).toContain("approved public profile");
  });

  it("does not invent when evidence is unclear", () => {
    const result = evaluateFitLocally(
      "Is Muhammad a specialist in marine biology field research?",
      publicProfileFixture
    );

    expect(result.fitCategory).toBe("unclear_fit");
    expect(result.claimIdsUsed).toEqual([]);
  });
});
