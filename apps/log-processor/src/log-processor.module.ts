import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from '@logscope/config';
import { LogEventProcessorService } from './application/log-event-processor.service';
import { LogWriterPort } from './application/ports/log-writer.port';
import { RealtimePublisherPort } from './application/ports/realtime-publisher.port';
import { DeadLetterProducerService } from './services/dead-letter-producer.service';
import { ElasticsearchLogWriterService } from './services/elasticsearch-log-writer.service';
import { KafkaLogConsumerService } from './services/kafka-log-consumer.service';
import { RealtimeLogPublisherService } from './services/realtime-log-publisher.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env', '../../.env'],
      expandVariables: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
  ],
  providers: [
    ElasticsearchLogWriterService,
    LogEventProcessorService,
    DeadLetterProducerService,
    KafkaLogConsumerService,
    RealtimeLogPublisherService,
    {
      provide: LogWriterPort,
      useExisting: ElasticsearchLogWriterService,
    },
    {
      provide: RealtimePublisherPort,
      useExisting: RealtimeLogPublisherService,
    },
  ],
})
export class LogProcessorModule {}
