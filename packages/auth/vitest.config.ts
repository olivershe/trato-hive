import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for @trato-hive/auth package
 *
 * Coverage Thresholds: 80% (lines, functions, branches, statements)
 *
 * Run tests:
 * - `pnpm test` - Run all tests
 * - `pnpm test:watch` - Watch mode
 * - `pnpm test:coverage` - Generate coverage report
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        // Exclude type definitions and exports
        'src/index.ts',
        'src/types.ts',
        'src/auth.config.ts', // Edge config (integration tested)
        '**/*.d.ts',
        // Exclude test files
        'tests/**',
        'vitest.config.ts',
        // Exclude build output
        'dist/**',
        '.turbo/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
