import { loadEnv } from "vite";

const SUFFIX = "_integration";

function withDatabaseSuffix(url: string | undefined, variable: string) {
  if (!url) throw new Error(`${variable} is required to derive the integration database`);
  return url.replace(/(database=)([^;]+)/i, (_match, key, name) => `${key}${name}${SUFFIX}`);
}

export function databaseName(url: string) {
  return /database=([^;]+)/i.exec(url)?.[1];
}

// Integration tests delete data: they only ever run against a database whose name ends in `_integration`.
export function loadIntegrationUrls(env: Record<string, string | undefined> = loadEnv("test", process.cwd(), "")) {
  const runtime = env.INTEGRATION_DATABASE_URL ?? withDatabaseSuffix(env.DATABASE_URL, "DATABASE_URL");
  const migration =
    env.INTEGRATION_MIGRATION_DATABASE_URL ?? withDatabaseSuffix(env.MIGRATION_DATABASE_URL, "MIGRATION_DATABASE_URL");

  for (const url of [runtime, migration]) {
    if (!databaseName(url)?.toLowerCase().endsWith(SUFFIX)) {
      throw new Error(`Refusing to run integration tests: the database name must end with "${SUFFIX}"`);
    }
  }
  return { runtime, migration };
}
