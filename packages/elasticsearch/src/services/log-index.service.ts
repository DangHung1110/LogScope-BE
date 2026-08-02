import { Client, estypes } from '@elastic/elasticsearch';
import type { RawLogEvent } from '@logscope/contracts';
import { InvalidLogSearchCursorError } from '../errors/invalid-log-search-cursor.error';
import { LOGS_INDEX_NAME, LOGS_INDEX_TEMPLATE_NAME } from '../indices/log-index.constants';
import { LOG_INDEX_MAPPINGS, LOG_INDEX_TEMPLATE } from '../indices/log-index.mapping';
import type {
  LogIndexServiceOptions,
  LogSearchCursor,
  LogSearchFilter,
  LogSearchResult,
} from '../types/log-index.types';

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

  async searchLogs(filter: LogSearchFilter): Promise<LogSearchResult> {
    const cursor = filter.cursor ? decodeCursor(filter.cursor) : undefined;
    const queryFilters: estypes.QueryDslQueryContainer[] = [
      {
        term: {
          projectId: filter.projectId,
        },
      },
      {
        range: {
          timestamp: {
            gte: filter.from,
            lte: filter.to,
          },
        },
      },
    ];
    const mustQueries: estypes.QueryDslQueryContainer[] = [];

    addTermsFilter(queryFilters, 'service', filter.services);
    addTermsFilter(queryFilters, 'environment', filter.environments);
    addTermsFilter(queryFilters, 'level', filter.levels);

    if (filter.traceId) {
      queryFilters.push({
        term: {
          traceId: filter.traceId,
        },
      });
    }

    const searchText = filter.search?.trim();
    if (searchText) {
      mustQueries.push({
        match: {
          message: {
            operator: 'and',
            query: searchText,
          },
        },
      });
    }

    const response = await this.client.search<RawLogEvent>({
      index: this.indexName,
      query: {
        bool: {
          filter: queryFilters,
          must: mustQueries,
        },
      },
      search_after: cursor ? [cursor.timestamp, cursor.eventId] : undefined,
      size: filter.limit + 1,
      sort: [
        {
          timestamp: {
            format: 'strict_date_optional_time_nanos',
            order: 'desc',
          },
        },
        {
          eventId: {
            order: 'desc',
          },
        },
      ],
      track_total_hits: false,
    });

    const events = response.hits.hits.flatMap((hit) => (hit._source ? [hit._source] : []));
    const items = events.slice(0, filter.limit);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor: events.length > filter.limit && lastItem ? encodeCursor(lastItem) : undefined,
    };
  }
}

function addTermsFilter(
  filters: estypes.QueryDslQueryContainer[],
  field: string,
  values: readonly string[] | undefined,
): void {
  if (!values || values.length === 0) {
    return;
  }

  filters.push({
    terms: {
      [field]: [...values],
    },
  });
}

function encodeCursor(event: RawLogEvent): string {
  const cursor: LogSearchCursor = {
    eventId: event.eventId,
    timestamp: event.timestamp,
  };

  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(value: string): LogSearchCursor {
  try {
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;

    if (
      cursor === null ||
      typeof cursor !== 'object' ||
      !('eventId' in cursor) ||
      typeof cursor.eventId !== 'string' ||
      cursor.eventId.length === 0 ||
      !('timestamp' in cursor) ||
      typeof cursor.timestamp !== 'string' ||
      Number.isNaN(Date.parse(cursor.timestamp))
    ) {
      throw new InvalidLogSearchCursorError();
    }

    return {
      eventId: cursor.eventId,
      timestamp: cursor.timestamp,
    };
  } catch (error: unknown) {
    if (error instanceof InvalidLogSearchCursorError) {
      throw error;
    }

    throw new InvalidLogSearchCursorError();
  }
}
