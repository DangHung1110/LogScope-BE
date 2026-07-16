import type { RawLogEvent } from '@logscope/contracts';

export function normalizeLogEvent(event: RawLogEvent): RawLogEvent {
  return {
    ...event,
    environment: event.environment.trim().toLowerCase(),
    service: event.service.trim(),
    spanId: normalizeOptionalIdentifier(event.spanId),
    timestamp: new Date(event.timestamp).toISOString(),
    traceId: normalizeOptionalIdentifier(event.traceId),
  };
}

function normalizeOptionalIdentifier(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim().toLowerCase();

  if (normalizedValue === undefined || normalizedValue.length === 0) {
    return undefined;
  }

  return normalizedValue;
}
