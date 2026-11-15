import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const oid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const targetOid = "9f2504e0-4f89-41d3-9a0c-0305e82c3309";
const connectionString =
  "InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  client: {} as Record<string, unknown>,
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: async () => ({ get: () => null }) }));
vi.mock("@/lib/repositories/prisma/client", () => ({ getPrismaClient: () => mocks.client }));

function stubClient({ isAdministrator }: { isAdministrator: boolean }) {
  const target = { oid: targetOid, displayName: "Target", isAdministrator: false };
  const tx = { user: { findUnique: vi.fn().mockResolvedValue(target), update: vi.fn().mockResolvedValue(target) } };
  mocks.client = {
    user: { upsert: vi.fn().mockResolvedValue({ oid, displayName: "Dev", isAdministrator }) },
    category: { create: vi.fn().mockResolvedValue({ id: "c1", name: "Sales", color: "#112233" }) },
    $transaction: vi.fn(async (callback: (t: typeof tx) => unknown) => callback(tx)),
  };
  return tx;
}

async function loadContainer() {
  vi.resetModules();
  return (await import("@/lib/container")).getContainer();
}

const salesForm = () => {
  const data = new FormData();
  data.append("name", "Sales");
  data.append("color", "#112233");
  return data;
};

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("PROMPTIFY_DEV_USER_OID", oid);
  vi.stubEnv("APPLICATIONINSIGHTS_CONNECTION_STRING", connectionString);
  mocks.revalidatePath.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getContainer", () => {
  it("builds once and reuses the instance", async () => {
    stubClient({ isAdministrator: true });
    vi.resetModules();
    const { getContainer } = await import("@/lib/container");

    expect(getContainer()).toBe(getContainer());
  });

  it("revalidates every route after a successful mutation", async () => {
    stubClient({ isAdministrator: true });
    const { actions } = await loadContainer();

    expect(await actions.createCategory(salesForm())).toEqual({ ok: true, data: { id: "c1" } });

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("does not revalidate when the mutation is refused", async () => {
    stubClient({ isAdministrator: false });
    const { actions } = await loadContainer();

    expect(await actions.createCategory(salesForm())).toEqual({ ok: false, error: "You are not allowed to do this" });

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("sends the Administrator assignment to Application Insights before committing", async () => {
    stubClient({ isAdministrator: true });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ itemsAccepted: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { actions } = await loadContainer();

    expect(await actions.promoteAdministrator(targetOid)).toEqual({ ok: true, data: undefined });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://westeurope-5.in.applicationinsights.azure.com/v2/track");
    const [envelope] = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(envelope.data.baseData.properties).toMatchObject({ actorOid: oid, targetId: targetOid });
  });

  it("refuses the promotion when the audit event is not accepted", async () => {
    const tx = stubClient({ isAdministrator: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { actions } = await loadContainer();

    expect(await actions.promoteAdministrator(targetOid)).toEqual({ ok: false, error: "Something went wrong" });

    expect(tx.user.update).toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
