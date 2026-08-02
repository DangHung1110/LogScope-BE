import { validateEnvironment } from './index';

describe('validateEnvironment', () => {
  it('uses safe development defaults locally', () => {
    expect(validateEnvironment({}).NODE_ENV).toBe('development');
  });

  it('requires JWT secrets in production', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'JWT_ACCESS_SECRET is required in production',
    );
  });

  it('accepts explicit production secrets', () => {
    const config = validateEnvironment({
      JWT_ACCESS_SECRET: 'production-access-secret',
      JWT_REFRESH_SECRET: 'production-refresh-secret',
      NODE_ENV: 'production',
    });

    expect(config.JWT_ACCESS_SECRET).toBe('production-access-secret');
    expect(config.JWT_REFRESH_SECRET).toBe('production-refresh-secret');
  });
});
