import { describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { mapPrismaError, withSerializableRetry } from "@/lib/repositories/prisma/errors";

const prismaError = (code: string) => Object.assign(new Error("db"), { code });

describe("mapPrismaError", () => {
  it.each(["P2002", "P2003", "P2034"])("maps %s to Conflict", (code) => {
    expect(mapPrismaError(prismaError(code))).toBeInstanceOf(ConflictError);
  });

  it("maps P2025 to NotFound", () => {
    expect(mapPrismaError(prismaError("P2025"))).toBeInstanceOf(NotFoundError);
  });

  it("returns unknown errors untouched", () => {
    const error = prismaError("P1001");
    expect(mapPrismaError(error)).toBe(error);
    const plain = new Error("boom");
    expect(mapPrismaError(plain)).toBe(plain);
  });

  it("does not expose database messages", () => {
    expect((mapPrismaError(prismaError("P2002")) as Error).message).not.toContain("db");
  });
});

describe("withSerializableRetry", () => {
  it("returns the result when nothing conflicts", async () => {
    await expect(withSerializableRetry(async () => 42)).resolves.toBe(42);
  });

  it("retries on a serialization conflict and then succeeds", async () => {
    const fn = vi.fn().mockRejectedValueOnce(prismaError("P2034")).mockResolvedValueOnce("ok");

    await expect(withSerializableRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("gives up after the maximum attempts with Conflict", async () => {
    const fn = vi.fn().mockRejectedValue(prismaError("P2034"));

    await expect(withSerializableRetry(fn, 3)).rejects.toBeInstanceOf(ConflictError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry other errors", async () => {
    const fn = vi.fn().mockRejectedValue(prismaError("P2002"));

    await expect(withSerializableRetry(fn)).rejects.toBeInstanceOf(ConflictError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
