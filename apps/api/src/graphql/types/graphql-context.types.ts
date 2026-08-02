import type { AuthenticatedRequest } from '../../modules/auth/types/auth.types';

export interface GraphQLContextInput {
  connectionParams?: Record<string, unknown>;
  req?: AuthenticatedRequest;
}

export interface LogScopeGraphQLContext {
  req: AuthenticatedRequest;
}
