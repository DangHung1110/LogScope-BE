import { BadRequestException, Injectable } from '@nestjs/common';
import type { RawLogEvent } from '@logscope/contracts';
import { InvalidLogSearchCursorError } from '@logscope/elasticsearch';
import { ProjectsService } from '../projects/projects.service';
import { GraphQLLogLevel, LogFilterInput } from './dto/log-filter.input';
import { LogConnectionModel } from './models/log-connection.model';
import { LogEventModel } from './models/log-event.model';
import { ElasticsearchLogReaderService } from './services/elasticsearch-log-reader.service';

@Injectable()
export class LogSearchService {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly logReader: ElasticsearchLogReaderService,
  ) {}

  async search(userId: string, filter: LogFilterInput): Promise<LogConnectionModel> {
    if (filter.from.getTime() >= filter.to.getTime()) {
      throw new BadRequestException('from must be earlier than to');
    }

    await this.projectsService.assertProjectAccess(userId, filter.projectId);

    try {
      const result = await this.logReader.search({
        cursor: filter.cursor,
        environments: filter.environments,
        from: filter.from.toISOString(),
        levels: filter.levels,
        limit: filter.limit,
        projectId: filter.projectId,
        search: filter.search,
        services: filter.services,
        to: filter.to.toISOString(),
        traceId: filter.traceId,
      });

      return {
        items: result.items.map((event) => this.toModel(event)),
        nextCursor: result.nextCursor,
      };
    } catch (error: unknown) {
      if (error instanceof InvalidLogSearchCursorError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  private toModel(event: RawLogEvent): LogEventModel {
    return {
      attributes: event.attributes,
      environment: event.environment,
      eventId: event.eventId,
      level: event.level as GraphQLLogLevel,
      message: event.message,
      service: event.service,
      timestamp: new Date(event.timestamp),
      traceId: event.traceId,
    };
  }
}
