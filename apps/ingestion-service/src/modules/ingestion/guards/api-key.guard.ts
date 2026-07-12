import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeyService } from '../services/api-key.service';
import type { AuthenticatedRequest } from '../types/authenticated-project';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || Array.isArray(apiKey)) {
      throw new UnauthorizedException('Missing API key');
    }

    const project = await this.apiKeyService.validate(apiKey);

    if (!project) {
      throw new UnauthorizedException('Invalid API key');
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.project = project;

    return true;
  }
}
