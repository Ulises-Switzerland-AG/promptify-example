import { execSync } from "node:child_process";
import { loadIntegrationUrls } from "./support/env";

// Applies the committed migrations to the integration database with the migration login.
export default function setup() {
  const { migration } = loadIntegrationUrls();
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, MIGRATION_DATABASE_URL: migration },
      stdio: "pipe",
    });
  } catch (error) {
    const output = (error as { stdout?: Buffer }).stdout?.toString() ?? "";
    throw new Error(
      `prisma migrate deploy failed. Did you run tests/integration/provision.sql?\n${output.replace(/password=[^;\s]*/gi, "password=***")}`,
    );
  }
}
