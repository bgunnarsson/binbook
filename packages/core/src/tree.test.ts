import { expect, test } from "vitest";
import { buildTree } from "./tree";
import type { Story } from "@bgunnarsson/binbook-types";

const story = (title: string, variants: string[]): Story => ({
  id: title.toLowerCase().replace(/\W+/g, "-"),
  title,
  component: "x",
  args: {},
  variants: variants.map((name) => ({ name, args: {} })),
  file: "/x",
});

test("nests by slash path and adds a leaf per variant", () => {
  const tree = buildTree([story("Components/Button", ["Default", "Ghost"])]);
  expect(tree[0].name).toBe("Components");
  const button = tree[0].children[0];
  expect(button.name).toBe("Button");
  expect(button.children.map((c) => c.leaf?.variant)).toEqual(["Default", "Ghost"]);
});
