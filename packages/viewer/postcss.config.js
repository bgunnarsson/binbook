import { fileURLToPath } from "node:url";
import path from "node:path";

// Tailwind's own config lookup (triggered by an empty `tailwindcss: {}`
// option) resolves `./tailwind.config.*` against `process.cwd()` only,
// with no upward search and no relation to this file's location or Vite's
// `root`. binbook's CLI runs Vite with root = this package, but
// process.cwd() is the *consuming* project (e.g. examples/html-sandbox),
// so that lookup always misses and Tailwind silently falls back to a blank
// config (no utility classes generated at all). Pin an explicit absolute
// path so resolution never depends on cwd.
const dir = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: path.join(dir, "tailwind.config.ts") },
    autoprefixer: {},
  },
};
