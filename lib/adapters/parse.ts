import "server-only";
import type { ZodType } from "zod";
import { ValidationError } from "@/lib/errors";

export function parseInput<T>(schema: ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new ValidationError("Invalid input");
  return result.data;
}

// Reads only the expected text fields; repeated keys, files and non-FormData arguments are rejected.
export function readFormFields<K extends string>(raw: unknown, keys: readonly K[]): Record<K, string | undefined> {
  if (!(raw instanceof FormData)) throw new ValidationError("Invalid input");
  const fields = {} as Record<K, string | undefined>;
  for (const key of keys) {
    const values = raw.getAll(key);
    if (values.length > 1) throw new ValidationError("Invalid input");
    const value = values[0];
    if (value !== undefined && typeof value !== "string") throw new ValidationError("Invalid input");
    fields[key] = value === "" ? undefined : value;
  }
  return fields;
}

// Next.js search params: a repeated key arrives as an array and is rejected.
export function readSearchParams<K extends string>(raw: unknown, keys: readonly K[]): Record<K, string | undefined> {
  if (typeof raw !== "object" || raw === null) throw new ValidationError("Invalid input");
  const params = raw as Record<string, unknown>;
  const fields = {} as Record<K, string | undefined>;
  for (const key of keys) {
    const value = params[key];
    if (value !== undefined && typeof value !== "string") throw new ValidationError("Invalid input");
    fields[key] = value;
  }
  return fields;
}
