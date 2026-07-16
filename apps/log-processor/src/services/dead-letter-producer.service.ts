import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@logscope/config';
import { createKafkaClient, KafkaProducerService, KAFKA_TOPICS } from '@logscope/kafka';
import { createNestKafkaLogger } from '../utils/nest-kafka-logger';
import { redactSensitiveData } from '../processing/redact-sensitive-data';

export interface DeadLetterMessage {
  error: {
    details?: unknown;
    message: string;
    name: string;
  };
  failedAt: string;
  payload: unknown;
  source: {
    offset: string;
    partition: number;
    topic: string;
  };
}

@Injectable()
export class DeadLetterProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly producer: KafkaProducerService;

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const logger = createNestKafkaLogger(new Logger(DeadLetterProducerService.name));
    const kafka = createKafkaClient({
      brokers: configService
        .getOrThrow<string>('KAFKA_BROKERS')
        .split(',')
        .map((broker) => broker.trim())
        .filter(Boolean),
      clientId: `${configService.getOrThrow<string>('KAFKA_CLIENT_ID')}-processor-dlq`,
      logger,
      requestTimeoutMs: configService.getOrThrow<number>('KAFKA_SEND_TIMEOUT_MS'),
    });

    this.producer = new KafkaProducerService(kafka, {
      logger,
      sendTimeoutMs: configService.getOrThrow<number>('KAFKA_SEND_TIMEOUT_MS'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(message: DeadLetterMessage, key: string): Promise<void> {
    await this.producer.sendJson(
      KAFKA_TOPICS.LOGS_DLQ_V1,
      {
        ...message,
        payload: redactSensitiveData(message.payload),
      },
      { key },
    );
  }
}
