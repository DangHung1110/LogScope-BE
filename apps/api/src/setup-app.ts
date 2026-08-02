import { INestApplication } from '@nestjs/common';
import { configureHttpApplication } from '@logscope/http';

export function configureApp(app: INestApplication, corsOrigins: string[]): void {
  configureHttpApplication(app, {
    corsOrigins,
    enableValidation: true,
    globalPrefix: 'api',
  });
}
