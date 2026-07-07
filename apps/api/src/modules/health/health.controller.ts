import { Controller, Get } from '@nestjs/common';

export interface HealthCheckResponse {
  memoryUsage: NodeJS.MemoryUsage;
  status: 'ok';
  timestamp: string;
  uptime: number;
}

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthCheckResponse {
    return {
      memoryUsage: process.memoryUsage(),
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
