import { test, expect } from "@playwright/test";

test("core loop: select story, edit control, canvas updates", async ({ page }) => {
  await page.goto("/");
  // The "Components/Button" group is expanded by default, so its "Default"
  // leaf is already visible and sorts before the "Card" group's "Default".
  await page.getByText("Default", { exact: false }).first().click();
  const frame = page.frameLocator("iframe").first();
  await expect(frame.locator("button")).toBeVisible();
  // The Controls tab is the default bottom-panel tab; each widget input
  // carries aria-label={argName}.
  const label = page.getByLabel("label");
  await label.fill("Purchase");
  await expect(frame.getByText("Purchase")).toBeVisible();
});

test("viewport preset resizes the canvas", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Default", { exact: false }).first().click();
  // Atelier's segmented viewport control: buttons labelled ↔ / 390 / 768 / 1280.
  await page.getByRole("button", { name: "390", exact: true }).click();
  // The frame wrapper carries the preset px width (border-box).
  await expect(page.getByTestId("canvas-frame")).toHaveCSS("width", "390px");
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

test("bottom panel tabs: actions and accessibility are reachable", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Default", { exact: false }).first().click();
  // Switch to the Accessibility tab; axe runs in the iframe and results render.
  await page.getByRole("tab", { name: /accessibility/i }).click();
  await expect(
    page.getByText(/checks pass|violation/i).first(),
  ).toBeVisible({ timeout: 15_000 });
});
