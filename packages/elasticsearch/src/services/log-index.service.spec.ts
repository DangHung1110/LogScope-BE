import type { Client } from '@elastic/elasticsearch';
import type { RawLogEvent } from '@logscope/contracts';
import { InvalidLogSearchCursorError, LogIndexService } from './log-index.service';

interface SearchRequest {
  query?: {
    bool?: {
      filter?: unknown[];
    };
  };
  search_after?: unknown[];
}

interface SearchResponse {
  hits: {
    hits: {
      _source: RawLogEvent;
    }[];
  };
}

describe('LogIndexService search', () => {
  const event: RawLogEvent = {
    environment: 'production',
    eventId: 'e13be90d-e5b5-4087-82d1-bc4a8acaf905',
    level: 'error',
    message: 'Payment gateway timeout',
    projectId: 'f9856a5a-45f1-4051-bb80-228de0bdbbc1',
    service: 'payment-service',
    timestamp: '2026-07-07T06:00:00.000Z',
  };

  it('always applies the project and time filters', async () => {
    const search = jest.fn<Promise<SearchResponse>, [SearchRequest]>(() =>
      Promise.resolve({
        hits: {
          hits: [{ _source: event }],
        },
      }),
    );
    const service = new LogIndexService({ search } as unknown as Client);

    const result = await service.searchLogs({
      from: '2026-07-07T00:00:00.000Z',
      limit: 50,
      projectId: event.projectId,
      to: '2026-07-08T00:00:00.000Z',
    });

    expect(result).toEqual({
      items: [event],
      nextCursor: undefined,
    });
    const searchRequest = search.mock.calls[0]?.[0];
    expect(searchRequest?.query?.bool?.filter).toContainEqual({
      term: {
        projectId: event.projectId,
      },
    });
  });

  it('rejects malformed cursors before querying Elasticsearch', async () => {
    const search = jest.fn<Promise<SearchResponse>, [SearchRequest]>();
    const service = new LogIndexService({ search } as unknown as Client);

    await expect(
      service.searchLogs({
        cursor: 'not-a-valid-cursor',
        from: '2026-07-07T00:00:00.000Z',
        limit: 50,
        projectId: event.projectId,
        to: '2026-07-08T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(InvalidLogSearchCursorError);
    expect(search).not.toHaveBeenCalled();
  });

  it('uses an opaque search-after cursor for stable pagination', async () => {
    const olderEvent: RawLogEvent = {
      ...event,
      eventId: '2090135d-29a9-4a18-98dd-3354a7c78ee7',
      timestamp: '2026-07-07T05:00:00.000Z',
    };
    const search = jest
      .fn<Promise<SearchResponse>, [SearchRequest]>()
      .mockResolvedValueOnce({
        hits: {
          hits: [{ _source: event }, { _source: olderEvent }],
        },
      })
      .mockResolvedValueOnce({
        hits: {
          hits: [],
        },
      });
    const service = new LogIndexService({ search } as unknown as Client);
    const baseFilter = {
      from: '2026-07-07T00:00:00.000Z',
      limit: 1,
      projectId: event.projectId,
      to: '2026-07-08T00:00:00.000Z',
    };

    const firstPage = await service.searchLogs(baseFilter);
    expect(firstPage.items).toEqual([event]);
    expect(firstPage.nextCursor).toEqual(expect.any(String));

    await service.searchLogs({
      ...baseFilter,
      cursor: firstPage.nextCursor,
    });

    expect(search.mock.calls[1]?.[0].search_after).toEqual([event.timestamp, event.eventId]);
  });
});
