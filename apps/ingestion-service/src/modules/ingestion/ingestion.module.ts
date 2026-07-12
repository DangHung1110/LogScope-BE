import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from '@logscope/config';
import { DatabaseModule } from '../database/database.module';
import { IngestionController } from './ingestion.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { ApiKeyService } from './services/api-key.service';
import { KafkaLogProducerService } from './services/kafka-log-producer.service';
import { LogIngestionService } from './services/log-ingestion.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      expandVariables: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
  ],
  controllers: [IngestionController],
  providers: [
    ApiKeyGuard,
    ApiKeyService,
    KafkaLogProducerService,
    LogIngestionService,
    RateLimitGuard,
  ],
})
export class IngestionModule {}
