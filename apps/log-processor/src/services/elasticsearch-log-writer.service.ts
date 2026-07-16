import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@logscope/config';
import type { RawLogEvent } from '@logscope/contracts';
import { createElasticsearchClient, LogIndexService } from '@logscope/elasticsearch';

@Injectable()
export class ElasticsearchLogWriterService implements OnModuleInit, OnModuleDestroy {
  private readonly client;
  private readonly logIndexService: LogIndexService;
  private readonly logger = new Logger(ElasticsearchLogWriterService.name);

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    this.client = createElasticsearchClient({
      node: configService.getOrThrow<string>('ELASTICSEARCH_NODE'),
    });
    this.logIndexService = new LogIndexService(this.client, {
      indexName: configService.getOrThrow<string>('ELASTICSEARCH_LOGS_INDEX'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.logIndexService.ensureLogIndex();
    this.logger.log('Elasticsearch log index is ready');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  async indexLog(event: RawLogEvent): Promise<void> {
    await this.logIndexService.indexLog(event);
  }
}
