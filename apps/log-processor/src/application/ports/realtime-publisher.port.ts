import type { RawLogEvent } from '@logscope/contracts';

export abstract class RealtimePublisherPort {
  abstract publish(event: RawLogEvent): Promise<void>;
}
