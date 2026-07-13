import { test, expect } from "@playwright/test";

// The React sandbox (with hydration) runs on its own port; see playwright.config.
test.use({ baseURL: "http://localhost:6099" });

test("react stories hydrate: client state persists with no server round-trip", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));

  await page.goto("/");
  await page.getByText("Counter", { exact: true }).click();
  await page.getByText("Default", { exact: true }).first().click();

  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe');
  const count = frame.getByLabel("count");
  await expect(count).toHaveText(/Count:\s*0/);

  // Clicking updates React state in the iframe. A server round-trip would
  // re-render from the unchanged args and reset to 0, so reaching 3 proves the
  // component was hydrated and is running live in the canvas.
  const inc = frame.getByLabel("increment");
  await inc.click();
  await inc.click();
  await inc.click();
  await expect(count).toHaveText(/Count:\s*3/);

  // Decrement works too, and hydration produced no mismatch warnings.
  await frame.getByLabel("decrement").click();
  await expect(count).toHaveText(/Count:\s*2/);
  expect(consoleErrors).toEqual([]);
});
