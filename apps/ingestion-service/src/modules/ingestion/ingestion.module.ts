import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from '@logscope/config';
import { DatabaseModule } from '@logscope/database';
import { LogIngestionService } from './application/log-ingestion.service';
import { LogEventPublisherPort } from './application/ports/log-event-publisher.port';
import { IngestionController } from './ingestion.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { ApiKeyService } from './infrastructure/api-key.service';
import { KafkaLogProducerAdapter } from './infrastructure/kafka-log-producer.adapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env', '../../.env'],
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
    KafkaLogProducerAdapter,
    LogIngestionService,
    {
      provide: LogEventPublisherPort,
      useExisting: KafkaLogProducerAdapter,
    },
    RateLimitGuard,
  ],
})
export class IngestionModule {}
