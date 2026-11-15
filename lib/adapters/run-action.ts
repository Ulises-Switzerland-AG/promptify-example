import "server-only";
import type { Principal } from "@/lib/identity/principal";
import type { CurrentUser } from "@/lib/services/types";
import { toActionError } from "./errors";
import type { ActionResult } from "./result";

export type ActionRunnerDeps = {
  readPrincipal(): Promise<Principal>;
  resolveUser(principal: Principal): Promise<CurrentUser>;
};

export type ActionRunner = ReturnType<typeof createActionRunner>;

// Enforces the entry point order: principal (no DB) -> input validation -> User upsert -> service.
export function createActionRunner(deps: ActionRunnerDeps) {
  return async function run<I, O>(
    parse: () => I,
    execute: (user: CurrentUser, input: I) => Promise<O>,
  ): Promise<ActionResult<O>> {
    try {
      const principal = await deps.readPrincipal();
      const input = parse();
      const user = await deps.resolveUser(principal);
      return { ok: true, data: await execute(user, input) };
    } catch (error) {
      return toActionError(error);
    }
  };
}
