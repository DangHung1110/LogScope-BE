import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, ID, Resolver, Subscription } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../auth/types/auth.types';
import { ProjectsService } from '../projects/projects.service';
import { LogEventModel } from './models/log-event.model';
import { RealtimeLogSubscriptionService } from './services/realtime-log-subscription.service';
import type { LogReceivedPayload } from './types/realtime-log.types';

@Resolver()
export class RealtimeLogResolver {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly realtimeLogs: RealtimeLogSubscriptionService,
  ) {}

  @Subscription(() => LogEventModel, { name: 'logReceived' })
  @UseGuards(JwtAuthGuard)
  async logReceived(
    @CurrentUser() user: PublicUser,
    @Args('projectId', { type: () => ID }, ParseUUIDPipe) projectId: string,
  ): Promise<AsyncIterable<LogReceivedPayload>> {
    await this.projectsService.assertProjectAccess(user.id, projectId);
    return this.realtimeLogs.subscribe(projectId);
  }
}
