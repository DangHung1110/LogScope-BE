import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '@logscope/config';
import { LOG_RECEIVED_CHANNEL_V1, type RawLogEvent } from '@logscope/contracts';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RealtimeLogPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly client: RedisClientType;
  private readonly logger = new Logger(RealtimeLogPublisherService.name);

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    this.client = createClient({
      url: configService.getOrThrow('REDIS_URL'),
    });
    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis publisher error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log('Redis realtime publisher connected');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close();
    }
  }

  async publish(event: RawLogEvent): Promise<void> {
    await this.client.publish(LOG_RECEIVED_CHANNEL_V1, JSON.stringify(event));
  }
}
