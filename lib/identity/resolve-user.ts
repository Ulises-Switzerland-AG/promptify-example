import "server-only";
import type { UserRepository } from "@/lib/repositories/types";
import type { CurrentUser } from "@/lib/services/types";
import type { Principal } from "./principal";

export async function resolveUser(users: UserRepository, principal: Principal): Promise<CurrentUser> {
  const record = await users.upsert({ oid: principal.oid, displayName: principal.name });
  return { oid: record.oid, name: record.displayName, isAdministrator: record.isAdministrator };
}
