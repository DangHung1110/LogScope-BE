import { Injectable } from '@nestjs/common';
import { PrismaService } from '@logscope/database';
import { extractApiKeyLookupPrefix, isApiKeyFormatValid } from '@logscope/shared';
import * as bcrypt from 'bcryptjs';
import type { AuthenticatedProject } from '../types/authenticated-project';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(apiKey: string): Promise<AuthenticatedProject | null> {
    if (!isApiKeyFormatValid(apiKey)) {
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
        prefix: extractApiKeyLookupPrefix(apiKey),
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
}
