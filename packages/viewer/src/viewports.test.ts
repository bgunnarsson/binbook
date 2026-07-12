import { expect, test } from "vitest";
import { VIEWPORTS, viewportByKey } from "./viewports";

test("has the Atelier presets keyed responsive/mobile/tablet/desktop", () => {
  expect(VIEWPORTS.map((v) => v.key)).toEqual(["responsive", "mobile", "tablet", "desktop"]);
  expect(viewportByKey("mobile").width).toBe(390);
  expect(viewportByKey("responsive").width).toBeNull();
});

test("viewportByKey falls back to responsive for an unknown key", () => {
  expect(viewportByKey("nope").key).toBe("responsive");
});
