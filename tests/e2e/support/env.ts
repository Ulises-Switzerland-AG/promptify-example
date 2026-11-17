import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const SUFFIX = "_e2e";

type Env = Record<string, string | undefined>;

function withDatabaseSuffix(url: string | undefined, variable: string) {
  if (!url) throw new Error(`${variable} is required to derive the e2e database`);
  return url.replace(/(database=)([^;]+)/i, (_match, key, name) => `${key}${name}${SUFFIX}`);
}

function databaseName(url: string) {
  return /database=([^;]+)/i.exec(url)?.[1];
}

function readDotEnv(path = ".env"): Env {
  return existsSync(path) ? parseEnv(readFileSync(path, "utf8")) : {};
}

// E2E tests create and delete data: they only ever run against a database whose name ends in `_e2e`.
export function loadE2eUrls(env: Env = { ...readDotEnv(), ...process.env }) {
  const runtime = env.E2E_DATABASE_URL ?? withDatabaseSuffix(env.DATABASE_URL, "DATABASE_URL");
  const migration = env.E2E_MIGRATION_DATABASE_URL ?? withDatabaseSuffix(env.MIGRATION_DATABASE_URL, "MIGRATION_DATABASE_URL");

  for (const url of [runtime, migration]) {
    if (!databaseName(url)?.toLowerCase().endsWith(SUFFIX)) {
      throw new Error(`Refusing to run e2e tests: the database name must end with "${SUFFIX}"`);
    }
  }
  return { runtime, migration };
}
