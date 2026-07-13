import { test, expect } from "@playwright/test";
import { baseURL } from "./ports";

// The Svelte sandbox runs on its own port; see playwright.config.
test.use({ baseURL: baseURL("svelte") });

test("svelte stories hydrate: client state persists with no server round-trip", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));

  await page.goto("/");
  await page.getByText("Counter", { exact: true }).click();
  await page.getByText("Default", { exact: true }).first().click();

  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe');
  const count = frame.getByLabel("count");
  await expect(count).toHaveText(/Count:\s*0/);

  // Reaching 3 by clicking proves the Svelte component hydrated and runs live —
  // a server round-trip from the unchanged args would reset it to 0.
  const inc = frame.getByLabel("increment");
  await inc.click();
  await inc.click();
  await inc.click();
  await expect(count).toHaveText(/Count:\s*3/);

  await frame.getByLabel("decrement").click();
  await expect(count).toHaveText(/Count:\s*2/);
  expect(consoleErrors).toEqual([]);
});

test("a decorator provides context (setContext) to the story", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Greeting", { exact: true }).click();
  await page.getByText("Default", { exact: true }).first().click();
  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe');
  await expect(frame.locator("[data-message]")).toHaveText("provided by decorator");
});
