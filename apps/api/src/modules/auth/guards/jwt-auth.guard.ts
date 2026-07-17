import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EnvironmentVariables } from '@logscope/config';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedRequest, JwtTokenPayload } from '../types/auth.types';
import { getRequestFromExecutionContext } from '../utils/request-context';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getRequestFromExecutionContext(context);
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verifyAccessToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid bearer token');
    }

    request.user = {
      createdAt: user.createdAt,
      email: user.email,
      id: user.id,
      name: user.name,
      updatedAt: user.updatedAt,
    };

    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string | null {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private async verifyAccessToken(token: string): Promise<JwtTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(token, {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid bearer token');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid bearer token');
    }
  }
}
