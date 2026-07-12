import { expect, test } from "vitest";
import { VIEWPORTS } from "./viewports";

test("has the four presets with widths", () => {
  expect(VIEWPORTS.map((v) => v.name)).toEqual(["Mobile", "Tablet", "Desktop", "Full"]);
  expect(VIEWPORTS.find((v) => v.name === "Mobile")?.width).toBe(375);
});
