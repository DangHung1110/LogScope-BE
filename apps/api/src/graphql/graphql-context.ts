import type { AuthenticatedRequest } from '../modules/auth/types/auth.types';

interface GraphQLContextInput {
  connectionParams?: Record<string, unknown>;
  req?: AuthenticatedRequest;
}

export interface LogScopeGraphQLContext {
  req: AuthenticatedRequest;
}

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
