import "server-only";
import type { AuditLog } from "@/lib/audit/types";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { UserRepository } from "@/lib/repositories/types";
import type { CurrentUser } from "./types";

export class AdministratorService {
  constructor(
    private readonly deps: { users: UserRepository; audit: AuditLog; now: () => Date },
  ) {}

  async listUsers(actor: CurrentUser) {
    requireAdministrator(actor);
    return this.deps.users.list();
  }

  async promote(actor: CurrentUser, targetOid: string) {
    requireAdministrator(actor);
    const result = await this.deps.users.promote(targetOid, () =>
      this.deps.audit.recordAdministratorAssigned({
        actorOid: actor.oid,
        action: "administrator.assigned",
        targetId: targetOid,
        timestamp: this.deps.now(),
      }),
    );
    if (result === "not_found") throw new NotFoundError("User not found");
  }

  async demote(actor: CurrentUser, targetOid: string) {
    requireAdministrator(actor);
    const result = await this.deps.users.demote(targetOid);
    if (result === "not_found") throw new NotFoundError("User not found");
    if (result === "last_administrator") throw new ConflictError("The last Administrator cannot be demoted");
  }
}

function requireAdministrator(user: CurrentUser) {
  if (!user.isAdministrator) throw new ForbiddenError();
}
