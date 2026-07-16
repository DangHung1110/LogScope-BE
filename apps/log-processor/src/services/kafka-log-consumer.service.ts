import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@logscope/config';
import {
  createKafkaClient,
  deserializeJson,
  type KafkaConsumerHandle,
  KAFKA_TOPICS,
  startKafkaConsumer,
} from '@logscope/kafka';
import type { Consumer, EachMessagePayload } from 'kafkajs';
import { InvalidLogEventError } from '../errors/invalid-log-event.error';
import { createNestKafkaLogger } from '../utils/nest-kafka-logger';
import { DeadLetterProducerService } from './dead-letter-producer.service';
import { LogEventProcessorService } from './log-event-processor.service';

@Injectable()
export class KafkaLogConsumerService implements OnApplicationBootstrap, OnModuleDestroy {
  private consumer?: Consumer;
  private consumerHandle?: KafkaConsumerHandle;
  private readonly concurrency: number;
  private readonly groupId: string;
  private readonly kafka;
  private readonly logger = new Logger(KafkaLogConsumerService.name);
  private readonly kafkaLogger = createNestKafkaLogger(this.logger);

  constructor(
    configService: ConfigService<EnvironmentVariables, true>,
    private readonly deadLetterProducer: DeadLetterProducerService,
    private readonly logEventProcessor: LogEventProcessorService,
  ) {
    this.concurrency = configService.getOrThrow<number>('LOG_PROCESSOR_CONCURRENCY');
    this.groupId = configService.getOrThrow<string>('LOG_PROCESSOR_GROUP_ID');
    this.kafka = createKafkaClient({
      brokers: configService
        .getOrThrow<string>('KAFKA_BROKERS')
        .split(',')
        .map((broker) => broker.trim())
        .filter(Boolean),
      clientId: `${configService.getOrThrow<string>('KAFKA_CLIENT_ID')}-processor`,
      logger: this.kafkaLogger,
      requestTimeoutMs: configService.getOrThrow<number>('KAFKA_SEND_TIMEOUT_MS'),
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    this.consumerHandle = await startKafkaConsumer({
      groupId: this.groupId,
      kafka: this.kafka,
      logger: this.kafkaLogger,
      onConsumerCreated: (consumer) => {
        this.consumer = consumer;
      },
      runConfig: {
        autoCommit: false,
        eachMessage: (payload) => this.handleMessage(payload),
        partitionsConsumedConcurrently: this.concurrency,
      },
      topics: [KAFKA_TOPICS.LOGS_RAW_V1],
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumerHandle?.disconnect();
  }

  private async handleMessage({ message, partition, topic }: EachMessagePayload): Promise<void> {
    let payload: unknown;

    try {
      payload = deserializeJson<unknown>(message.value);
    } catch (error: unknown) {
      await this.sendToDeadLetterQueue(
        '[UNPARSEABLE JSON PAYLOAD]',
        error,
        topic,
        partition,
        message.offset,
        message.key?.toString(),
      );
      await this.commitOffset(topic, partition, message.offset);
      return;
    }

    try {
      const event = await this.logEventProcessor.process(payload);
      await this.commitOffset(topic, partition, message.offset);
      this.logger.debug(`Indexed log event ${event.eventId}`);
    } catch (error: unknown) {
      if (error instanceof InvalidLogEventError) {
        await this.sendToDeadLetterQueue(
          payload,
          error,
          topic,
          partition,
          message.offset,
          message.key?.toString(),
        );
        await this.commitOffset(topic, partition, message.offset);
        return;
      }

      this.logger.error('Failed to index log event; Kafka offset was not committed', error);
      throw error;
    }
  }

  private async sendToDeadLetterQueue(
    payload: unknown,
    error: unknown,
    topic: string,
    partition: number,
    offset: string,
    messageKey?: string,
  ): Promise<void> {
    const normalizedError = normalizeError(error);

    await this.deadLetterProducer.publish(
      {
        error: normalizedError,
        failedAt: new Date().toISOString(),
        payload,
        source: {
          offset,
          partition,
          topic,
        },
      },
      messageKey ?? `${topic}:${partition}:${offset}`,
    );

    this.logger.warn(`Moved invalid log at ${topic}[${partition}]@${offset} to DLQ`);
  }

  private async commitOffset(topic: string, partition: number, offset: string): Promise<void> {
    if (!this.consumer) {
      throw new Error('Kafka consumer is not initialized');
    }

    await this.consumer.commitOffsets([
      {
        offset: (BigInt(offset) + 1n).toString(),
        partition,
        topic,
      },
    ]);
  }
}

function normalizeError(error: unknown): { details?: unknown; message: string; name: string } {
  if (error instanceof InvalidLogEventError) {
    return {
      details: error.issues,
      message: error.message,
      name: error.name,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: String(error),
    name: 'UnknownError',
  };
}
