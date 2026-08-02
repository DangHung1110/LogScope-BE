import { API_KEY_PREFIX, extractApiKeyLookupPrefix, isApiKeyFormatValid } from './api-key.util';

describe('API key utilities', () => {
  const apiKey = `${API_KEY_PREFIX}abcdefghijklmnopqrstuvwxyz`;

  it('extracts the stable lookup prefix', () => {
    expect(extractApiKeyLookupPrefix(apiKey)).toBe(apiKey.slice(0, 12));
  });

  it('validates the public API key shape', () => {
    expect(isApiKeyFormatValid(apiKey)).toBe(true);
    expect(isApiKeyFormatValid('invalid')).toBe(false);
  });
});
