import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@logscope/config';
import {
  createElasticsearchClient,
  type LogSearchFilter,
  type LogSearchResult,
  LogIndexService,
} from '@logscope/elasticsearch';

@Injectable()
export class ElasticsearchLogReaderService implements OnModuleDestroy {
  private readonly client;
  private readonly logIndexService: LogIndexService;

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    this.client = createElasticsearchClient({
      node: configService.getOrThrow<string>('ELASTICSEARCH_NODE'),
    });
    this.logIndexService = new LogIndexService(this.client, {
      indexName: configService.getOrThrow<string>('ELASTICSEARCH_LOGS_INDEX'),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  search(filter: LogSearchFilter): Promise<LogSearchResult> {
    return this.logIndexService.searchLogs(filter);
  }
}
