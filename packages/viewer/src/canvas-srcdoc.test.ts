import { expect, test } from "vitest";
import { buildSrcDoc, CANVAS_SOURCE } from "./canvas-srcdoc";

test("wraps html in a document and injects the action bridge", () => {
  const doc = buildSrcDoc("<button>Hi</button>");
  expect(doc).toContain("<!doctype html>");
  expect(doc).toContain("<button>Hi</button>");
  expect(doc).toContain(CANVAS_SOURCE);
  expect(doc).toContain('kind: "action"');
});

test("emits asset tags for css and js", () => {
  const doc = buildSrcDoc("<x></x>", { assets: ["/a.css", "/b.js"] });
  expect(doc).toContain('<link rel="stylesheet" href="/a.css">');
  expect(doc).toContain('<script type="module" src="/b.js"></script>');
});

test("only injects the axe runner when axe source is provided", () => {
  expect(buildSrcDoc("<x></x>")).not.toContain("window.axe");
  const withAxe = buildSrcDoc("<x></x>", { axeSource: "window.axe = {};" });
  expect(withAxe).toContain("window.axe = {};");
  expect(withAxe).toContain("window.axe"); // runner references it
});
