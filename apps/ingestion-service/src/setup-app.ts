import { INestApplication } from '@nestjs/common';
import { configureHttpApplication } from '@logscope/http';

export function configureIngestionApp(app: INestApplication): void {
  configureHttpApplication(app, {
    enableValidation: true,
  });
}
