import type { ProducerConfig } from 'kafkajs';
import type { KafkaLogger } from './logger';

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
