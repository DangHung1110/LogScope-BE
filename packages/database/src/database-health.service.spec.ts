import { DatabaseHealthService } from './database-health.service';
import type { PrismaService } from './prisma.service';

describe('DatabaseHealthService', () => {
  it('reports readiness after a successful query', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    } as unknown as PrismaService;
    const service = new DatabaseHealthService(prisma);

    await expect(service.isReady()).resolves.toBe(true);
  });
});
