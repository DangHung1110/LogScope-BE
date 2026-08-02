import { NotFoundException } from '@nestjs/common';
import type { PublicUser } from '../auth/types/auth.types';
import { ProjectsService } from '../projects/projects.service';
import { RealtimeLogResolver } from './realtime-log.resolver';
import { RealtimeLogSubscriptionService } from './services/realtime-log-subscription.service';
import type { LogReceivedPayload } from './types/realtime-log.types';

describe('RealtimeLogResolver', () => {
  const projectId = 'f9856a5a-45f1-4051-bb80-228de0bdbbc1';
  const user = { id: '1072b166-5433-4db1-920a-360e45d1c38c' } as PublicUser;
  const iterable = {} as AsyncIterable<LogReceivedPayload>;
  let assertProjectAccess: jest.Mock<Promise<void>, [string, string]>;
  let subscribe: jest.Mock<AsyncIterable<LogReceivedPayload>, [string]>;
  let resolver: RealtimeLogResolver;

  beforeEach(() => {
    assertProjectAccess = jest.fn<Promise<void>, [string, string]>(() => Promise.resolve());
    subscribe = jest.fn<AsyncIterable<LogReceivedPayload>, [string]>(() => iterable);
    resolver = new RealtimeLogResolver(
      { assertProjectAccess } as unknown as ProjectsService,
      { subscribe } as unknown as RealtimeLogSubscriptionService,
    );
  });

  it('checks project membership before opening the event stream', async () => {
    await expect(resolver.logReceived(user, projectId)).resolves.toBe(iterable);

    expect(assertProjectAccess).toHaveBeenCalledWith(user.id, projectId);
    expect(subscribe).toHaveBeenCalledWith(projectId);
    expect(assertProjectAccess.mock.invocationCallOrder[0]).toBeLessThan(
      subscribe.mock.invocationCallOrder[0]!,
    );
  });

  it('does not subscribe when the user is not a project member', async () => {
    assertProjectAccess.mockRejectedValue(new NotFoundException('Project not found'));

    await expect(resolver.logReceived(user, projectId)).rejects.toBeInstanceOf(NotFoundException);
    expect(subscribe).not.toHaveBeenCalled();
  });
});
