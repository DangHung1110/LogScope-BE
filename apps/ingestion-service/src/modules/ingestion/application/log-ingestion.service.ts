import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RawLogEvent, rawLogEventSchema } from '@logscope/contracts';
import { LogEventPublisherPort } from './ports/log-event-publisher.port';

@Injectable()
export class LogIngestionService {
  constructor(private readonly eventPublisher: LogEventPublisherPort) {}

  async publish(event: RawLogEvent): Promise<void> {
    rawLogEventSchema.parse(event);

    try {
      await this.eventPublisher.publish(event);
    } catch (error) {
      throw new ServiceUnavailableException('Log pipeline is unavailable', {
        cause: error,
      });
    }
  }

  async publishBatch(events: RawLogEvent[]): Promise<void> {
    for (const event of events) {
      rawLogEventSchema.parse(event);
    }

    try {
      await this.eventPublisher.publishBatch(events);
    } catch (error) {
      throw new ServiceUnavailableException('Log pipeline is unavailable', {
        cause: error,
      });
    }
  }
}
