import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * The suite that needs a real Postgres, kept apart from `pnpm test` rather than skipped inside it.
 *
 * The CI matrix runs ubuntu and macOS, and GitHub's macOS runners have no Docker, so a database
 * test in the main suite would pass locally and fail on the first push. That is the trap this
 * repo was caught by once already, with a test that read `/usr/share/dict/words`.
 *
 * Separate rather than conditionally skipped, because a skip is invisible: a suite that quietly
 * runs nothing looks exactly like a suite that passed.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@blinkered/engine': source('./packages/engine/src/index.ts'),
      '@blinkered/words': source('./packages/words/src/index.ts'),
      '@blinkered/i18n': source('./packages/i18n/src/index.ts'),
    },
  },
  test: {
    include: ['apps/server/test/**/*.integration.test.ts'],
    // One database, and the suites share it. Running them in parallel against one schema would
    // make them fight over the same tables.
    fileParallelism: false,
    testTimeout: 30_000,
  },
})
