import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_KEY,
  type RateLimitConfig,
} from '../decorators/rate-limit.decorator.js';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitRequest {
  ip?: string;
  method: string;
  url?: string;
  body?: unknown;
}

const MAX_BUCKETS = 10_000;

/**
 * Small in-memory fixed-window limiter for authentication endpoints. A
 * self-hosted VendKit runs as a single API process, so a shared store would
 * add operational complexity for no benefit. The key includes the submitted
 * email or refresh token because the web app proxies requests, which would
 * otherwise make every caller share one source IP.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const key = buildBucketKey(request);
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.store(key, { count: 1, resetAt: now + config.windowMs }, now);
      return true;
    }

    if (bucket.count >= config.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000),
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many attempts. Try again in ${retryAfterSeconds} seconds.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }

  private store(
    key: string,
    bucket: RateLimitBucket,
    now: number,
  ): void {
    if (this.buckets.size >= MAX_BUCKETS) {
      for (const [bucketKey, entry] of this.buckets) {
        if (entry.resetAt <= now) {
          this.buckets.delete(bucketKey);
        }
      }

      if (this.buckets.size >= MAX_BUCKETS) {
        this.buckets.clear();
      }
    }

    this.buckets.set(key, bucket);
  }
}

function buildBucketKey(request: RateLimitRequest): string {
  const identifier = readIdentifier(request.body);
  return [
    request.ip ?? 'unknown',
    request.method,
    request.url ?? '',
    identifier,
  ].join('|');
}

function readIdentifier(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    return '';
  }

  const values = body as Record<string, unknown>;
  const candidate = values.email ?? values.refreshToken;

  return typeof candidate === 'string'
    ? candidate.trim().toLowerCase().slice(0, 254)
    : '';
}
