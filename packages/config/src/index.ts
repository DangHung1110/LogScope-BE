export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  API_PORT: number;
  APP_NAME: string;
  APP_VERSION: string;
  CORS_ORIGINS: string;
  ELASTICSEARCH_LOGS_INDEX: string;
  ELASTICSEARCH_NODE: string;
  INGESTION_PORT: number;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  KAFKA_BROKERS: string;
  KAFKA_CLIENT_ID: string;
  KAFKA_SEND_TIMEOUT_MS: number;
  LOG_PROCESSOR_CONCURRENCY: number;
  LOG_PROCESSOR_GROUP_ID: string;
  NODE_ENV: NodeEnvironment;
  REDIS_URL: string;
}

const supportedEnvironments: NodeEnvironment[] = ['development', 'test', 'production'];

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables & Record<string, unknown> {
  const nodeEnvironment = readString(config.NODE_ENV, 'NODE_ENV', 'development');

  if (!supportedEnvironments.includes(nodeEnvironment as NodeEnvironment)) {
    throw new Error(
      `NODE_ENV must be one of: ${supportedEnvironments.join(', ')}. Received: ${nodeEnvironment}`,
    );
  }

  return {
    ...config,
    API_PORT: readPort(config.API_PORT ?? config.PORT, 'API_PORT', 3000),
    APP_NAME: readString(config.APP_NAME, 'APP_NAME', 'LogScope'),
    APP_VERSION: readString(config.APP_VERSION, 'APP_VERSION', '0.1.0'),
    CORS_ORIGINS: readString(
      config.CORS_ORIGINS,
      'CORS_ORIGINS',
      'http://localhost:3000,http://localhost:5173',
    ),
    ELASTICSEARCH_LOGS_INDEX: readString(
      config.ELASTICSEARCH_LOGS_INDEX,
      'ELASTICSEARCH_LOGS_INDEX',
      'syspulse-logs',
    ),
    ELASTICSEARCH_NODE: readString(
      config.ELASTICSEARCH_NODE,
      'ELASTICSEARCH_NODE',
      'http://localhost:9200',
    ),
    INGESTION_PORT: readPort(config.INGESTION_PORT, 'INGESTION_PORT', 3001),
    JWT_ACCESS_EXPIRES_IN: readString(config.JWT_ACCESS_EXPIRES_IN, 'JWT_ACCESS_EXPIRES_IN', '15m'),
    JWT_ACCESS_SECRET: readString(
      config.JWT_ACCESS_SECRET,
      'JWT_ACCESS_SECRET',
      'dev-access-secret-change-me',
    ),
    JWT_REFRESH_EXPIRES_IN: readString(
      config.JWT_REFRESH_EXPIRES_IN,
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ),
    JWT_REFRESH_SECRET: readString(
      config.JWT_REFRESH_SECRET,
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret-change-me',
    ),
    KAFKA_BROKERS: readString(config.KAFKA_BROKERS, 'KAFKA_BROKERS', 'localhost:9092'),
    KAFKA_CLIENT_ID: readString(config.KAFKA_CLIENT_ID, 'KAFKA_CLIENT_ID', 'logscope'),
    KAFKA_SEND_TIMEOUT_MS: readPositiveInteger(
      config.KAFKA_SEND_TIMEOUT_MS,
      'KAFKA_SEND_TIMEOUT_MS',
      10_000,
    ),
    LOG_PROCESSOR_CONCURRENCY: readPositiveInteger(
      config.LOG_PROCESSOR_CONCURRENCY,
      'LOG_PROCESSOR_CONCURRENCY',
      4,
    ),
    LOG_PROCESSOR_GROUP_ID: readString(
      config.LOG_PROCESSOR_GROUP_ID,
      'LOG_PROCESSOR_GROUP_ID',
      'logscope-log-processor-v1',
    ),
    NODE_ENV: nodeEnvironment as NodeEnvironment,
    REDIS_URL: readString(config.REDIS_URL, 'REDIS_URL', 'redis://localhost:16379'),
  };
}

function readString(value: unknown, key: string, fallback: string): string {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`);
  }

  const normalizedValue = value.trim();
  if (normalizedValue.length === 0) {
    throw new Error(`${key} cannot be empty`);
  }

  return normalizedValue;
}

function readPort(value: unknown, key: string, fallback: number): number {
  const port = readPositiveInteger(value, key, fallback);

  if (port > 65_535) {
    throw new Error(`${key} must be less than or equal to 65535. Received: ${port}`);
  }

  return port;
}

function readPositiveInteger(value: unknown, key: string, fallback: number): number {
  if (value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${key} must be a number`);
  }

  const parsedValue = Number(value ?? fallback);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${key} must be a positive integer. Received: ${String(value)}`);
  }

  return parsedValue;
}
