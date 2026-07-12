import { defineConfig } from "@bgunnarsson/binbook-core";
import react from "@bgunnarsson/binbook-adapter-react";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [react()],
  // Canvas appearance for this project: a white backdrop and the app's own CSS,
  // injected into the isolated story iframe.
  background: "#ffffff",
  styles: ["./src/styles/app.css"],
});
