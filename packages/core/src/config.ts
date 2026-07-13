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
  let cfg: BinbookConfig = mod.default;
  // In a project without "type": "module", the TS loader compiles the config as
  // CJS and ESM interop double-wraps the default export ({ default: { default:
  // config } }). Unwrap that extra layer so external (non-ESM) projects work.
  if (cfg && typeof cfg === "object" && !("adapters" in cfg) && "default" in cfg) {
    cfg = (cfg as unknown as { default: BinbookConfig }).default;
  }
  return defineConfig(cfg);
}
