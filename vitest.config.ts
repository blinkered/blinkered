import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  // Tests resolve workspace packages to their sources, so a cross-package test still
  // instruments the code it exercises and no build is needed to run the suite.
  resolve: {
    alias: {
      '@blinkered/engine': source('./packages/engine/src/index.ts'),
      '@blinkered/words': source('./packages/words/src/index.ts'),
      '@blinkered/i18n': source('./packages/i18n/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/server/test/**/*.test.ts'],
    // The database suite is `pnpm test:integration`, and needs a Postgres. See
    // vitest.integration.config.ts for why it is a separate run rather than a conditional skip.
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'packages/engine/src/**/*.ts',
        'packages/words/src/**/*.ts',
        'packages/i18n/src/**/*.ts',
        'apps/server/src/**/*.ts',
      ],
      // Barrels and type-only modules hold no logic. The locale files hold no logic
      // either, and a coverage number for a translation would only measure which strings a
      // test happened to render; completeness is checked structurally instead.
      exclude: [
        '**/index.ts',
        '**/types.ts',
        'packages/i18n/src/locales/**',
        // Entrypoints: they read the environment, start something, and exit. Covering them would
        // mean binding a socket to prove `serve` was called. What they start is tested.
        'apps/server/src/bin/**',
        // Opening a pool and running migrations. Both are exercised by `pnpm test:integration`
        // against a real Postgres, which is the only place they mean anything: a mocked pool
        // would prove that the mock was called, not that the schema is right.
        'apps/server/src/db.ts',
        'apps/server/src/migrate.ts',
        // Table declarations. The uncovered parts are drizzle's index and `relations` callbacks,
        // which only run when SQL is built, so a percentage here measures which callback a test
        // happened to trigger rather than whether the schema is right. That is the same reason
        // the locale files are excluded above, and the answer is the same: check it structurally.
        // `test/schema.test.ts` pins the schema name and the columns, and the integration suite
        // checks the migration and the leaderboard index against a real Postgres.
        'apps/server/src/schema.ts',
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
      reporter: ['text', 'lcov'],
    },
  },
})
