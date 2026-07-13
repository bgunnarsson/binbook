import { test, expect } from "@playwright/test";

// The templates (Handlebars) sandbox runs on its own port; see playwright.config.
test.use({ baseURL: "http://localhost:6098" });

test("renders a Handlebars component and reflects live control edits", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Button", { exact: true }).click();
  await page.getByText("Ghost", { exact: true }).first().click();

  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe');
  const button = frame.locator("button.btn");
  await expect(button).toHaveText("Ghost");
  await expect(button).toHaveClass(/btn--ghost/);

  // Editing a control re-renders the template server-side with the new args.
  await page.getByLabel("label").fill("Purchase");
  await expect(button).toHaveText("Purchase");
});
