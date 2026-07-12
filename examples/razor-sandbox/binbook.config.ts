import { defineConfig } from "@bgunnarsson/binbook-core";
import razor from "@bgunnarsson/binbook-adapter-razor";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [razor()],
  // Match the viewer's own app background (--at-bg) for a seamless canvas.
  background: "#0f111a",
});
