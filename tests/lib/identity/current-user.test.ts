import { afterEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, UnauthenticatedError } from "@/lib/errors";

const headerStore = vi.hoisted(() => ({ value: null as string | null }));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => (name === "x-ms-client-principal" ? headerStore.value : null) }),
}));

const oid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

function principal(claims: { typ: string; val: string }[]) {
  return Buffer.from(JSON.stringify({ claims })).toString("base64");
}

async function readPrincipal() {
  const { readPrincipal } = await import("@/lib/identity/current-user");
  return readPrincipal();
}

afterEach(() => {
  vi.unstubAllEnvs();
  headerStore.value = null;
});

describe("readPrincipal", () => {
  it("reads the Easy Auth header from the request", async () => {
    vi.stubEnv("NODE_ENV", "production");
    headerStore.value = principal([
      { typ: "oid", val: oid },
      { typ: "acct", val: "0" },
      { typ: "name", val: "Ada" },
    ]);

    expect(await readPrincipal()).toEqual({ oid, name: "Ada" });
  });

  it("rejects a guest from the real header", async () => {
    vi.stubEnv("NODE_ENV", "production");
    headerStore.value = principal([
      { typ: "oid", val: oid },
      { typ: "acct", val: "1" },
    ]);

    await expect(readPrincipal()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("ignores the dev stub in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PROMPTIFY_DEV_USER_OID", oid);

    await expect(readPrincipal()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("uses the dev stub only when NODE_ENV is development", async () => {
    vi.stubEnv("PROMPTIFY_DEV_USER_OID", oid);
    vi.stubEnv("PROMPTIFY_DEV_USER_NAME", "Dev");

    vi.stubEnv("NODE_ENV", "development");
    expect(await readPrincipal()).toEqual({ oid, name: "Dev" });

    vi.stubEnv("NODE_ENV", "test");
    await expect(readPrincipal()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
