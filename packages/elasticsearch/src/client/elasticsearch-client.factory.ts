import { Client, ClientOptions } from '@elastic/elasticsearch';

export interface CreateElasticsearchClientOptions {
  auth?: ClientOptions['auth'];
  maxRetries?: number;
  node: string;
  requestTimeoutMs?: number;
  tls?: ClientOptions['tls'];
}

export function createElasticsearchClient(options: CreateElasticsearchClientOptions): Client {
  return new Client({
    auth: options.auth,
    maxRetries: options.maxRetries ?? 3,
    node: options.node,
    requestTimeout: options.requestTimeoutMs ?? 30_000,
    tls: options.tls,
  });
}
