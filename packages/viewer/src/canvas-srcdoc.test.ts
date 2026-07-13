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

test("injects the client script after the markup, before the bridge", () => {
  const doc = buildSrcDoc("<div id='binbook-root'></div>", { clientScript: "window.HYDRATED = 1;" });
  expect(doc).toContain("window.HYDRATED = 1;");
  expect(doc.indexOf("binbook-root")).toBeLessThan(doc.indexOf("window.HYDRATED"));
  expect(doc.indexOf("window.HYDRATED")).toBeLessThan(doc.indexOf(CANVAS_SOURCE));
});

test("neutralizes a literal </script> inside the client script", () => {
  const doc = buildSrcDoc("<x></x>", { clientScript: 'var s = "</script>";' });
  expect(doc).not.toContain('"</script>"');
  expect(doc).toContain("<\\/script>");
});

test("omits the client script slot when none is provided", () => {
  const doc = buildSrcDoc("<x></x>");
  expect(doc).toContain("<body><x></x><script>"); // straight to the bridge
});

test("only injects the axe runner when axe source is provided", () => {
  expect(buildSrcDoc("<x></x>")).not.toContain("window.axe");
  const withAxe = buildSrcDoc("<x></x>", { axeSource: "window.axe = {};" });
  expect(withAxe).toContain("window.axe = {};");
  expect(withAxe).toContain("window.axe"); // runner references it
});
