import "server-only";
import { ForbiddenError, UnauthenticatedError } from "@/lib/errors";
import { oidSchema } from "@/lib/schemas/common";

const PRINCIPAL_HEADER = "x-ms-client-principal";
const MAX_HEADER_LENGTH = 16_384;
const MAX_NAME_LENGTH = 200;
const OID_CLAIM_TYPES = new Set(["oid", "http://schemas.microsoft.com/identity/claims/objectidentifier"]);

export type Principal = { oid: string; name: string };

type Claim = { typ: string; val: string };

export function parsePrincipal(header: string | null | undefined): Principal {
  const claims = decodeClaims(header);

  const oids = claims.filter((claim) => OID_CLAIM_TYPES.has(claim.typ));
  if (oids.length !== 1) throw new UnauthenticatedError();
  const parsedOid = oidSchema.safeParse(oids[0].val);
  if (!parsedOid.success) throw new UnauthenticatedError();

  const accts = claims.filter((claim) => claim.typ === "acct");
  if (accts.length > 1) throw new UnauthenticatedError();
  // Only tenant members (acct = "0") may access Promptify; guests and a missing claim are rejected.
  if (accts.length === 0 || accts[0].val !== "0") throw new ForbiddenError();

  const oid = parsedOid.data;
  const displayName = claims.find((claim) => claim.typ === "name")?.val.trim();
  return { oid, name: (displayName || oid).slice(0, MAX_NAME_LENGTH) };
}

function decodeClaims(header: string | null | undefined): Claim[] {
  if (!header || header.length > MAX_HEADER_LENGTH || !/^[A-Za-z0-9+/]+={0,2}$/.test(header)) {
    throw new UnauthenticatedError();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch {
    throw new UnauthenticatedError();
  }

  const claims = (payload as { claims?: unknown } | null)?.claims;
  if (!Array.isArray(claims) || !claims.every(isClaim)) throw new UnauthenticatedError();
  return claims;
}

function isClaim(value: unknown): value is Claim {
  if (typeof value !== "object" || value === null) return false;
  const { typ, val } = value as Record<string, unknown>;
  return typeof typ === "string" && typeof val === "string";
}

export type PrincipalEnv = {
  nodeEnv?: string;
  devUserOid?: string;
  devUserName?: string;
};

export function readPrincipalFromHeaders(
  headers: { get(name: string): string | null },
  env: PrincipalEnv,
): Principal {
  const header = headers.get(PRINCIPAL_HEADER);
  if (header) return parsePrincipal(header);

  // Explicit dev-only stub; never active unless NODE_ENV is exactly "development".
  if (env.nodeEnv === "development" && env.devUserOid) {
    const devOid = oidSchema.safeParse(env.devUserOid);
    if (devOid.success) return { oid: devOid.data, name: (env.devUserName || "Dev User").slice(0, MAX_NAME_LENGTH) };
  }
  throw new UnauthenticatedError();
}
