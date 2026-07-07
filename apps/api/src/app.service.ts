import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@logscope/config';

export interface AppInfo {
  name: string;
  status: 'ok';
  version: string;
}

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {}

  getInfo(): AppInfo {
    return {
      name: this.configService.get('APP_NAME', { infer: true }),
      status: 'ok',
      version: this.configService.get('APP_VERSION', { infer: true }),
    };
  }
}
