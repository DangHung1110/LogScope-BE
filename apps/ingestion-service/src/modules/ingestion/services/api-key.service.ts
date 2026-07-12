import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedProject } from '../types/authenticated-project';

const API_KEY_PREFIX = 'sp_live_';
const API_KEY_PREFIX_LENGTH = 12;

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(apiKey: string): Promise<AuthenticatedProject | null> {
    if (!this.isValidApiKeyShape(apiKey)) {
      return null;
    }

    const persistedApiKey = await this.prisma.apiKey.findUnique({
      include: {
        project: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
      where: {
        prefix: this.extractPrefix(apiKey),
      },
    });

    if (!persistedApiKey || persistedApiKey.revokedAt) {
      return null;
    }

    const isValid = await bcrypt.compare(apiKey, persistedApiKey.keyHash);
    if (!isValid) {
      return null;
    }

    await this.prisma.apiKey.update({
      data: {
        lastUsedAt: new Date(),
      },
      where: {
        id: persistedApiKey.id,
      },
    });

    return {
      apiKeyId: persistedApiKey.id,
      id: persistedApiKey.project.id,
      slug: persistedApiKey.project.slug,
    };
  }

  private extractPrefix(apiKey: string): string {
    return apiKey.slice(0, API_KEY_PREFIX_LENGTH);
  }

  private isValidApiKeyShape(apiKey: string): boolean {
    return apiKey.startsWith(API_KEY_PREFIX) && apiKey.length > API_KEY_PREFIX_LENGTH;
  }
}
