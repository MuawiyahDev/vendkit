// Environment needed before AppModule is imported (ConfigModule validates at
// module definition time). E2E suites register a fresh user per run, which is
// blocked by default on an installation that already has an administrator.
process.env.ALLOW_PUBLIC_REGISTRATION = 'true';
process.env.JWT_SECRET =
  'e2e-test-secret-that-is-long-enough-for-validation';
process.env.API_KEY = 'e2e-test-api-key';
