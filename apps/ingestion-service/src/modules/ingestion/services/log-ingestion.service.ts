import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RawLogEvent, rawLogEventSchema } from '@logscope/contracts';
import { KafkaLogProducerService } from './kafka-log-producer.service';

@Injectable()
export class LogIngestionService {
  constructor(private readonly kafkaLogProducer: KafkaLogProducerService) {}

  async publish(event: RawLogEvent): Promise<void> {
    rawLogEventSchema.parse(event);

    try {
      await this.kafkaLogProducer.publish(event);
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
      await this.kafkaLogProducer.publishBatch(events);
    } catch (error) {
      throw new ServiceUnavailableException('Log pipeline is unavailable', {
        cause: error,
      });
    }
  }
}
