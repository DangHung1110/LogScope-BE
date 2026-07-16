import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/auth.types';
import { getRequestFromExecutionContext } from './request-context';

describe('getRequestFromExecutionContext', () => {
  const request = {
    headers: {},
  } as AuthenticatedRequest;

  it('gets the HTTP request for REST controllers', () => {
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    expect(getRequestFromExecutionContext(context)).toBe(request);
  });

  it('gets the request from GraphQL context', () => {
    const context = {
      getArgs: () => [undefined, undefined, { req: request }, undefined],
      getClass: () => class TestResolver {},
      getHandler: () => () => undefined,
      getType: () => 'graphql',
    } as unknown as ExecutionContext;

    expect(getRequestFromExecutionContext(context)).toBe(request);
  });
});
