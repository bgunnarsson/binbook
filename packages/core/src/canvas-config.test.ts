import { test, expect } from "vitest";
import { resolveCanvasConfig } from "./canvas-config";

test("defaults to white with no styles", () => {
  expect(resolveCanvasConfig({ stories: [], adapters: [] })).toEqual({
    background: "#ffffff",
    styles: [],
  });
});

test("keeps a configured background and maps styles to indexed raw-css URLs", () => {
  const cfg = resolveCanvasConfig({
    stories: [],
    adapters: [],
    background: "#1a1a2e",
    styles: ["./src/app.css", "theme/b.css"],
  });
  expect(cfg.background).toBe("#1a1a2e");
  expect(cfg.styles).toEqual(["/__binbook_style/0.css", "/__binbook_style/1.css"]);
});
