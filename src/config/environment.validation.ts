export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  APP_NAME: string;
  APP_VERSION: string;
  CORS_ORIGINS: string;
  NODE_ENV: NodeEnvironment;
  PORT: number;
}

const supportedEnvironments: NodeEnvironment[] = ['development', 'test', 'production'];

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables & Record<string, unknown> {
  const nodeEnvironment = readString(config.NODE_ENV, 'NODE_ENV', 'development');
  const port = readPort(config.PORT);

  if (!supportedEnvironments.includes(nodeEnvironment as NodeEnvironment)) {
    throw new Error(
      `NODE_ENV must be one of: ${supportedEnvironments.join(', ')}. Received: ${nodeEnvironment}`,
    );
  }

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `PORT must be an integer between 1 and 65535. Received: ${String(config.PORT)}`,
    );
  }

  return {
    ...config,
    APP_NAME: readString(config.APP_NAME, 'APP_NAME', 'LogScope'),
    APP_VERSION: readString(config.APP_VERSION, 'APP_VERSION', '0.1.0'),
    CORS_ORIGINS: readString(
      config.CORS_ORIGINS,
      'CORS_ORIGINS',
      'http://localhost:3000,http://localhost:5173',
    ),
    NODE_ENV: nodeEnvironment as NodeEnvironment,
    PORT: port,
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

function readPort(value: unknown): number {
  if (value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('PORT must be a number');
  }

  return Number(value ?? 3000);
}
