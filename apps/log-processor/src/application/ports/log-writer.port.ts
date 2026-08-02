import type { RawLogEvent } from '@logscope/contracts';

export abstract class LogWriterPort {
  abstract indexLog(event: RawLogEvent): Promise<void>;
}
