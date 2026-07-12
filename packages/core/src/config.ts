import path from "node:path";
import { pathToFileURL } from "node:url";
import type { BinbookConfig } from "@bgunnarsson/binbook-types";

export function defineConfig(config: BinbookConfig): BinbookConfig {
  return { port: 6006, staticDirs: [], ...config };
}

/** Loads binbook.config.ts from a project root using Vite's SSR loader (passed in by the CLI). */
export async function loadConfig(
  root: string,
  loadModule: (file: string) => Promise<{ default: BinbookConfig }>,
): Promise<BinbookConfig> {
  const file = path.join(root, "binbook.config.ts");
  const mod = await loadModule(pathToFileURL(file).href);
  return defineConfig(mod.default);
}
