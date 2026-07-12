import type { Kafka, Producer, ProducerConfig, ProducerRecord, RecordMetadata } from 'kafkajs';
import { DEFAULT_KAFKA_SEND_TIMEOUT_MS } from '../config/retry.config';
import { serializeJson } from '../serialization/json.serializer';
import type { KafkaLogger } from '../types/logger';

export interface KafkaProducerServiceOptions {
  logger?: KafkaLogger;
  producerConfig?: ProducerConfig;
  sendTimeoutMs?: number;
}

export interface SendJsonMessageOptions {
  headers?: Record<string, string | Buffer>;
  key?: string;
  partition?: number;
  timestamp?: string;
}

export class KafkaProducerService {
  private connectPromise?: Promise<void>;
  private isConnected = false;
  private readonly producer: Producer;

  constructor(
    kafka: Kafka,
    private readonly options: KafkaProducerServiceOptions = {},
  ) {
    this.producer = kafka.producer(options.producerConfig);
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    this.connectPromise ??= this.connectProducer();
    await this.connectPromise;
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    this.options.logger?.info('Disconnecting Kafka producer');
    await this.producer.disconnect();
    this.isConnected = false;
    this.connectPromise = undefined;
    this.options.logger?.info('Kafka producer disconnected');
  }

  async send(record: ProducerRecord): Promise<RecordMetadata[]> {
    await this.connect();

    const recordWithTimeout: ProducerRecord = {
      ...record,
      timeout: record.timeout ?? this.options.sendTimeoutMs ?? DEFAULT_KAFKA_SEND_TIMEOUT_MS,
    };

    this.options.logger?.debug('Sending Kafka record', {
      messageCount: recordWithTimeout.messages.length,
      topic: recordWithTimeout.topic,
    });

    const metadata = await this.producer.send(recordWithTimeout);

    this.options.logger?.debug('Kafka record sent', {
      metadata,
      topic: recordWithTimeout.topic,
    });

    return metadata;
  }

  async sendJson<TPayload>(
    topic: string,
    payload: TPayload,
    options: SendJsonMessageOptions = {},
  ): Promise<RecordMetadata[]> {
    return this.send({
      messages: [
        {
          headers: options.headers,
          key: options.key,
          partition: options.partition,
          timestamp: options.timestamp,
          value: serializeJson(payload),
        },
      ],
      topic,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connectProducer(): Promise<void> {
    this.options.logger?.info('Connecting Kafka producer');
    await this.producer.connect();
    this.isConnected = true;
    this.options.logger?.info('Kafka producer connected');
  }
}
