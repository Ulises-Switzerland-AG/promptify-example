import { execSync } from "node:child_process";
import { loadE2eUrls } from "./support/env";
import { openDatabase } from "./support/db";

// Applies the committed migrations to the e2e database with the migration login and creates the fixed Users and Categories.
export default async function globalSetup() {
  const { migration } = loadE2eUrls();
  try {
    execSync("npx prisma migrate deploy", { env: { ...process.env, MIGRATION_DATABASE_URL: migration }, stdio: "pipe" });
  } catch (error) {
    const output = (error as { stdout?: Buffer }).stdout?.toString() ?? "";
    throw new Error(
      `prisma migrate deploy failed. Did you run tests/e2e/provision.sql?\n${output.replace(/password=[^;\s]*/gi, "password=***")}`,
    );
  }
  const db = openDatabase();
  try {
    await db.seedBaseline();
  } finally {
    await db.close();
  }
}
