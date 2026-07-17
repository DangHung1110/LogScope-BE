import { z } from 'zod';

export const RAW_LOG_EVENT_VERSION = 'logs.raw.v1';

export const LOG_RECEIVED_CHANNEL_V1 = 'logs.received.v1';

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export const rawLogEventSchema = z.object({
  eventId: z.string().uuid(),
  projectId: z.string().uuid(),
  service: z.string().min(1).max(100),
  environment: z.string().min(1).max(50),
  level: z.enum(LOG_LEVELS),
  message: z.string().min(1).max(20_000),
  timestamp: z.string().datetime(),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export interface RawLogEvent {
  eventId: string;
  projectId: string;
  service: string;
  environment: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  traceId?: string;
  spanId?: string;
  attributes?: Record<string, unknown>;
}

export type RawLogEventInput = z.input<typeof rawLogEventSchema>;

export type RawLogEventOutput = z.output<typeof rawLogEventSchema>;

export function parseRawLogEvent(input: unknown): RawLogEvent {
  return rawLogEventSchema.parse(input);
}
