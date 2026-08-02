import type { LogSearchFilter, LogSearchResult } from '@logscope/elasticsearch';

export abstract class LogReaderPort {
  abstract search(filter: LogSearchFilter): Promise<LogSearchResult>;
}
