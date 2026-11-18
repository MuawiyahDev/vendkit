import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup-e2e.ts'],
    // E2E suites share one PostgreSQL database. Settings are global singleton
    // rows, so running files in parallel would let one suite change defaults
    // while another suite is asserting order behaviour.
    fileParallelism: false,
  },
});
