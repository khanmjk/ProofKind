import { expect, test } from "@playwright/test";

test("owner workspace supports chat-first knowledge and profile review", async ({ page }) => {
  await page.goto("/owner");

  await expect(page.getByRole("heading", { name: "Professional knowledge session" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Knowledge-to-profile workbench" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Knowledge Base" })).toBeVisible();
  await expect(page.getByRole("button", { name: "AI Product Leader" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "CV and resume history" })).toBeVisible();

  await page.getByRole("button", { name: "Writing-Led Profile" }).click();
  await page.getByRole("tab", { name: "Target Profile" }).click();
  await expect(page.getByText("Targeting brief from job spec")).toBeVisible();
  await expect(page.getByText("A systems thinker whose public writing reveals")).toBeVisible();

  await page.getByRole("tab", { name: "Public Q&A" }).click();
  await expect(page.getByText("Who is Muhammad?")).toBeVisible();

  await page.getByRole("tab", { name: "Claims" }).click();
  await expect(page.getByText("Designs AI products as tenant-safe systems")).toBeVisible();

  await page.getByPlaceholder("Ask ProofKind to classify sources, map relationships, target a job spec, or revise the public profile.").fill(
    "Use this job spec to generate a targeted public profile."
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("I treated that as a target-profile request.")).toBeVisible();
});
