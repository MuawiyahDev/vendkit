import { validateEnvironment } from './env.validation.js';

const validConfig = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a-secret-that-is-longer-than-thirty-two-characters',
  API_KEY: 'a-valid-api-key-value',
};

describe('validateEnvironment', () => {
  it('accepts a complete configuration', () => {
    expect(validateEnvironment({ ...validConfig })).toEqual(validConfig);
  });

  it('reports every missing required value at once', () => {
    expect(() => validateEnvironment({})).toThrow(
      /DATABASE_URL is required[\s\S]*JWT_SECRET is required[\s\S]*API_KEY is required/,
    );
  });

  it('rejects a short JWT secret', () => {
    expect(() =>
      validateEnvironment({ ...validConfig, JWT_SECRET: 'too-short' }),
    ).toThrow('JWT_SECRET must be at least 32 characters long.');
  });

  it('rejects a non-PostgreSQL database URL', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        DATABASE_URL: 'mysql://localhost/db',
      }),
    ).toThrow('DATABASE_URL must be a PostgreSQL connection string.');
  });

  it('requires CORS origins in production', () => {
    expect(() =>
      validateEnvironment({ ...validConfig, NODE_ENV: 'production' }),
    ).toThrow('CORS_ORIGINS is required in production');
  });

  it('accepts production configuration with valid origins', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://orders.example.com',
      }),
    ).not.toThrow();
  });

  it('rejects malformed numeric and boolean values', () => {
    expect(() =>
      validateEnvironment({ ...validConfig, PORT: 'not-a-number' }),
    ).toThrow('PORT must be an integer');

    expect(() =>
      validateEnvironment({ ...validConfig, ALLOW_PUBLIC_REGISTRATION: 'maybe' }),
    ).toThrow('ALLOW_PUBLIC_REGISTRATION must be true or false.');
  });
});
