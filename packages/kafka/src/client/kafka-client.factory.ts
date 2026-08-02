import { Kafka, logLevel } from 'kafkajs';
import { DEFAULT_KAFKA_RETRY } from '../config/retry.config';
import { createKafkaLogCreator } from '../types/logger';
import type { CreateKafkaClientOptions } from '../types/kafka-client.types';

export function createKafkaClient(options: CreateKafkaClientOptions): Kafka {
  return new Kafka({
    brokers: options.brokers,
    clientId: options.clientId,
    connectionTimeout: options.connectionTimeoutMs ?? 3_000,
    logCreator: createKafkaLogCreator(options.logger),
    logLevel: logLevel.INFO,
    requestTimeout: options.requestTimeoutMs ?? 30_000,
    retry: options.retry ?? DEFAULT_KAFKA_RETRY,
    sasl: options.sasl,
    ssl: options.ssl,
  });
}
