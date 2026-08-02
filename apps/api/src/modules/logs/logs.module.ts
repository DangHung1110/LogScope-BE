import { Module } from '@nestjs/common';
import { DatabaseModule } from '@logscope/database';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { LogSearchService } from './application/log-search.service';
import { LogReaderPort } from './application/ports/log-reader.port';
import { LogSearchResolver } from './log-search.resolver';
import { RealtimeLogResolver } from './realtime-log.resolver';
import { ElasticsearchLogReaderService } from './services/elasticsearch-log-reader.service';
import { RealtimeLogSubscriptionService } from './services/realtime-log-subscription.service';

@Module({
  imports: [AuthModule, DatabaseModule, ProjectsModule],
  providers: [
    ElasticsearchLogReaderService,
    LogSearchResolver,
    LogSearchService,
    RealtimeLogResolver,
    RealtimeLogSubscriptionService,
    {
      provide: LogReaderPort,
      useExisting: ElasticsearchLogReaderService,
    },
  ],
})
export class LogsModule {}
