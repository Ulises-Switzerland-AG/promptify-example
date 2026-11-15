import type { MicrosoftOpenTelemetryOptions } from "@microsoft/opentelemetry";

export function buildTelemetryOptions(connectionString: string): MicrosoftOpenTelemetryOptions {
  return {
    azureMonitor: { azureMonitorExporterOptions: { connectionString } },
    // 0 disables the default 5 traces/second limit so samplingRatio keeps every trace.
    tracesPerSecond: 0,
    samplingRatio: 1,
    instrumentationOptions: { console: { enabled: true } },
  };
}
