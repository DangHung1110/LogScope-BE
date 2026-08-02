import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseHealthService } from '@logscope/database';
import type { LivenessCheckResponse, ReadinessCheckResponse } from './types/health.types';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseHealth: DatabaseHealthService) {}

  @Get()
  getLiveness(): LivenessCheckResponse {
    return {
      memoryUsage: process.memoryUsage(),
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  async getReadiness(): Promise<ReadinessCheckResponse> {
    try {
      await this.databaseHealth.isReady();
    } catch (error: unknown) {
      throw new ServiceUnavailableException('Service is not ready', { cause: error });
    }

    return {
      database: 'up',
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}
