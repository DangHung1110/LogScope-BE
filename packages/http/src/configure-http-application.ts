import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { requestIdMiddleware } from './middleware/request-id.middleware';

export interface ConfigureHttpApplicationOptions {
  corsOrigins?: readonly string[];
  enableValidation?: boolean;
  globalPrefix?: string;
}

export function configureHttpApplication(
  app: INestApplication,
  options: ConfigureHttpApplicationOptions = {},
): void {
  app.use(helmet());
  app.use(requestIdMiddleware);

  if (options.corsOrigins) {
    app.enableCors({
      credentials: true,
      origin: [...options.corsOrigins],
    });
  }

  if (options.globalPrefix) {
    app.setGlobalPrefix(options.globalPrefix);
  }

  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });

  if (options.enableValidation) {
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
  }

  app.enableShutdownHooks();
}
