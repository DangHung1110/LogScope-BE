export const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'creditCard',
]);

const REDACTED_VALUE = '[REDACTED]';
const NORMALIZED_SENSITIVE_KEYS = new Set([...SENSITIVE_KEYS].map((key) => normalizeKey(key)));

export function redactSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [
        key,
        isSensitiveKey(key) ? REDACTED_VALUE : redactSensitiveData(childValue),
      ]),
    );
  }

  return value;
}

function isSensitiveKey(key: string): boolean {
  return NORMALIZED_SENSITIVE_KEYS.has(normalizeKey(key));
}

function normalizeKey(key: string): string {
  return key.replaceAll(/[-_]/g, '').toLowerCase();
}
