import { Buffer } from "node:buffer";

export type Persona = { oid: string; name: string };

// Fixed identities, created by global-setup. Tests never share Prompts between personas.
export const AUTHOR: Persona = { oid: "e2e00000-0000-4000-8000-00000000a001", name: "Ana E2E" };
export const OTHER_USER: Persona = { oid: "e2e00000-0000-4000-8000-00000000b002", name: "Marc E2E" };
export const ADMINISTRATOR: Persona = { oid: "e2e00000-0000-4000-8000-00000000c003", name: "Laura E2E" };

type Claim = { typ: string; val: string };

// Builds the header Easy Auth adds after sign-in. `acct` "0" is a tenant member; anything else is a guest.
export function principalHeader({ oid, name, acct = "0" }: { oid: string; name: string; acct?: string | null }) {
  const claims: Claim[] = [
    { typ: "http://schemas.microsoft.com/identity/claims/objectidentifier", val: oid },
    { typ: "name", val: name },
  ];
  if (acct !== null) claims.push({ typ: "acct", val: acct });
  return encodeClaims(claims);
}

export function encodeClaims(claims: Claim[]) {
  return Buffer.from(JSON.stringify({ auth_typ: "aad", claims })).toString("base64");
}

export function headersFor(persona: Persona) {
  return { "x-ms-client-principal": principalHeader(persona) };
}
