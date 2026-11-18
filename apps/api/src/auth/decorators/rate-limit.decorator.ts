import {
  applyDecorators,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

/**
 * Limits how often an endpoint can be called from the same origin. Applied to
 * password and token endpoints where brute force is the main risk.
 */
export function RateLimit(config: RateLimitConfig) {
  return applyDecorators(
    SetMetadata(RATE_LIMIT_KEY, config),
    UseGuards(RateLimitGuard),
  );
}
