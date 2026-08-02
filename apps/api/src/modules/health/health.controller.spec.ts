import { ServiceUnavailableException } from '@nestjs/common';
import type { DatabaseHealthService } from '@logscope/database';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns process liveness without querying dependencies', () => {
    const isReady = jest.fn();
    const databaseHealth = { isReady } as unknown as DatabaseHealthService;
    const controller = new HealthController(databaseHealth);

    expect(controller.getLiveness()).toMatchObject({ status: 'ok' });
    expect(isReady).not.toHaveBeenCalled();
  });

  it('returns readiness when PostgreSQL is reachable', async () => {
    const databaseHealth = {
      isReady: jest.fn().mockResolvedValue(true),
    } as unknown as DatabaseHealthService;
    const controller = new HealthController(databaseHealth);

    await expect(controller.getReadiness()).resolves.toMatchObject({
      database: 'up',
      status: 'ready',
    });
  });

  it('returns service unavailable when PostgreSQL is unreachable', async () => {
    const databaseHealth = {
      isReady: jest.fn().mockRejectedValue(new Error('offline')),
    } as unknown as DatabaseHealthService;
    const controller = new HealthController(databaseHealth);

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
