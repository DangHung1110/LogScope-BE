import type {
  Consumer,
  ConsumerConfig,
  ConsumerRunConfig,
  EachMessagePayload,
  Kafka,
} from 'kafkajs';
import type { KafkaLogger } from './logger';

export interface KafkaConsumerHelperOptions {
  consumerConfig?: Omit<ConsumerConfig, 'groupId'>;
  fromBeginning?: boolean;
  groupId: string;
  kafka: Kafka;
  logger?: KafkaLogger;
  onConsumerCreated?: (consumer: Consumer) => void;
  runConfig: Omit<ConsumerRunConfig, 'eachMessage'> & {
    eachMessage: (payload: EachMessagePayload) => Promise<void>;
  };
  topics: readonly string[];
}

export interface KafkaConsumerHandle {
  consumer: Consumer;
  disconnect: () => Promise<void>;
}
