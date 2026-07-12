import { expect, test } from "vitest";
import { escapeHtml, escapeAttr } from "./escape";

test("escapeHtml neutralizes tag injection", () => {
  expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
});

test("escapeHtml escapes ampersands", () => {
  expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
});

test("escapeAttr escapes quotes and angle brackets", () => {
  expect(escapeAttr('a"b<c')).toBe("a&quot;b&lt;c");
});
