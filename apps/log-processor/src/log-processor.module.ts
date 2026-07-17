import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from '@logscope/config';
import { DeadLetterProducerService } from './services/dead-letter-producer.service';
import { ElasticsearchLogWriterService } from './services/elasticsearch-log-writer.service';
import { KafkaLogConsumerService } from './services/kafka-log-consumer.service';
import { LogEventProcessorService } from './services/log-event-processor.service';
import { RealtimeLogPublisherService } from './services/realtime-log-publisher.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
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
  ],
})
export class LogProcessorModule {}
