import type { RawLogEvent } from '@logscope/contracts';
import { normalizeLogEvent } from './normalize-log-event';

describe('normalizeLogEvent', () => {
  it('normalizes identifiers, environment and timestamp without changing the message', () => {
    const event: RawLogEvent = {
      environment: ' Production ',
      eventId: 'e13be90d-e5b5-4087-82d1-bc4a8acaf905',
      level: 'error',
      message: '  preserve message spacing  ',
      projectId: 'f9856a5a-45f1-4051-bb80-228de0bdbbc1',
      service: ' payment-service ',
      spanId: ' ABC123 ',
      timestamp: '2026-07-07T06:00:00+00:00',
      traceId: ' DEF456 ',
    };

    expect(normalizeLogEvent(event)).toEqual({
      ...event,
      environment: 'production',
      message: '  preserve message spacing  ',
      service: 'payment-service',
      spanId: 'abc123',
      timestamp: '2026-07-07T06:00:00.000Z',
      traceId: 'def456',
    });
  });
});
