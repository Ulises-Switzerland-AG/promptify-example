export type DomainErrorKind =
  | "not_found"
  | "forbidden"
  | "validation"
  | "conflict"
  | "unauthenticated";

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  constructor(message?: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly kind = "not_found";
}

export class ForbiddenError extends DomainError {
  readonly kind = "forbidden";
}

export class ValidationError extends DomainError {
  readonly kind = "validation";
}

export class ConflictError extends DomainError {
  readonly kind = "conflict";
}

// Missing or malformed identity (401). A well-formed non-member principal is a ForbiddenError (403).
export class UnauthenticatedError extends DomainError {
  readonly kind = "unauthenticated";
}
