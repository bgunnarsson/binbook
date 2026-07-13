import { expect, test } from "vitest";
import { parseStoryFile } from "./parse-story";

const raw = {
  title: "Components/Button",
  description: "Primary CTA.",
  component: "./button.html",
  args: {
    label: { type: "text", default: "Click me" },
    variant: { type: "select", options: ["primary", "ghost"], default: "primary" },
  },
  stories: [
    { name: "Default", args: {} },
    { name: "Ghost", args: { variant: "ghost" } },
  ],
};

test("parses a valid story file into a Story", () => {
  const story = parseStoryFile(raw, "/abs/button.binbook.json");
  expect(story.title).toBe("Components/Button");
  expect(story.file).toBe("/abs/button.binbook.json");
  expect(story.variants.map((v) => v.name)).toEqual(["Default", "Ghost"]);
  expect(story.id).toBe("components-button");
});

test("parses optional decorators", () => {
  const withDecos = { ...raw, decorators: ["../deco/withRouter.tsx", "./withTheme.tsx#Theme"] };
  const story = parseStoryFile(withDecos, "/abs/button.binbook.json");
  expect(story.decorators).toEqual(["../deco/withRouter.tsx", "./withTheme.tsx#Theme"]);
  // absent by default
  expect(parseStoryFile(raw, "/abs/button.binbook.json").decorators).toBeUndefined();
});

test("normalizes a string wrapper and leaves it on the story", () => {
  const story = parseStoryFile({ ...raw, wrapper: "  width: 400px  " }, "/abs/x.binbook.json");
  expect(story.wrapper).toBe("width: 400px");
});

test("normalizes an object wrapper, kebab-casing camelCase keys", () => {
  const story = parseStoryFile(
    { ...raw, wrapper: { maxWidth: "400px", padding: 16 } },
    "/abs/x.binbook.json",
  );
  expect(story.wrapper).toBe("max-width: 400px; padding: 16");
});

test("a per-variant wrapper overrides and is normalized independently", () => {
  const story = parseStoryFile(
    { ...raw, wrapper: "width: 400px", stories: [{ name: "Wide", args: {}, wrapper: { width: "800px" } }] },
    "/abs/x.binbook.json",
  );
  expect(story.wrapper).toBe("width: 400px");
  expect(story.variants[0].wrapper).toBe("width: 800px");
});

test("omits wrapper when absent or empty", () => {
  expect(parseStoryFile(raw, "/abs/x.binbook.json").wrapper).toBeUndefined();
  expect(parseStoryFile({ ...raw, wrapper: "   " }, "/abs/x.binbook.json").wrapper).toBeUndefined();
});

test("rejects a select arg missing options", () => {
  const bad = { ...raw, args: { variant: { type: "select", default: "x" } } };
  expect(() => parseStoryFile(bad, "/abs/x.binbook.json")).toThrow(/options/i);
});

test("rejects unknown arg type", () => {
  const bad = { ...raw, args: { when: { type: "date", default: "x" } } };
  expect(() => parseStoryFile(bad, "/abs/x.binbook.json")).toThrow();
});
