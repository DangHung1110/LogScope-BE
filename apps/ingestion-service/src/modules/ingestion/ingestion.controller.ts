import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import type { RawLogEvent } from '@logscope/contracts';
import { randomUUID } from 'crypto';
import { CurrentProject } from './decorators/current-project.decorator';
import { createLogBatchSchema } from './dto/create-log-batch.dto';
import type { CreateLogBatchDto } from './dto/create-log-batch.dto';
import { createLogSchema } from './dto/create-log.dto';
import type { CreateLogDto } from './dto/create-log.dto';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { LogIngestionService } from './services/log-ingestion.service';
import type { AuthenticatedProject } from './types/authenticated-project';
import type { AcceptedBatchLogResponse, AcceptedLogResponse } from './types/log-ingestion.types';
import { ZodValidationPipe } from './validation/zod-validation.pipe';

@Controller({
  path: 'logs',
  version: '1',
})
@UseGuards(RateLimitGuard, ApiKeyGuard)
export class IngestionController {
  constructor(private readonly logIngestionService: LogIngestionService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestLog(
    @CurrentProject() project: AuthenticatedProject,
    @Body(new ZodValidationPipe(createLogSchema)) dto: CreateLogDto,
  ): Promise<AcceptedLogResponse> {
    const event: RawLogEvent = {
      eventId: randomUUID(),
      projectId: project.id,
      ...dto,
      timestamp: dto.timestamp ?? new Date().toISOString(),
    };

    await this.logIngestionService.publish(event);

    return {
      accepted: true,
      eventId: event.eventId,
    };
  }

  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestLogBatch(
    @CurrentProject() project: AuthenticatedProject,
    @Body(new ZodValidationPipe(createLogBatchSchema)) dto: CreateLogBatchDto,
  ): Promise<AcceptedBatchLogResponse> {
    const events: RawLogEvent[] = dto.logs.map((log) => ({
      eventId: randomUUID(),
      projectId: project.id,
      ...log,
      timestamp: log.timestamp ?? new Date().toISOString(),
    }));

    await this.logIngestionService.publishBatch(events);

    return {
      accepted: true,
      count: events.length,
      eventIds: events.map((event) => event.eventId),
    };
  }
}
