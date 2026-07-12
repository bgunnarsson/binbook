import { test, expect } from "@playwright/test";

test("core loop: select story, edit control, canvas updates", async ({ page }) => {
  await page.goto("/");
  // The "Components/Button" group is expanded by default, so its "Default"
  // leaf is already visible and sorts before the "Card" group's "Default".
  await page.getByText("Default", { exact: false }).first().click();
  const frame = page.frameLocator("iframe").first();
  await expect(frame.locator("button")).toBeVisible();
  const label = page.getByLabel("label");
  await label.fill("Purchase");
  await expect(frame.getByText("Purchase")).toBeVisible();
});

test("viewport preset resizes the canvas", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Default", { exact: false }).first().click();
  await page.getByRole("button", { name: /viewport/i }).click();
  await page.getByText("Mobile").click();
  const iframe = page.locator("iframe").first();
  await expect(iframe).toHaveCSS("width", "375px");
});

test("docs tab shows the args table", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Default", { exact: false }).first().click();
  await page.getByRole("tab", { name: /docs/i }).click();
  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  // Scope to the table cell: "label" also appears in the always-visible
  // Controls panel and in the raw source code block on this page.
  await expect(table.getByRole("cell", { name: "label" })).toBeVisible();
});
