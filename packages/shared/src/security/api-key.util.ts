export const API_KEY_PREFIX = 'sp_live_';
export const API_KEY_LOOKUP_PREFIX_LENGTH = 12;

export function extractApiKeyLookupPrefix(apiKey: string): string {
  return apiKey.slice(0, API_KEY_LOOKUP_PREFIX_LENGTH);
}

export function isApiKeyFormatValid(apiKey: string): boolean {
  return apiKey.startsWith(API_KEY_PREFIX) && apiKey.length > API_KEY_LOOKUP_PREFIX_LENGTH;
}
