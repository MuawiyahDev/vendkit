/**
 * Validates configuration at startup instead of failing later with an opaque
 * runtime error. The message lists every problem at once so a first install
 * can be fixed in one pass.
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];
  const nodeEnv = readString(config, 'NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';

  const databaseUrl = readString(config, 'DATABASE_URL');
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required.');
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string.');
  }

  const jwtSecret = readString(config, 'JWT_SECRET');
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required.');
  } else if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long.');
  }

  const apiKey = readString(config, 'API_KEY');
  if (!apiKey) {
    errors.push(
      'API_KEY is required. It authenticates the web app to the API.',
    );
  } else if (apiKey.length < 16) {
    errors.push('API_KEY must be at least 16 characters long.');
  }

  validateInteger(config, 'PORT', errors, { min: 1, max: 65535 });
  validateInteger(config, 'IMAGE_MAX_FILE_SIZE', errors, { min: 1 });
  validateInteger(config, 'BACKUP_MAX_FILE_SIZE', errors, { min: 1 });
  validateInteger(config, 'BACKUP_MAX_EXTRACTED_SIZE', errors, { min: 1 });
  validateInteger(config, 'BACKUP_MAX_RECORDS', errors, { min: 1 });
  validateInteger(config, 'BACKUP_RESTORE_TRANSACTION_TIMEOUT_MS', errors, {
    min: 1_000,
  });
  validateBoolean(config, 'BACKUP_SAFETY_SNAPSHOT', errors);
  validateBoolean(config, 'ALLOW_PUBLIC_REGISTRATION', errors);

  const corsOrigins = readString(config, 'CORS_ORIGINS');
  if (isProduction) {
    if (!corsOrigins) {
      errors.push(
        'CORS_ORIGINS is required in production (the public web app URL).',
      );
    } else if (corsOrigins.split(',').some((origin) => !isValidOrigin(origin))) {
      errors.push(
        'CORS_ORIGINS must be a comma-separated list of http(s) origins.',
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${errors.join('\n- ')}`,
    );
  }

  return config;
}

function readString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const value = config[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function validateInteger(
  config: Record<string, unknown>,
  key: string,
  errors: string[],
  bounds: { min: number; max?: number },
): void {
  const raw = readString(config, key);
  if (raw === null) {
    return;
  }

  const value = Number(raw);
  if (
    !Number.isInteger(value) ||
    value < bounds.min ||
    (bounds.max !== undefined && value > bounds.max)
  ) {
    const range =
      bounds.max === undefined
        ? `at least ${bounds.min}`
        : `between ${bounds.min} and ${bounds.max}`;
    errors.push(`${key} must be an integer ${range}.`);
  }
}

function validateBoolean(
  config: Record<string, unknown>,
  key: string,
  errors: string[],
): void {
  const raw = readString(config, key)?.toLowerCase();
  if (raw === null || raw === undefined) {
    return;
  }

  if (!['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(raw)) {
    errors.push(`${key} must be true or false.`);
  }
}

function isValidOrigin(origin: string): boolean {
  try {
    const url = new URL(origin.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
