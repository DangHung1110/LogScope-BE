import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { EnvironmentVariables } from '@logscope/config';
import { parseCommaSeparatedList } from '@logscope/shared';
import { AppModule } from './app.module';
import { configureApp } from './setup-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const corsOrigins = parseCommaSeparatedList(configService.get('CORS_ORIGINS', { infer: true }));
  const port = configService.get('API_PORT', { infer: true });

  configureApp(app, corsOrigins);

  await app.listen(port, '0.0.0.0');
  Logger.log(`LogScope API is listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
