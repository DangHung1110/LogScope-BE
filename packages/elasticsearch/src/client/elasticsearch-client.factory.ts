import { Client } from '@elastic/elasticsearch';
import type { CreateElasticsearchClientOptions } from '../types/elasticsearch-client.types';

export function createElasticsearchClient(options: CreateElasticsearchClientOptions): Client {
  return new Client({
    auth: options.auth,
    maxRetries: options.maxRetries ?? 3,
    node: options.node,
    requestTimeout: options.requestTimeoutMs ?? 30_000,
    tls: options.tls,
  });
}
