import type { Config } from "tailwindcss";

export default {
  // Resolve content globs relative to this config file rather than
  // process.cwd(): binbook's CLI runs Vite with root = the viewer package,
  // but process.cwd() is the consuming project (e.g. examples/html-sandbox),
  // so cwd-relative globs would never match any viewer source files.
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{ts,tsx}"],
  },
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
