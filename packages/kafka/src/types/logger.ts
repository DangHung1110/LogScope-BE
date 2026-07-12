import { logLevel, type LogEntry, type logCreator } from 'kafkajs';

export interface KafkaLogger {
  debug: (message: string, metadata?: Record<string, unknown>) => void;
  error: (message: string, metadata?: Record<string, unknown>) => void;
  info: (message: string, metadata?: Record<string, unknown>) => void;
  warn: (message: string, metadata?: Record<string, unknown>) => void;
}

const noopLogger: KafkaLogger = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

export function createKafkaLogCreator(logger: KafkaLogger = noopLogger): logCreator {
  return () => (entry: LogEntry) => {
    const metadata: Record<string, unknown> = {
      label: entry.label,
      message: entry.log.message,
      namespace: entry.namespace,
      timestamp: entry.log.timestamp,
    };
    const message = `Kafka ${entry.label}`;

    if (entry.level === logLevel.ERROR) {
      logger.error(message, metadata);
      return;
    }

    if (entry.level === logLevel.WARN) {
      logger.warn(message, metadata);
      return;
    }

    if (entry.level === logLevel.DEBUG) {
      logger.debug(message, metadata);
      return;
    }

    logger.info(message, metadata);
  };
}
