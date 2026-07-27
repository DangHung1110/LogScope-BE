import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { LogSearchResolver } from './log-search.resolver';
import { LogSearchService } from './log-search.service';
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
  ],
})
export class LogsModule {}
