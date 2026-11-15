export async function register() {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (process.env.NEXT_RUNTIME !== "nodejs" || !connectionString) return;

  const { useMicrosoftOpenTelemetry: startTelemetry } = await import("@microsoft/opentelemetry");
  const { buildTelemetryOptions } = await import("./lib/telemetry-options");
  startTelemetry(buildTelemetryOptions(connectionString));
}
