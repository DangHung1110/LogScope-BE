import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiKey, ProjectRole } from '@prisma/client';
import { PrismaService } from '@logscope/database';
import { API_KEY_PREFIX, extractApiKeyLookupPrefix } from '@logscope/shared';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyCreateResponse, ApiKeyResponse } from './types/api-key.types';

const API_KEY_RANDOM_BYTES = 32;
const API_KEY_HASH_SALT_ROUNDS = 12;
const API_KEY_MANAGEMENT_ROLES: ProjectRole[] = [ProjectRole.OWNER, ProjectRole.ADMIN];

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async createApiKey(
    userId: string,
    projectId: string,
    dto: CreateApiKeyDto,
  ): Promise<ApiKeyCreateResponse> {
    await this.requireProjectRole(userId, projectId, API_KEY_MANAGEMENT_ROLES);

    const key = await this.generateUniqueApiKey();
    const prefix = extractApiKeyLookupPrefix(key);
    const keyHash = await bcrypt.hash(key, API_KEY_HASH_SALT_ROUNDS);
    const apiKey = await this.prisma.apiKey.create({
      data: { keyHash, name: dto.name, prefix, projectId },
    });

    return { apiKey: this.toApiKeyResponse(apiKey), key };
  }

  async listApiKeys(userId: string, projectId: string): Promise<ApiKeyResponse[]> {
    await this.requireProjectAccess(userId, projectId);
    const apiKeys = await this.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      where: { projectId },
    });
    return apiKeys.map((apiKey) => this.toApiKeyResponse(apiKey));
  }

  async revokeApiKey(userId: string, projectId: string, keyId: string): Promise<void> {
    await this.requireProjectRole(userId, projectId, API_KEY_MANAGEMENT_ROLES);
    const apiKey = await this.prisma.apiKey.findFirst({ where: { id: keyId, projectId } });

    if (!apiKey) throw new NotFoundException('API key not found');
    if (apiKey.revokedAt) return;

    await this.prisma.apiKey.update({
      data: { revokedAt: new Date() },
      where: { id: keyId },
    });
  }

  private async requireProjectAccess(userId: string, projectId: string): Promise<void> {
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { projectId, userId } },
    });
    if (!member) throw new NotFoundException('Project not found');
  }

  private async requireProjectRole(
    userId: string,
    projectId: string,
    allowedRoles: ProjectRole[],
  ): Promise<void> {
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { projectId, userId } },
    });
    if (!member) throw new NotFoundException('Project not found');
    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient project permission');
    }
  }

  private async generateUniqueApiKey(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const key = this.generateApiKey();
      const existingApiKey = await this.prisma.apiKey.findUnique({
        where: { prefix: extractApiKeyLookupPrefix(key) },
      });
      if (!existingApiKey) return key;
    }
    throw new ServiceUnavailableException('Unable to generate a unique API key');
  }

  private generateApiKey(): string {
    return `${API_KEY_PREFIX}${randomBytes(API_KEY_RANDOM_BYTES).toString('base64url')}`;
  }

  private toApiKeyResponse(apiKey: ApiKey): ApiKeyResponse {
    return {
      createdAt: apiKey.createdAt,
      id: apiKey.id,
      lastUsedAt: apiKey.lastUsedAt,
      name: apiKey.name,
      prefix: apiKey.prefix,
      projectId: apiKey.projectId,
      revokedAt: apiKey.revokedAt,
    };
  }
}
