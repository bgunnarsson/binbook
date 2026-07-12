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
        plugins: [react()],
        test: {
          name: "viewer",
          environment: "jsdom",
          include: ["packages/viewer/src/**/*.test.{ts,tsx}"],
          setupFiles: ["packages/viewer/src/test-setup.ts"],
        },
      },
    ],
  },
});
