import "server-only";
import type { AuditLog } from "@/lib/audit/types";
import type { UserRepository } from "@/lib/repositories/types";
import { seedFirstAdministrator } from "./first-administrator";

export async function runSeed(deps: {
  env: Record<string, string | undefined>;
  users: UserRepository;
  createAudit: (options: { connectionString?: string; nodeEnv?: string }) => AuditLog;
  now: () => Date;
}) {
  const oid = deps.env.FIRST_ADMINISTRATOR_OID;
  if (!oid) throw new Error("FIRST_ADMINISTRATOR_OID is required");

  await seedFirstAdministrator({
    users: deps.users,
    // Audit is mandatory unless NODE_ENV=development is set explicitly (local only); an unset NODE_ENV in the pipeline must not skip it.
    audit: deps.createAudit({
      connectionString: deps.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
      nodeEnv: deps.env.NODE_ENV === "development" ? "development" : "production",
    }),
    oid,
    now: deps.now,
  });
}
