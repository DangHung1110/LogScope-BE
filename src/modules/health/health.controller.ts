import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  memory: {
    heapUsedBytes: number;
    rssBytes: number;
  };
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    const memoryUsage = process.memoryUsage();

    return {
      memory: {
        heapUsedBytes: memoryUsage.heapUsed,
        rssBytes: memoryUsage.rss,
      },
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
