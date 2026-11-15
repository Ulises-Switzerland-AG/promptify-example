import { describe, expect, it } from "vitest";
import { buildTelemetryOptions } from "@/lib/telemetry-options";

describe("buildTelemetryOptions", () => {
  const options = buildTelemetryOptions("InstrumentationKey=k;IngestionEndpoint=https://example.test/");

  it("sends the telemetry to Application Insights", () => {
    expect(options.azureMonitor?.azureMonitorExporterOptions?.connectionString).toBe(
      "InstrumentationKey=k;IngestionEndpoint=https://example.test/",
    );
  });

  it("keeps every trace instead of rate limiting", () => {
    expect(options.tracesPerSecond).toBe(0);
    expect(options.samplingRatio).toBe(1);
  });

  it("captures console output as logs", () => {
    expect(options.instrumentationOptions?.console?.enabled).toBe(true);
  });
});
