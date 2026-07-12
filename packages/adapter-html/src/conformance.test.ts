import { fileURLToPath } from "node:url";
import path from "node:path";
import { runAdapterConformance } from "@bgunnarsson/binbook-adapter-conformance";
import type { Story } from "@bgunnarsson/binbook-types";
import html from "./index";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "../test/fixtures");

const story: Story = {
  id: "components-button",
  title: "Components/Button",
  component: "./button.html",
  args: {},
  variants: [],
  file: path.join(root, "button.binbook.json"),
};

runAdapterConformance(html, {
  story,
  root,
  args: { variant: "ghost", label: "Buy" },
  expectedHtmlIncludes: "btn--ghost",
});
