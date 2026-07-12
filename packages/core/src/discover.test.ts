import { fileURLToPath } from "node:url";
import path from "node:path";
import { expect, test } from "vitest";
import { discoverStories } from "./discover";

const root = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(root, "../test/fixtures/stories");

test("discovers all .binbook.json files under the glob", async () => {
  const stories = await discoverStories({ stories: [`${fixtures}/**/*.binbook.json`], adapters: [] });
  expect(stories.map((s) => s.title).sort()).toEqual(["Components/Button", "Components/Card"]);
});
