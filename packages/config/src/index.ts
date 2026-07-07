export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  API_PORT: number;
  APP_NAME: string;
  APP_VERSION: string;
  CORS_ORIGINS: string;
  INGESTION_PORT: number;
  LOG_PROCESSOR_CONCURRENCY: number;
  NODE_ENV: NodeEnvironment;
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
    INGESTION_PORT: readPort(config.INGESTION_PORT, 'INGESTION_PORT', 3001),
    LOG_PROCESSOR_CONCURRENCY: readPositiveInteger(
      config.LOG_PROCESSOR_CONCURRENCY,
      'LOG_PROCESSOR_CONCURRENCY',
      4,
    ),
    NODE_ENV: nodeEnvironment as NodeEnvironment,
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
