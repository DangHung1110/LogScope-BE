import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { LogProcessorModule } from './log-processor.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(LogProcessorModule);
  app.enableShutdownHooks();
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Log processor failed to start', error);
  process.exitCode = 1;
});
