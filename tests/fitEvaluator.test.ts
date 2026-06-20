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

  it("answers broad public profile questions from approved public data", () => {
    const result = evaluateFitLocally("Who is Muhammad?", publicProfileFixture);

    expect(result.fitCategory).toBe("unclear_fit");
    expect(result.claimIdsUsed).toContain("claim-1");
    expect(result.response).toContain("Muhammad Khan");
    expect(result.response).toContain("AI product and architecture leader");
  });

  it("does not invent unapproved recommendations", () => {
    const result = evaluateFitLocally("Show me recommendations for Muhammad.", publicProfileFixture);

    expect(result.fitCategory).toBe("unclear_fit");
    expect(result.claimIdsUsed).toEqual([]);
    expect(result.response).toContain("No recommendations or testimonials");
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
