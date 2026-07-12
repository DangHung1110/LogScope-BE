import type { RetryOptions } from 'kafkajs';

export const DEFAULT_KAFKA_RETRY: RetryOptions = {
  factor: 0.2,
  initialRetryTime: 300,
  maxRetryTime: 30_000,
  multiplier: 2,
  retries: 8,
};

export const DEFAULT_KAFKA_SEND_TIMEOUT_MS = 10_000;

export const DEFAULT_KAFKA_CONSUMER_CONNECT_TIMEOUT_MS = 10_000;
