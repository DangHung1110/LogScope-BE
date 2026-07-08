import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';

export function configureApp(app: INestApplication, corsOrigins: string[]): void {
  app.use(helmet());
  app.enableCors({
    credentials: true,
    origin: corsOrigins,
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableShutdownHooks();
}
