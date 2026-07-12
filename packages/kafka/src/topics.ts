export const KAFKA_TOPICS = {
  LOGS_RAW_V1: 'logs.raw.v1',
  LOGS_DLQ_V1: 'logs.dlq.v1',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];
