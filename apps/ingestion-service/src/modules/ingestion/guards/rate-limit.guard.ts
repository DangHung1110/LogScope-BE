import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { createHash } from 'node:crypto';
import type { RateLimitBucket } from '../types/rate-limit.types';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const PRUNE_INTERVAL = 500;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private requestCount = 0;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const identity = this.getIdentity(request);
    const now = Date.now();
    this.requestCount += 1;

    if (this.requestCount % PRUNE_INTERVAL === 0) {
      this.pruneExpiredBuckets(now);
    }

    const bucket = this.buckets.get(identity);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(identity, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
      return true;
    }

    bucket.count += 1;

    if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private getIdentity(request: Request): string {
    const apiKey = request.headers['x-api-key'];

    if (typeof apiKey === 'string' && apiKey.length > 0) {
      return `key:${createHash('sha256').update(apiKey).digest('hex')}`;
    }

    return `ip:${request.ip ?? 'unknown'}`;
  }

  private pruneExpiredBuckets(now: number): void {
    for (const [identity, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(identity);
      }
    }
  }
}
