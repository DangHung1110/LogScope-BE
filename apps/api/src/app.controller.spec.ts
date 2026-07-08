import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              APP_NAME: 'LogScope',
              APP_VERSION: '0.1.0',
            }),
          ],
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getInfo', () => {
    it('returns application metadata', () => {
      expect(appController.getInfo()).toEqual({
        name: 'LogScope',
        status: 'ok',
        version: '0.1.0',
      });
    });
  });
});
