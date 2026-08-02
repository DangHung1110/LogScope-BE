import type { AuthenticatedRequest } from '../modules/auth/types/auth.types';
import type { GraphQLContextInput, LogScopeGraphQLContext } from './types/graphql-context.types';

export function createGraphQLContext(input: GraphQLContextInput): LogScopeGraphQLContext {
  if (input.req) {
    return { req: input.req };
  }

  const authorization = readAuthorization(input.connectionParams);
  const req = {
    headers: authorization ? { authorization } : {},
  } as AuthenticatedRequest;

  return { req };
}

function readAuthorization(connectionParams?: Record<string, unknown>): string | undefined {
  const value = connectionParams?.authorization ?? connectionParams?.Authorization;
  return typeof value === 'string' ? value : undefined;
}
