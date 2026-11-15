import { describe, expect, it } from "vitest";
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@/lib/errors";

describe("domain errors", () => {
  it.each([
    [new NotFoundError(), "not_found"],
    [new ForbiddenError(), "forbidden"],
    [new ValidationError(), "validation"],
    [new ConflictError(), "conflict"],
    [new UnauthenticatedError(), "unauthenticated"],
  ])("%o exposes its kind", (error, kind) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.kind).toBe(kind);
  });

  it("keeps an optional safe message", () => {
    expect(new ConflictError("Name already used").message).toBe("Name already used");
  });
});
