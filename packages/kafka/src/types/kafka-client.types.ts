import type { KafkaConfig } from 'kafkajs';
import type { KafkaLogger } from './logger';

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
