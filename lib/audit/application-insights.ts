import "server-only";
import type { AdministratorAssignedEvent, AuditLog } from "./types";

const REQUEST_TIMEOUT_MS = 5_000;

export function parseConnectionString(value: string) {
  const parts = new Map(
    value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), part.slice(index + 1)] as const;
      }),
  );
  const instrumentationKey = parts.get("InstrumentationKey");
  const endpoint = parts.get("IngestionEndpoint");
  if (!instrumentationKey || !endpoint) throw new Error("Invalid Application Insights connection string");

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("Invalid Application Insights connection string");
  }
  if (url.protocol !== "https:") throw new Error("Application Insights endpoint must use https");

  return { instrumentationKey, ingestionEndpoint: url.origin };
}

// Uses the ingestion endpoint directly because, unlike the SDK's background sender, it confirms acceptance.
export class ApplicationInsightsAuditLog implements AuditLog {
  private readonly config: ReturnType<typeof parseConnectionString>;
  private readonly fetchFn: typeof fetch;

  constructor(options: { connectionString: string; fetch?: typeof fetch }) {
    this.config = parseConnectionString(options.connectionString);
    this.fetchFn = options.fetch ?? fetch;
  }

  async recordAdministratorAssigned(event: AdministratorAssignedEvent) {
    const time = event.timestamp.toISOString();
    const envelope = {
      name: "Microsoft.ApplicationInsights.Event",
      time,
      iKey: this.config.instrumentationKey,
      data: {
        baseType: "EventData",
        baseData: {
          ver: 2,
          name: event.action,
          properties: {
            actorOid: event.actorOid,
            action: event.action,
            targetId: event.targetId,
            timestamp: time,
          },
        },
      },
    };

    let response: Response;
    try {
      response = await this.fetchFn(`${this.config.ingestionEndpoint}/v2/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([envelope]),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new Error("Audit event could not be sent");
    }

    const body = (await response.json().catch(() => null)) as { itemsAccepted?: number } | null;
    if (!response.ok || body?.itemsAccepted !== 1) throw new Error("Audit event was not accepted");
  }
}

// Local development only: logs the event instead of sending it.
export class ConsoleAuditLog implements AuditLog {
  async recordAdministratorAssigned(event: AdministratorAssignedEvent) {
    console.info("[audit]", JSON.stringify(event));
  }
}

export function createAuditLog(env: { connectionString?: string; nodeEnv?: string }): AuditLog {
  if (env.connectionString) return new ApplicationInsightsAuditLog({ connectionString: env.connectionString });
  if (env.nodeEnv === "production") throw new Error("APPLICATIONINSIGHTS_CONNECTION_STRING is required");
  return new ConsoleAuditLog();
}
