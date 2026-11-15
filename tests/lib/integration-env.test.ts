import { describe, expect, it } from "vitest";
import { loadIntegrationUrls } from "../integration/support/env";

const runtime = "sqlserver://localhost:1433;database=promptify;user=app;password=x;encrypt=true";
const migration = "sqlserver://localhost:1433;database=promptify;user=migrator;password=y;encrypt=true";

describe("loadIntegrationUrls", () => {
  it("derives the integration database from the development urls", () => {
    const urls = loadIntegrationUrls({ DATABASE_URL: runtime, MIGRATION_DATABASE_URL: migration });

    expect(urls.runtime).toContain("database=promptify_integration;");
    expect(urls.migration).toContain("database=promptify_integration;");
    expect(urls.runtime).toContain("user=app");
  });

  it("accepts explicit integration urls", () => {
    const explicit = "sqlserver://h;database=other_integration;user=u;password=p";

    const urls = loadIntegrationUrls({
      INTEGRATION_DATABASE_URL: explicit,
      INTEGRATION_MIGRATION_DATABASE_URL: explicit,
    });

    expect(urls.runtime).toBe(explicit);
  });

  it("refuses an explicit url that points to a non-integration database", () => {
    expect(() =>
      loadIntegrationUrls({ INTEGRATION_DATABASE_URL: runtime, INTEGRATION_MIGRATION_DATABASE_URL: migration }),
    ).toThrow(/must end with/);
  });

  it("fails when there is nothing to derive from", () => {
    expect(() => loadIntegrationUrls({})).toThrow(/DATABASE_URL/);
  });
});
