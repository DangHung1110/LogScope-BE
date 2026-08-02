import type { RawLogEvent } from '@logscope/contracts';

export abstract class LogEventPublisherPort {
  abstract publish(event: RawLogEvent): Promise<void>;
  abstract publishBatch(events: RawLogEvent[]): Promise<void>;
}
