import type { ConsumerSubscribeTopic } from 'kafkajs';
import type {
  KafkaConsumerHandle,
  KafkaConsumerHelperOptions,
} from '../types/kafka-consumer.types';

export async function startKafkaConsumer(
  options: KafkaConsumerHelperOptions,
): Promise<KafkaConsumerHandle> {
  const consumer = options.kafka.consumer({
    groupId: options.groupId,
    ...options.consumerConfig,
  });
  options.onConsumerCreated?.(consumer);

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
