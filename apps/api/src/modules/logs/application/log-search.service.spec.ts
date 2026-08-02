import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { LogSearchFilter, LogSearchResult } from '@logscope/elasticsearch';
import { InvalidLogSearchCursorError } from '@logscope/elasticsearch';
import { ProjectsService } from '../../projects/projects.service';
import { GraphQLLogLevel, LogFilterInput } from '../dto/log-filter.input';
import { LogSearchService } from './log-search.service';

interface ProjectsServiceMock {
  assertProjectAccess: jest.Mock<Promise<void>, [string, string]>;
}

interface LogReaderMock {
  search: jest.Mock<Promise<LogSearchResult>, [LogSearchFilter]>;
}

describe('LogSearchService', () => {
  const userId = '1072b166-5433-4db1-920a-360e45d1c38c';
  const projectId = 'f9856a5a-45f1-4051-bb80-228de0bdbbc1';
  let projectsService: ProjectsServiceMock;
  let logReader: LogReaderMock;
  let service: LogSearchService;

  beforeEach(() => {
    projectsService = {
      assertProjectAccess: jest.fn<Promise<void>, [string, string]>(() => Promise.resolve()),
    };
    logReader = {
      search: jest.fn<Promise<LogSearchResult>, [LogSearchFilter]>(() =>
        Promise.resolve({ items: [] }),
      ),
    };
    service = new LogSearchService(projectsService as unknown as ProjectsService, logReader);
  });

  it('checks membership before searching with the same project scope', async () => {
    await service.search(userId, createFilter());

    expect(projectsService.assertProjectAccess).toHaveBeenCalledWith(userId, projectId);
    expect(logReader.search).toHaveBeenCalledWith(
      expect.objectContaining({
        levels: [GraphQLLogLevel.ERROR],
        projectId,
      }),
    );

    const accessCallOrder = projectsService.assertProjectAccess.mock.invocationCallOrder[0];
    const searchCallOrder = logReader.search.mock.invocationCallOrder[0];
    expect(accessCallOrder).toBeLessThan(searchCallOrder!);
  });

  it('does not query Elasticsearch when the user is not a project member', async () => {
    projectsService.assertProjectAccess.mockRejectedValue(
      new NotFoundException('Project not found'),
    );

    await expect(service.search(userId, createFilter())).rejects.toBeInstanceOf(NotFoundException);
    expect(logReader.search).not.toHaveBeenCalled();
  });

  it('rejects an invalid time range before accessing storage', async () => {
    const filter = createFilter();
    filter.from = filter.to;

    await expect(service.search(userId, filter)).rejects.toBeInstanceOf(BadRequestException);
    expect(projectsService.assertProjectAccess).not.toHaveBeenCalled();
    expect(logReader.search).not.toHaveBeenCalled();
  });

  it('returns a client-safe error for malformed cursors', async () => {
    logReader.search.mockRejectedValue(new InvalidLogSearchCursorError());

    await expect(service.search(userId, createFilter())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  function createFilter(): LogFilterInput {
    return Object.assign(new LogFilterInput(), {
      environments: ['production'],
      from: new Date('2026-07-07T00:00:00.000Z'),
      levels: [GraphQLLogLevel.ERROR],
      limit: 50,
      projectId,
      services: ['payment-service'],
      to: new Date('2026-07-08T00:00:00.000Z'),
    });
  }
});
