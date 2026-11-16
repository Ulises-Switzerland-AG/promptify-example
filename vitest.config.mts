import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root("./"),
      // `server-only` throws outside the React Server condition; tests run in plain Node.
      "server-only": root("./tests/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Page tests import whole route modules; the first one is slow when many workers start at once.
    testTimeout: 15_000,
  },
});
