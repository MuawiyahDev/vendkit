export const BCRYPT_ROUNDS = 12;

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Rate limit windows are intentionally generous for a single business. */
export const AUTH_RATE_LIMITS = {
  login: { limit: 10, windowMs: 5 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  refresh: { limit: 60, windowMs: 15 * 60 * 1000 },
} as const;
