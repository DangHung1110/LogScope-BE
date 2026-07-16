import { Injectable } from '@nestjs/common';
import { rawLogEventSchema, type RawLogEvent } from '@logscope/contracts';
import { InvalidLogEventError } from '../errors/invalid-log-event.error';
import { normalizeLogEvent } from '../processing/normalize-log-event';
import { redactSensitiveData } from '../processing/redact-sensitive-data';
import { ElasticsearchLogWriterService } from './elasticsearch-log-writer.service';

@Injectable()
export class LogEventProcessorService {
  constructor(private readonly logWriter: ElasticsearchLogWriterService) {}

  async process(payload: unknown): Promise<RawLogEvent> {
    const validationResult = rawLogEventSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new InvalidLogEventError(validationResult.error.issues);
    }

    const normalizedEvent = normalizeLogEvent(validationResult.data);
    const processedEvent: RawLogEvent = {
      ...normalizedEvent,
      attributes: normalizedEvent.attributes
        ? (redactSensitiveData(normalizedEvent.attributes) as Record<string, unknown>)
        : undefined,
    };

    await this.logWriter.indexLog(processedEvent);
    return processedEvent;
  }
}
