import "server-only";
import type { AuditLog } from "@/lib/audit/types";
import type { UserRepository } from "@/lib/repositories/types";
import { oidSchema } from "@/lib/schemas/common";

// Run from the pipeline. Never exposed through the UI or an endpoint (SECURITY.md §4).
export async function seedFirstAdministrator(deps: {
  users: UserRepository;
  audit: AuditLog;
  oid: string;
  now: () => Date;
}) {
  const oid = oidSchema.parse(deps.oid);

  if (!(await deps.users.findByOid(oid))) {
    // Placeholder name; replaced by the real one on the User's first request.
    await deps.users.upsert({ oid, displayName: "Administrator" });
  }

  await deps.users.promote(oid, () =>
    deps.audit.recordAdministratorAssigned({
      actorOid: "seed",
      action: "administrator.assigned",
      targetId: oid,
      timestamp: deps.now(),
    }),
  );
}
