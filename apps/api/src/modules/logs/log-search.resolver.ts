import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../auth/types/auth.types';
import { LogFilterInput } from './dto/log-filter.input';
import { LogSearchService } from './log-search.service';
import { LogConnectionModel } from './models/log-connection.model';

@Resolver()
@UseGuards(JwtAuthGuard)
export class LogSearchResolver {
  constructor(private readonly logSearchService: LogSearchService) {}

  @Query(() => LogConnectionModel, { name: 'logs' })
  logs(
    @CurrentUser() user: PublicUser,
    @Args('filter') filter: LogFilterInput,
  ): Promise<LogConnectionModel> {
    return this.logSearchService.search(user.id, filter);
  }
}
