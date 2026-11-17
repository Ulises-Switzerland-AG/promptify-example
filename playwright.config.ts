import { defineConfig, devices } from "@playwright/test";
import { loadE2eUrls } from "./tests/e2e/support/env";

const PORT = 3100;
const { runtime } = loadE2eUrls();

// Run with `npm run test:e2e`. Serves the production build against the `_e2e` database; never part of `npm test`.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/e2e/global-setup.ts",
  // One database and "newest first" assertions: tests run one at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/e2e/.report" }]],
  outputDir: "tests/e2e/.results",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", locale: "es-ES" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 300_000,
    // Server logs are noisy (telemetry); set E2E_SERVER_LOGS=1 to see them.
    stdout: process.env.E2E_SERVER_LOGS ? "pipe" : "ignore",
    stderr: process.env.E2E_SERVER_LOGS ? "pipe" : "ignore",
    env: {
      DATABASE_URL: runtime,
      // Identity must come from the principal header only: the development stub is off in production.
      PROMPTIFY_DEV_USER_OID: "",
      PROMPTIFY_DEV_USER_NAME: "",
      // Production mode requires a valid connection string; this one points at a closed local port.
      APPLICATIONINSIGHTS_CONNECTION_STRING: "InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://127.0.0.1:9/",
      NODE_ENV: "production",
    },
  },
});
