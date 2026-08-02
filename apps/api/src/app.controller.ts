import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { AppInfo } from './types/app-info.type';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo(): AppInfo {
    return this.appService.getInfo();
  }
}
