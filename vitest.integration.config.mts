import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Run with `npm run test:integration`. Never part of `npm test`.
export default defineConfig({
  resolve: {
    alias: {
      "@": root("./"),
      "server-only": root("./tests/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.itest.ts"],
    globalSetup: ["./tests/integration/global-setup.ts"],
    // All files share one database and clean it up, so they must not overlap.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
