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

test("rejects a select arg missing options", () => {
  const bad = { ...raw, args: { variant: { type: "select", default: "x" } } };
  expect(() => parseStoryFile(bad, "/abs/x.binbook.json")).toThrow(/options/i);
});

test("rejects unknown arg type", () => {
  const bad = { ...raw, args: { when: { type: "date", default: "x" } } };
  expect(() => parseStoryFile(bad, "/abs/x.binbook.json")).toThrow();
});
