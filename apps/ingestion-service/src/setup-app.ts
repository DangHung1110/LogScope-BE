import { INestApplication, VersioningType } from '@nestjs/common';
import helmet from 'helmet';

export function configureIngestionApp(app: INestApplication): void {
  app.use(helmet());
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });
  app.enableShutdownHooks();
}
