import { redactSensitiveData } from './redact-sensitive-data';

describe('redactSensitiveData', () => {
  it('redacts sensitive keys recursively and inside arrays', () => {
    expect(
      redactSensitiveData({
        accessToken: 'secret-access-token',
        nested: {
          PASSWORD: 'secret-password',
          safe: 'visible',
        },
        requests: [
          {
            credit_card: '4111111111111111',
            orderId: 'ord_123',
          },
        ],
      }),
    ).toEqual({
      accessToken: '[REDACTED]',
      nested: {
        PASSWORD: '[REDACTED]',
        safe: 'visible',
      },
      requests: [
        {
          credit_card: '[REDACTED]',
          orderId: 'ord_123',
        },
      ],
    });
  });

  it('preserves primitive values', () => {
    expect(redactSensitiveData('plain log message')).toBe('plain log message');
    expect(redactSensitiveData(null)).toBeNull();
  });
});
