import { describe, expect, it } from "vitest";
import { ForbiddenError, UnauthenticatedError } from "@/lib/errors";
import { parsePrincipal, readPrincipalFromHeaders } from "@/lib/identity/principal";

const oid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const OID_URI = "http://schemas.microsoft.com/identity/claims/objectidentifier";

type Claim = { typ: string; val: string };

function encode(claims: Claim[] | unknown) {
  return Buffer.from(JSON.stringify({ auth_typ: "aad", claims })).toString("base64");
}

const memberClaims: Claim[] = [
  { typ: "oid", val: oid },
  { typ: "acct", val: "0" },
  { typ: "name", val: "Ada Lovelace" },
];

describe("parsePrincipal", () => {
  it("returns oid and display name for a member", () => {
    expect(parsePrincipal(encode(memberClaims))).toEqual({ oid, name: "Ada Lovelace" });
  });

  it("accepts the long objectidentifier claim type", () => {
    const claims = [{ typ: OID_URI, val: oid }, { typ: "acct", val: "0" }];

    expect(parsePrincipal(encode(claims)).oid).toBe(oid);
  });

  it("lowercases the oid so authorship comparisons are stable", () => {
    const claims = [{ typ: "oid", val: oid.toUpperCase() }, { typ: "acct", val: "0" }];

    expect(parsePrincipal(encode(claims)).oid).toBe(oid);
  });

  it("falls back to the oid when there is no name and truncates a long name", () => {
    expect(parsePrincipal(encode([{ typ: "oid", val: oid }, { typ: "acct", val: "0" }])).name).toBe(oid);
    const long = [...memberClaims.slice(0, 2), { typ: "name", val: "x".repeat(500) }];
    expect(parsePrincipal(encode(long)).name).toHaveLength(200);
  });

  it.each([
    ["missing header", null],
    ["empty header", ""],
    ["not base64", "%%%not base64%%%"],
    ["not json", Buffer.from("hello").toString("base64")],
    ["json without claims", Buffer.from("{}").toString("base64")],
    ["claims not an array", encode({ oid })],
    ["oversized header", "A".repeat(20_000)],
  ])("rejects %s as unauthenticated", (_label, header) => {
    expect(() => parsePrincipal(header)).toThrow(UnauthenticatedError);
  });

  it.each([
    ["missing oid", [{ typ: "acct", val: "0" }]],
    ["empty oid", [{ typ: "oid", val: "" }, { typ: "acct", val: "0" }]],
    ["non-guid oid", [{ typ: "oid", val: "alice@example.com" }, { typ: "acct", val: "0" }]],
    ["duplicate oid", [...memberClaims, { typ: "oid", val: oid }]],
    ["oid in both claim types", [...memberClaims, { typ: OID_URI, val: oid }]],
    ["duplicate acct", [...memberClaims, { typ: "acct", val: "0" }]],
    ["malformed claim entries", [{ typ: "oid" }, null, 3]],
  ])("rejects %s as unauthenticated", (_label, claims) => {
    expect(() => parsePrincipal(encode(claims))).toThrow(UnauthenticatedError);
  });

  it.each([
    ["missing acct", [{ typ: "oid", val: oid }]],
    ["guest acct", [{ typ: "oid", val: oid }, { typ: "acct", val: "1" }]],
    ["acct with padding", [{ typ: "oid", val: oid }, { typ: "acct", val: " 0" }]],
    ["empty acct", [{ typ: "oid", val: oid }, { typ: "acct", val: "" }]],
  ])("rejects %s as forbidden", (_label, claims) => {
    expect(() => parsePrincipal(encode(claims))).toThrow(ForbiddenError);
  });
});

describe("readPrincipalFromHeaders", () => {
  const headers = (value?: string) => ({ get: (name: string) => (name === "x-ms-client-principal" ? (value ?? null) : null) });
  const devEnv = { nodeEnv: "development", devUserOid: oid, devUserName: "Dev" };

  it("reads the Easy Auth header", () => {
    expect(readPrincipalFromHeaders(headers(encode(memberClaims)), { nodeEnv: "production" }).oid).toBe(oid);
  });

  it("fails closed in production even when a dev stub is configured", () => {
    expect(() => readPrincipalFromHeaders(headers(), { ...devEnv, nodeEnv: "production" })).toThrow(
      UnauthenticatedError,
    );
  });

  it("uses the dev stub only in development and without a header", () => {
    expect(readPrincipalFromHeaders(headers(), devEnv)).toEqual({ oid, name: "Dev" });
  });

  it("does not use the dev stub in other environments", () => {
    expect(() => readPrincipalFromHeaders(headers(), { ...devEnv, nodeEnv: "test" })).toThrow(UnauthenticatedError);
    expect(() => readPrincipalFromHeaders(headers(), { ...devEnv, nodeEnv: undefined })).toThrow(UnauthenticatedError);
  });

  it("rejects a dev stub with an invalid oid", () => {
    expect(() => readPrincipalFromHeaders(headers(), { ...devEnv, devUserOid: "nope" })).toThrow(UnauthenticatedError);
  });

  it("prefers a real header over the dev stub", () => {
    const other = "9f2504e0-4f89-41d3-9a0c-0305e82c3309";
    const claims = [{ typ: "oid", val: other }, { typ: "acct", val: "0" }];

    expect(readPrincipalFromHeaders(headers(encode(claims)), devEnv).oid).toBe(other);
  });
});
