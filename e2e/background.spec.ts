import { test, expect } from "@playwright/test";

test("canvas uses the project's configured background and injected stylesheet", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Button", { exact: true }).click();
  await page.getByText("Primary", { exact: false }).first().click();

  // `background` from binbook.config.ts is applied to the canvas iframe.
  const iframe = page.locator('[data-testid="canvas-frame"] iframe');
  await expect(iframe).toHaveCSS("background-color", "rgb(0, 0, 0)");

  // The project's own CSS (`.btn { letter-spacing: 3px }`) is injected into the
  // sandboxed canvas, so the rendered button picks it up.
  const button = page.frameLocator('[data-testid="canvas-frame"] iframe').locator("button.btn").first();
  await expect(button).toHaveCSS("letter-spacing", "3px");

  // Isolation: the project's `body { padding: 24px }` lives only in the iframe
  // document — it must NOT leak into the viewer chrome.
  await expect(page.locator("body")).toHaveCSS("padding", "0px");
});
