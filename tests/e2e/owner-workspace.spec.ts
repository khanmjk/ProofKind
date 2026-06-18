import { expect, test } from "@playwright/test";

test("owner workspace supports chat-first profile preview review", async ({ page }) => {
  await page.goto("/owner");

  await expect(page.getByRole("heading", { name: "Professional identity session" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Generated profile experience" })).toBeVisible();
  await expect(page.getByRole("button", { name: "AI Product Leader" })).toBeVisible();

  await page.getByRole("button", { name: "Writing-Led Profile" }).click();
  await expect(page.getByText("A systems thinker whose public writing reveals")).toBeVisible();

  await page.getByRole("tab", { name: "Claims" }).click();
  await expect(page.getByText("Designs AI products as tenant-safe systems")).toBeVisible();

  await page.getByPlaceholder("Ask ProofKind to revise the profile, design, evidence, or public preview.").fill(
    "Make it more premium and use more Blogger evidence."
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("I shifted the preview toward public writing.")).toBeVisible();
});
