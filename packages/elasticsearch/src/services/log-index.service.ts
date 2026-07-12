import { Client } from '@elastic/elasticsearch';
import type { RawLogEvent } from '@logscope/contracts';
import { LOGS_INDEX_NAME, LOGS_INDEX_TEMPLATE_NAME } from '../indices/log-index.constants';
import { LOG_INDEX_MAPPINGS, LOG_INDEX_TEMPLATE } from '../indices/log-index.mapping';

export interface LogIndexServiceOptions {
  indexName?: string;
}

export class LogIndexService {
  private readonly indexName: string;

  constructor(
    private readonly client: Client,
    options: LogIndexServiceOptions = {},
  ) {
    this.indexName = options.indexName ?? LOGS_INDEX_NAME;
  }

  async ensureLogIndex(): Promise<void> {
    await this.putLogIndexTemplate();

    const exists = await this.client.indices.exists({
      index: this.indexName,
    });

    if (exists) {
      return;
    }

    await this.client.indices.create({
      index: this.indexName,
      mappings: LOG_INDEX_MAPPINGS,
    });
  }

  async putLogIndexTemplate(): Promise<void> {
    await this.client.indices.putIndexTemplate({
      name: LOGS_INDEX_TEMPLATE_NAME,
      ...LOG_INDEX_TEMPLATE,
    });
  }

  async indexLog(event: RawLogEvent): Promise<void> {
    await this.client.index({
      document: event,
      id: event.eventId,
      index: this.indexName,
    });
  }

  async bulkIndexLogs(events: RawLogEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.client.bulk({
      operations: events.flatMap((event) => [
        {
          index: {
            _id: event.eventId,
            _index: this.indexName,
          },
        },
        event,
      ]),
      refresh: false,
    });
  }
}
