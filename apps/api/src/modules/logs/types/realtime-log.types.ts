import type { RawLogEvent } from '@logscope/contracts';

export interface LogReceivedPayload {
  logReceived: RawLogEvent;
}
