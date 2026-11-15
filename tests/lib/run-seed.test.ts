import { describe, expect, it } from "vitest";
import { runSeed } from "@/lib/seed/run-seed";
import { createFakeRepositories } from "../fakes/repositories";

const oid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const connectionString =
  "InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/";

function audit() {
  const events: unknown[] = [];
  return { events, recordAdministratorAssigned: async (event: unknown) => void events.push(event) };
}

describe("runSeed", () => {
  it("requires FIRST_ADMINISTRATOR_OID", async () => {
    const { users } = createFakeRepositories();

    await expect(runSeed({ env: {}, users, createAudit: () => audit(), now: () => new Date() })).rejects.toThrow(
      "FIRST_ADMINISTRATOR_OID is required",
    );
  });

  it("requires a real audit log unless NODE_ENV is explicitly development", async () => {
    const { users } = createFakeRepositories();
    const calls: unknown[] = [];
    const run = (nodeEnv?: string) =>
      runSeed({
        env: { FIRST_ADMINISTRATOR_OID: oid, NODE_ENV: nodeEnv, APPLICATIONINSIGHTS_CONNECTION_STRING: connectionString },
        users,
        createAudit: (options) => (calls.push(options.nodeEnv), audit()),
        now: () => new Date(),
      });

    await run("development");
    await run("production");
    await run("test");
    await run(undefined);

    expect(calls).toEqual(["development", "production", "production", "production"]);
  });

  it("promotes the configured oid and audits it", async () => {
    const { users, db } = createFakeRepositories();
    const log = audit();

    await runSeed({ env: { FIRST_ADMINISTRATOR_OID: oid }, users, createAudit: () => log, now: () => new Date() });

    expect(db.users.get(oid)?.isAdministrator).toBe(true);
    expect(log.events).toHaveLength(1);
  });
});
