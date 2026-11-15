import "server-only";
import { ConflictError, NotFoundError } from "@/lib/errors";

const CONFLICT_CODES = new Set(["P2002", "P2003", "P2034"]);
const SERIALIZATION_CONFLICT = "P2034";

function codeOf(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
}

// Unique, foreign-key and serialization failures become Conflict; database messages are never exposed.
export function mapPrismaError(error: unknown) {
  const code = codeOf(error);
  if (code && CONFLICT_CODES.has(code)) return new ConflictError("The change conflicts with existing data");
  if (code === "P2025") return new NotFoundError("Not found");
  return error;
}

export async function withSerializableRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (codeOf(error) === SERIALIZATION_CONFLICT && attempt < maxAttempts) continue;
      throw mapPrismaError(error);
    }
  }
}
