import { expect, test } from "vitest";
import { defineConfig } from "./config";

test("defineConfig returns the config unchanged (typed identity)", () => {
  const cfg = defineConfig({ stories: ["a/**/*.binbook.json"], adapters: [] });
  expect(cfg.stories).toEqual(["a/**/*.binbook.json"]);
});

test("defineConfig applies a default port", () => {
  const cfg = defineConfig({ stories: [], adapters: [] });
  expect(cfg.port).toBe(6006);
});
