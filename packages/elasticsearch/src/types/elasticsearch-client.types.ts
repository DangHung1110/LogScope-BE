import type { ClientOptions } from '@elastic/elasticsearch';

export interface CreateElasticsearchClientOptions {
  auth?: ClientOptions['auth'];
  maxRetries?: number;
  node: string;
  requestTimeoutMs?: number;
  tls?: ClientOptions['tls'];
}
