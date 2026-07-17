import type { AuthenticatedRequest } from '../modules/auth/types/auth.types';
import { createGraphQLContext } from './graphql-context';

describe('createGraphQLContext', () => {
  it('preserves the HTTP request', () => {
    const req = { headers: {} } as AuthenticatedRequest;

    expect(createGraphQLContext({ req })).toEqual({ req });
  });

  it('maps WebSocket connection authorization into a request context', () => {
    const context = createGraphQLContext({
      connectionParams: {
        authorization: 'Bearer access-token',
      },
    });

    expect(context.req.headers.authorization).toBe('Bearer access-token');
  });

  it('does not accept non-string authorization values', () => {
    const context = createGraphQLContext({
      connectionParams: {
        authorization: ['Bearer invalid'],
      },
    });

    expect(context.req.headers.authorization).toBeUndefined();
  });
});
