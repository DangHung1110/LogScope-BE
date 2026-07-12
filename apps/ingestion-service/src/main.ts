import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { EnvironmentVariables } from '@logscope/config';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { configureIngestionApp } from './setup-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(IngestionModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);

  configureIngestionApp(app);

  await app.listen(configService.getOrThrow('INGESTION_PORT'));
}

void bootstrap();
