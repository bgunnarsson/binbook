import { test, expect } from "vitest";
import { resolveCanvasConfig } from "./canvas-config";

test("defaults to white with no styles", () => {
  expect(resolveCanvasConfig({ stories: [], adapters: [] }, "/proj")).toEqual({
    background: "#ffffff",
    styles: [],
  });
});

test("keeps a configured background and resolves styles to /@fs URLs", () => {
  const cfg = resolveCanvasConfig(
    { stories: [], adapters: [], background: "#1a1a2e", styles: ["./src/app.css", "theme/b.css"] },
    "/proj",
  );
  expect(cfg.background).toBe("#1a1a2e");
  expect(cfg.styles).toEqual(["/@fs/proj/src/app.css", "/@fs/proj/theme/b.css"]);
});
