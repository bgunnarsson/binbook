import { fileURLToPath } from "node:url";
import path from "node:path";
import { expect, test } from "vitest";
import react from "./index";
import type { RenderContext, Story } from "@bgunnarsson/binbook-types";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "../test/fixtures");
const fixtureFile = path.join(root, "Button.binbook.json");

const story: Story = {
  id: "components-button",
  title: "Components/Button",
  component: "./Button.tsx",
  args: {},
  variants: [],
  file: fixtureFile,
};

const ctx = (args: Record<string, unknown>): RenderContext => ({
  story,
  component: "./Button.tsx",
  args,
  root,
});

test("adapter metadata", () => {
  expect(react().name).toBe("react");
  expect(react().storyGlob).toBe("**/*.binbook.json");
});

test("render resolves the component and passes args as props", async () => {
  const result = await react().render(ctx({ variant: "ghost", label: "Buy" }));
  expect(result.html).toBe('<button class="btn btn--ghost">Buy</button>');
});

test("boolean props render as HTML attributes", async () => {
  const result = await react().render(ctx({ variant: "ghost", label: "Buy", disabled: true }));
  expect(result.html).toContain("disabled");
});

test("component defaults apply when an arg is absent", async () => {
  const result = await react().render(ctx({ label: "Buy" }));
  expect(result.html).toContain("btn--primary");
});

test("supports selecting a named export via #Name", async () => {
  const named = await react().render({ ...ctx({ label: "Hi" }), component: "./Button.tsx#default" });
  expect(named.html).toContain("btn--primary");
});

test("docs returns the component source", async () => {
  const meta = await react().docs!(story);
  expect(meta.source).toContain("btn btn--${variant}");
});
