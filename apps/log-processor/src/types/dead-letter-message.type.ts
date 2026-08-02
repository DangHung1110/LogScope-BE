export interface DeadLetterMessage {
  error: {
    details?: unknown;
    message: string;
    name: string;
  };
  failedAt: string;
  payload: unknown;
  source: {
    offset: string;
    partition: number;
    topic: string;
  };
}
