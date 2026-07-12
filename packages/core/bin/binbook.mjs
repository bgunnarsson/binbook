#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function main() {
  const [, , command = "dev"] = process.argv;
  if (command !== "dev") {
    console.error(`Unknown command: ${command}. Usage: binbook dev`);
    process.exit(1);
  }

  const root = process.cwd();
  // Use tsx to load the TS config + core source in v1 (no build step).
  const { register } = await import("tsx/esm/api");
  const unregister = register();

  const { loadConfig, createDevServer } = await import("@bgunnarsson/binbook-core");
  const viewerRoot = path.dirname(require.resolve("@bgunnarsson/binbook-viewer/index.html"));

  const config = await loadConfig(root, (file) => import(file));
  const server = await createDevServer({ root, viewerRoot, config });
  await server.listen();
  server.printUrls();
  unregister();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
