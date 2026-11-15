import { describe, expect, it } from "vitest";
import { seedFirstAdministrator } from "@/lib/seed/first-administrator";
import { createFakeRepositories } from "../fakes/repositories";

const oid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const now = new Date("2026-11-07T10:00:00Z");

function audit() {
  const events: unknown[] = [];
  return { events, recordAdministratorAssigned: async (event: unknown) => void events.push(event) };
}

describe("seedFirstAdministrator", () => {
  it("creates the User as Administrator and audits the assignment", async () => {
    const { users, db } = createFakeRepositories();
    const log = audit();

    await seedFirstAdministrator({ users, audit: log, oid, now: () => now });

    expect(db.users.get(oid)?.isAdministrator).toBe(true);
    expect(log.events).toEqual([{ actorOid: "seed", action: "administrator.assigned", targetId: oid, timestamp: now }]);
  });

  it("is idempotent", async () => {
    const { users, db } = createFakeRepositories();
    const log = audit();

    await seedFirstAdministrator({ users, audit: log, oid, now: () => now });
    await seedFirstAdministrator({ users, audit: log, oid, now: () => now });

    expect(db.users.size).toBe(1);
    expect(log.events).toHaveLength(1);
  });

  it("keeps the real display name of an existing User", async () => {
    const { users, db } = createFakeRepositories();
    db.seedUser({ oid, displayName: "Ada" });

    await seedFirstAdministrator({ users, audit: audit(), oid, now: () => now });

    expect(db.users.get(oid)).toMatchObject({ displayName: "Ada", isAdministrator: true });
  });

  it("rejects an invalid oid", async () => {
    const { users } = createFakeRepositories();

    await expect(seedFirstAdministrator({ users, audit: audit(), oid: "nope", now: () => now })).rejects.toThrow();
  });
});
