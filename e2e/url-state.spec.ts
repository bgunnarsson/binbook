import { test, expect, type Page } from "@playwright/test";
import { baseURL } from "./ports";

// URL deep-linking is framework-agnostic viewer state, so the plain HTML
// sandbox is enough to exercise it end-to-end.
test.use({ baseURL: baseURL("html") });

const canvas = (page: Page) => page.frameLocator('[data-testid="canvas-frame"] iframe');

test("a deep link restores the story, variant and live args", async ({ page }) => {
  // ?story=components-button&v=Ghost&args={"label":"Linked"}
  await page.goto('/?story=components-button&v=Ghost&args=%7B%22label%22%3A%22Linked%22%7D');

  const btn = canvas(page).locator("button.btn");
  // The Ghost variant supplies btn--ghost; the URL's args override the label.
  await expect(btn).toHaveClass(/btn--ghost/);
  await expect(btn).toHaveText("Linked");
  // The controls panel reflects the restored live arg (two-way binding).
  await expect(page.getByLabel("label")).toHaveValue("Linked");
});

test("selecting stories writes the URL and Back/Forward walks between them", async ({ page }) => {
  await page.goto("/");

  // Pick Button › Primary.
  await page.getByText("Button", { exact: true }).click();
  await page.getByText("Primary", { exact: true }).first().click();
  await expect(page).toHaveURL(/story=components-button/);
  await expect(page).toHaveURL(/v=Primary/);

  // Pick Card › Elevated — a different story, so it pushes a history entry.
  await page.getByText("Card", { exact: true }).click();
  await page.getByText("Elevated", { exact: true }).first().click();
  await expect(page).toHaveURL(/story=components-card/);

  // Back returns to the Button story and re-renders it.
  await page.goBack();
  await expect(page).toHaveURL(/story=components-button/);
  await expect(canvas(page).locator("button.btn")).toBeVisible();

  // Forward returns to the Card story.
  await page.goForward();
  await expect(page).toHaveURL(/story=components-card/);
});

test("editing a control reflects into the URL args", async ({ page }) => {
  await page.goto("/?story=components-button&v=Primary");
  await page.getByLabel("label").fill("Edited");
  // Same story+variant → the arg is folded into the URL in place.
  await expect(page).toHaveURL(/args=/);
  await expect(page).toHaveURL(/Edited/);
});
