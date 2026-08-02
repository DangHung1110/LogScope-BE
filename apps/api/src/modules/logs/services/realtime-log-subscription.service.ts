import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '@logscope/config';
import { LOG_RECEIVED_CHANNEL_V1, rawLogEventSchema } from '@logscope/contracts';
import { PubSub } from 'graphql-subscriptions';
import { createClient, type RedisClientType } from 'redis';
import { EventEmitter } from 'node:events';
import type { LogReceivedPayload } from '../types/realtime-log.types';

@Injectable()
export class RealtimeLogSubscriptionService implements OnModuleInit, OnModuleDestroy {
  private readonly client: RedisClientType;
  private readonly logger = new Logger(RealtimeLogSubscriptionService.name);
  private readonly pubSub: PubSub<Record<string, LogReceivedPayload>>;

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(0);
    this.pubSub = new PubSub({ eventEmitter });
    this.client = createClient({
      url: configService.getOrThrow('REDIS_URL'),
    });
    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis subscriber error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    await this.client.subscribe(LOG_RECEIVED_CHANNEL_V1, (message) => {
      void this.forwardMessage(message);
    });
    this.logger.log(`Subscribed to Redis channel ${LOG_RECEIVED_CHANNEL_V1}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.unsubscribe(LOG_RECEIVED_CHANNEL_V1);
      await this.client.close();
    }
  }

  subscribe(projectId: string): AsyncIterable<LogReceivedPayload> {
    return this.pubSub.asyncIterableIterator<LogReceivedPayload>(this.projectTopic(projectId));
  }

  private async forwardMessage(message: string): Promise<void> {
    let payload: unknown;

    try {
      payload = JSON.parse(message) as unknown;
    } catch {
      this.logger.warn('Ignored malformed realtime log message from Redis');
      return;
    }

    const result = rawLogEventSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn('Ignored realtime log message that does not match the v1 contract');
      return;
    }

    await this.pubSub.publish(this.projectTopic(result.data.projectId), {
      logReceived: result.data,
    });
  }

  private projectTopic(projectId: string): string {
    return `logReceived:${projectId}`;
  }
}
