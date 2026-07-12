import { Kafka, logLevel, type KafkaConfig } from 'kafkajs';
import { DEFAULT_KAFKA_RETRY } from '../config/retry.config';
import { createKafkaLogCreator } from '../types/logger';
import type { KafkaLogger } from '../types/logger';

export interface CreateKafkaClientOptions {
  brokers: string[];
  clientId: string;
  connectionTimeoutMs?: number;
  logger?: KafkaLogger;
  requestTimeoutMs?: number;
  retry?: KafkaConfig['retry'];
  sasl?: KafkaConfig['sasl'];
  ssl?: KafkaConfig['ssl'];
}

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
