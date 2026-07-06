import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/environment.validation';
import { configureApp } from './setup-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const corsOrigins = configService
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const port = configService.get('PORT', { infer: true });

  configureApp(app, corsOrigins);

  await app.listen(port, '0.0.0.0');
  Logger.log(`LogScope API is listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
