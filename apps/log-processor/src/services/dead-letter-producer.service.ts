import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@logscope/config';
import { createKafkaClient, KafkaProducerService, KAFKA_TOPICS } from '@logscope/kafka';
import { parseCommaSeparatedList } from '@logscope/shared';
import { createNestKafkaLogger } from '../utils/nest-kafka-logger';
import { redactSensitiveData } from '../processing/redact-sensitive-data';
import type { DeadLetterMessage } from '../types/dead-letter-message.type';

@Injectable()
export class DeadLetterProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly producer: KafkaProducerService;

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const logger = createNestKafkaLogger(new Logger(DeadLetterProducerService.name));
    const kafka = createKafkaClient({
      brokers: parseCommaSeparatedList(configService.getOrThrow<string>('KAFKA_BROKERS')),
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
