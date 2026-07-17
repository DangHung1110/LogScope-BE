import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthenticatedRequest } from '../types/auth.types';

interface GraphQLRequestContext {
  req: AuthenticatedRequest;
}

export function getRequestFromExecutionContext(context: ExecutionContext): AuthenticatedRequest {
  if (context.getType<string>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<GraphQLRequestContext>().req;
  }

  return context.switchToHttp().getRequest<AuthenticatedRequest>();
}
