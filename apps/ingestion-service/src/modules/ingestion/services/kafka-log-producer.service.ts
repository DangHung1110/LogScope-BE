import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@logscope/config';
import type { RawLogEvent } from '@logscope/contracts';
import { createKafkaClient, KafkaProducerService, KAFKA_TOPICS } from '@logscope/kafka';
import type { KafkaLogger } from '@logscope/kafka';

@Injectable()
export class KafkaLogProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly producer: KafkaProducerService;

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const logger: KafkaLogger = {
      debug: (message, metadata) => console.debug(message, metadata),
      error: (message, metadata) => console.error(message, metadata),
      info: (message, metadata) => console.info(message, metadata),
      warn: (message, metadata) => console.warn(message, metadata),
    };
    const kafkaBrokers = configService.getOrThrow<string>('KAFKA_BROKERS');
    const kafkaClientId = configService.getOrThrow<string>('KAFKA_CLIENT_ID');
    const kafkaSendTimeoutMs = configService.getOrThrow<number>('KAFKA_SEND_TIMEOUT_MS');

    const kafka = createKafkaClient({
      brokers: kafkaBrokers
        .split(',')
        .map((broker: string) => broker.trim())
        .filter(Boolean),
      clientId: `${kafkaClientId}-ingestion`,
      logger,
      requestTimeoutMs: kafkaSendTimeoutMs,
    });

    this.producer = new KafkaProducerService(kafka, {
      logger,
      sendTimeoutMs: kafkaSendTimeoutMs,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(event: RawLogEvent): Promise<void> {
    await this.producer.sendJson(KAFKA_TOPICS.LOGS_RAW_V1, event, {
      key: event.projectId,
    });
  }

  async publishBatch(events: RawLogEvent[]): Promise<void> {
    await this.producer.send({
      messages: events.map((event) => ({
        key: event.projectId,
        value: JSON.stringify(event),
      })),
      topic: KAFKA_TOPICS.LOGS_RAW_V1,
    });
  }
}
