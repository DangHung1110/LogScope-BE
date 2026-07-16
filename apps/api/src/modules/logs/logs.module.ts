import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { LogSearchResolver } from './log-search.resolver';
import { LogSearchService } from './log-search.service';
import { ElasticsearchLogReaderService } from './services/elasticsearch-log-reader.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  providers: [ElasticsearchLogReaderService, LogSearchResolver, LogSearchService],
})
export class LogsModule {}
