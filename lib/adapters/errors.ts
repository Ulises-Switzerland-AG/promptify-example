import "server-only";
import { DomainError } from "@/lib/errors";
import type { ActionResult } from "./result";

const DEFAULT_MESSAGES = {
  not_found: "Not found",
  forbidden: "You are not allowed to do this",
  validation: "Invalid input",
  conflict: "The change conflicts with existing data",
  unauthenticated: "Authentication required",
} as const;

// Domain messages are static strings written in this codebase; anything else is hidden.
export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof DomainError) {
    const exposesMessage = error.kind === "not_found" || error.kind === "validation" || error.kind === "conflict";
    return { ok: false, error: (exposesMessage && error.message) || DEFAULT_MESSAGES[error.kind] };
  }
  // Only the error name is logged: messages from the database or runtime may contain data.
  console.error("Unexpected error:", error instanceof Error ? error.name : typeof error);
  return { ok: false, error: "Something went wrong" };
}
