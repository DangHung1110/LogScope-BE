export interface ApiKeyResponse {
  createdAt: Date;
  id: string;
  lastUsedAt: Date | null;
  name: string;
  prefix: string;
  projectId: string;
  revokedAt: Date | null;
}

export interface ApiKeyCreateResponse {
  apiKey: ApiKeyResponse;
  key: string;
}
