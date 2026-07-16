import { Logger } from '@nestjs/common';
import type { KafkaLogger } from '@logscope/kafka';

export function createNestKafkaLogger(logger: Logger): KafkaLogger {
  return {
    debug: (message, metadata) => logger.debug({ message, ...metadata }),
    error: (message, metadata) => logger.error({ message, ...metadata }),
    info: (message, metadata) => logger.log({ message, ...metadata }),
    warn: (message, metadata) => logger.warn({ message, ...metadata }),
  };
}
