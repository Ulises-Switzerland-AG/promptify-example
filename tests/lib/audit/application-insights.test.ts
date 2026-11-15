import { describe, expect, it, vi } from "vitest";
import {
  ApplicationInsightsAuditLog,
  ConsoleAuditLog,
  createAuditLog,
  parseConnectionString,
} from "@/lib/audit/application-insights";

const event = {
  actorOid: "a0000000-0000-4000-8000-000000000001",
  action: "administrator.assigned" as const,
  targetId: "b0000000-0000-4000-8000-000000000002",
  timestamp: new Date("2026-11-07T10:00:00Z"),
};
const connectionString =
  "InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/";

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

describe("parseConnectionString", () => {
  it("extracts the instrumentation key and the ingestion endpoint", () => {
    expect(parseConnectionString(connectionString)).toEqual({
      instrumentationKey: "00000000-0000-0000-0000-000000000000",
      ingestionEndpoint: "https://westeurope-5.in.applicationinsights.azure.com",
    });
  });

  it.each([
    [""],
    ["InstrumentationKey=abc"],
    ["IngestionEndpoint=https://x.example.com"],
    ["InstrumentationKey=abc;IngestionEndpoint=http://insecure.example.com"],
    ["InstrumentationKey=abc;IngestionEndpoint=not a url"],
  ])("rejects %j", (value) => {
    expect(() => parseConnectionString(value)).toThrow();
  });
});

describe("createAuditLog", () => {
  it("fails closed in production without a connection string", () => {
    expect(() => createAuditLog({ nodeEnv: "production" })).toThrow();
  });

  it("falls back to the console log outside production", () => {
    expect(createAuditLog({ nodeEnv: "development" })).toBeInstanceOf(ConsoleAuditLog);
  });

  it("uses Application Insights when a connection string is set", () => {
    expect(createAuditLog({ nodeEnv: "production", connectionString })).toBeInstanceOf(ApplicationInsightsAuditLog);
  });
});

describe("ApplicationInsightsAuditLog", () => {
  it("posts the event and succeeds when the service accepts it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200, { itemsReceived: 1, itemsAccepted: 1, errors: [] }));
    const log = new ApplicationInsightsAuditLog({ connectionString, fetch: fetchMock });

    await log.recordAdministratorAssigned(event);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://westeurope-5.in.applicationinsights.azure.com/v2/track");
    expect(init.method).toBe("POST");
    const [envelope] = JSON.parse(init.body);
    expect(envelope.iKey).toBe("00000000-0000-0000-0000-000000000000");
    expect(envelope.time).toBe("2026-11-07T10:00:00.000Z");
    expect(envelope.data.baseType).toBe("EventData");
    expect(envelope.data.baseData.name).toBe("administrator.assigned");
    expect(envelope.data.baseData.properties).toEqual({
      actorOid: event.actorOid,
      action: "administrator.assigned",
      targetId: event.targetId,
      timestamp: "2026-11-07T10:00:00.000Z",
    });
  });

  it("fails when the service answers with an error status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(500, {}));
    const log = new ApplicationInsightsAuditLog({ connectionString, fetch: fetchMock });

    await expect(log.recordAdministratorAssigned(event)).rejects.toThrow();
  });

  it("fails when the service accepts nothing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(206, { itemsReceived: 1, itemsAccepted: 0, errors: [{}] }));
    const log = new ApplicationInsightsAuditLog({ connectionString, fetch: fetchMock });

    await expect(log.recordAdministratorAssigned(event)).rejects.toThrow();
  });

  it("fails when the network call fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    const log = new ApplicationInsightsAuditLog({ connectionString, fetch: fetchMock });

    await expect(log.recordAdministratorAssigned(event)).rejects.toThrow();
  });

  it("does not leak the instrumentation key in errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(500, {}));
    const log = new ApplicationInsightsAuditLog({ connectionString, fetch: fetchMock });

    const error = await log.recordAdministratorAssigned(event).catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain("00000000-0000-0000-0000-000000000000");
  });
});
