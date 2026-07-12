import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: [
            "packages/{types,core,adapter-html,adapter-conformance}/src/**/*.test.ts",
          ],
        },
      },
      {
        root: "packages/viewer",
        plugins: [react()],
        test: {
          name: "viewer",
          environment: "jsdom",
          globals: true,
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["src/test-setup.ts"],
        },
      },
    ],
  },
});
