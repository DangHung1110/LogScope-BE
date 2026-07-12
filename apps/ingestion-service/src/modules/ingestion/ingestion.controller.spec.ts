import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureIngestionApp } from '../../setup-app';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { IngestionController } from './ingestion.controller';
import { ApiKeyService } from './services/api-key.service';
import { KafkaLogProducerService } from './services/kafka-log-producer.service';
import { LogIngestionService } from './services/log-ingestion.service';

interface ApiKeyServiceMock {
  validate: jest.Mock<
    Promise<{
      apiKeyId: string;
      id: string;
      slug: string;
    } | null>,
    [string]
  >;
}

interface KafkaLogProducerServiceMock {
  publish: jest.Mock<Promise<void>, [unknown]>;
  publishBatch: jest.Mock<Promise<void>, [unknown[]]>;
}

describe('IngestionController (integration)', () => {
  let app: INestApplication<App>;
  let apiKeyService: ApiKeyServiceMock;
  let kafkaLogProducer: KafkaLogProducerServiceMock;

  const validPayload = {
    attributes: {
      orderId: 'ord_123',
    },
    environment: 'production',
    level: 'error',
    message: 'Payment gateway timeout',
    service: 'payment-service',
    timestamp: '2026-07-07T06:00:00.000Z',
  };

  beforeEach(async () => {
    apiKeyService = {
      validate: jest.fn<Promise<{ apiKeyId: string; id: string; slug: string } | null>, [string]>(
        () =>
          Promise.resolve({
            apiKeyId: 'api-key-id',
            id: '1f2450ff-0785-4798-a1b7-011799bd5ee3',
            slug: 'test-project',
          }),
      ),
    };
    kafkaLogProducer = {
      publish: jest.fn<Promise<void>, [unknown]>(() => Promise.resolve()),
      publishBatch: jest.fn<Promise<void>, [unknown[]]>(() => Promise.resolve()),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        ApiKeyGuard,
        LogIngestionService,
        RateLimitGuard,
        {
          provide: ApiKeyService,
          useValue: apiKeyService,
        },
        {
          provide: KafkaLogProducerService,
          useValue: kafkaLogProducer,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureIngestionApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts a valid log and publishes it to Kafka', async () => {
    await request(app.getHttpServer())
      .post('/v1/logs')
      .set('x-api-key', 'sp_live_valid-key')
      .send(validPayload)
      .expect(202)
      .expect(({ body }: { body: { accepted: boolean; eventId: string } }) => {
        expect(body.accepted).toBe(true);
        expect(body.eventId).toEqual(expect.any(String));
      });

    expect(kafkaLogProducer.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: validPayload.environment,
        level: validPayload.level,
        message: validPayload.message,
        projectId: '1f2450ff-0785-4798-a1b7-011799bd5ee3',
        service: validPayload.service,
      }),
    );
  });

  it('rejects invalid payloads with 400', async () => {
    await request(app.getHttpServer())
      .post('/v1/logs')
      .set('x-api-key', 'sp_live_valid-key')
      .send({
        ...validPayload,
        message: '',
      })
      .expect(400);

    expect(kafkaLogProducer.publish).not.toHaveBeenCalled();
  });

  it('rejects requests without API key with 401', async () => {
    await request(app.getHttpServer()).post('/v1/logs').send(validPayload).expect(401);
  });

  it('returns 503 when Kafka publishing fails', async () => {
    kafkaLogProducer.publish.mockRejectedValueOnce(new Error('Kafka unavailable'));

    await request(app.getHttpServer())
      .post('/v1/logs')
      .set('x-api-key', 'sp_live_valid-key')
      .send(validPayload)
      .expect(503);
  });

  it('accepts a valid log batch and publishes it to Kafka', async () => {
    await request(app.getHttpServer())
      .post('/v1/logs/batch')
      .set('x-api-key', 'sp_live_valid-key')
      .send({
        logs: [validPayload, validPayload],
      })
      .expect(202)
      .expect(({ body }: { body: { accepted: boolean; count: number; eventIds: string[] } }) => {
        expect(body.accepted).toBe(true);
        expect(body.count).toBe(2);
        expect(body.eventIds).toHaveLength(2);
      });

    expect(kafkaLogProducer.publishBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          projectId: '1f2450ff-0785-4798-a1b7-011799bd5ee3',
        }),
      ]),
    );
  });
});
