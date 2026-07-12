import { expect, test } from "vitest";
import { isArgType, ARG_TYPES } from "./index";

test("isArgType accepts declared arg types", () => {
  for (const t of ARG_TYPES) expect(isArgType(t)).toBe(true);
});

test("isArgType rejects unknown types", () => {
  expect(isArgType("date")).toBe(false);
  expect(isArgType("")).toBe(false);
});
