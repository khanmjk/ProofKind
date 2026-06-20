import { expect, test } from "@playwright/test";

test("public profile loads with profile assistant and CTAs", async ({ page }) => {
  await page.goto("/p/mjk");

  await expect(page.getByRole("heading", { name: "Muhammad Khan" })).toBeVisible();
  await expect(page.getByRole("button", { name: /ask profile/i })).toBeVisible();
  await expect(page.getByText("Book a conversation")).toBeVisible();
  await expect(page.getByText("I want one too")).toBeVisible();
});
