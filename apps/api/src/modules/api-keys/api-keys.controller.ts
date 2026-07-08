import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../auth/types/auth.types';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import type { ApiKeyCreateResponse, ApiKeyResponse } from './types/api-key.types';

@Controller('projects/:projectId/api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  createApiKey(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyCreateResponse> {
    return this.apiKeysService.createApiKey(user.id, projectId, dto);
  }

  @Get()
  listApiKeys(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
  ): Promise<ApiKeyResponse[]> {
    return this.apiKeysService.listApiKeys(user.id, projectId);
  }

  @Delete(':keyId')
  @HttpCode(204)
  async revokeApiKey(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
  ): Promise<void> {
    await this.apiKeysService.revokeApiKey(user.id, projectId, keyId);
  }
}
