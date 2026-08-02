import type { LogLevel, RawLogEvent } from '@logscope/contracts';

export interface LogIndexServiceOptions {
  indexName?: string;
}

export interface LogSearchFilter {
  cursor?: string;
  environments?: readonly string[];
  from: string;
  levels?: readonly LogLevel[];
  limit: number;
  projectId: string;
  search?: string;
  services?: readonly string[];
  to: string;
  traceId?: string;
}

export interface LogSearchResult {
  items: RawLogEvent[];
  nextCursor?: string;
}

export interface LogSearchCursor {
  eventId: string;
  timestamp: string;
}
