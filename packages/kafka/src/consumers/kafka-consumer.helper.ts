import type {
  Consumer,
  ConsumerConfig,
  ConsumerRunConfig,
  ConsumerSubscribeTopic,
  EachMessagePayload,
  Kafka,
} from 'kafkajs';
import type { KafkaLogger } from '../types/logger';

export interface KafkaConsumerHelperOptions {
  consumerConfig?: Omit<ConsumerConfig, 'groupId'>;
  fromBeginning?: boolean;
  groupId: string;
  kafka: Kafka;
  logger?: KafkaLogger;
  runConfig: Omit<ConsumerRunConfig, 'eachMessage'> & {
    eachMessage: (payload: EachMessagePayload) => Promise<void>;
  };
  topics: readonly string[];
}

export interface KafkaConsumerHandle {
  consumer: Consumer;
  disconnect: () => Promise<void>;
}

export async function startKafkaConsumer(
  options: KafkaConsumerHelperOptions,
): Promise<KafkaConsumerHandle> {
  const consumer = options.kafka.consumer({
    groupId: options.groupId,
    ...options.consumerConfig,
  });

  options.logger?.info('Connecting Kafka consumer', {
    groupId: options.groupId,
    topics: options.topics,
  });

  await consumer.connect();

  for (const topic of options.topics) {
    const subscription: ConsumerSubscribeTopic = {
      fromBeginning: options.fromBeginning ?? false,
      topic,
    };
    await consumer.subscribe(subscription);
  }

  await consumer.run(options.runConfig);

  options.logger?.info('Kafka consumer started', {
    groupId: options.groupId,
    topics: options.topics,
  });

  return {
    consumer,
    disconnect: async () => {
      options.logger?.info('Disconnecting Kafka consumer', {
        groupId: options.groupId,
      });
      await consumer.disconnect();
    },
  };
}
