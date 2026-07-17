import type { RawLogEvent } from '@logscope/contracts';
import { InvalidLogEventError } from '../errors/invalid-log-event.error';
import { ElasticsearchLogWriterService } from './elasticsearch-log-writer.service';
import { LogEventProcessorService } from './log-event-processor.service';
import { RealtimeLogPublisherService } from './realtime-log-publisher.service';

describe('LogEventProcessorService', () => {
  let indexLog: jest.Mock<Promise<void>, [RawLogEvent]>;
  let publish: jest.Mock<Promise<void>, [RawLogEvent]>;
  let service: LogEventProcessorService;

  beforeEach(() => {
    indexLog = jest.fn<Promise<void>, [RawLogEvent]>(() => Promise.resolve());
    publish = jest.fn<Promise<void>, [RawLogEvent]>(() => Promise.resolve());
    const logWriter = {
      indexLog,
    } as unknown as ElasticsearchLogWriterService;
    const realtimePublisher = {
      publish,
    } as unknown as RealtimeLogPublisherService;
    service = new LogEventProcessorService(logWriter, realtimePublisher);
  });

  it('validates, normalizes, redacts and indexes a log event', async () => {
    const event = await service.process({
      attributes: {
        authorization: 'Bearer secret',
        orderId: 'ord_123',
      },
      environment: ' Production ',
      eventId: 'e13be90d-e5b5-4087-82d1-bc4a8acaf905',
      level: 'error',
      message: 'Payment gateway timeout',
      projectId: 'f9856a5a-45f1-4051-bb80-228de0bdbbc1',
      service: ' payment-service ',
      timestamp: '2026-07-07T06:00:00.000Z',
    });

    expect(event).toEqual(
      expect.objectContaining({
        attributes: {
          authorization: '[REDACTED]',
          orderId: 'ord_123',
        },
        environment: 'production',
        service: 'payment-service',
        timestamp: '2026-07-07T06:00:00.000Z',
      }),
    );
    expect(indexLog).toHaveBeenCalledWith(event);
    expect(publish).toHaveBeenCalledWith(event);
    expect(indexLog.mock.invocationCallOrder[0]).toBeLessThan(publish.mock.invocationCallOrder[0]!);
  });

  it('rejects an invalid contract without indexing it', async () => {
    await expect(
      service.process({
        eventId: 'not-a-uuid',
        message: '',
      }),
    ).rejects.toBeInstanceOf(InvalidLogEventError);
    expect(indexLog).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('does not publish before Elasticsearch indexing succeeds', async () => {
    indexLog.mockRejectedValue(new Error('Elasticsearch unavailable'));

    await expect(
      service.process({
        environment: 'production',
        eventId: 'e13be90d-e5b5-4087-82d1-bc4a8acaf905',
        level: 'error',
        message: 'Payment gateway timeout',
        projectId: 'f9856a5a-45f1-4051-bb80-228de0bdbbc1',
        service: 'payment-service',
        timestamp: '2026-07-07T06:00:00.000Z',
      }),
    ).rejects.toThrow('Elasticsearch unavailable');
    expect(publish).not.toHaveBeenCalled();
  });
});
