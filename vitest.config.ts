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
    include: ['packages/*/test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'packages/engine/src/**/*.ts',
        'packages/words/src/**/*.ts',
        'packages/i18n/src/**/*.ts',
      ],
      // Barrels and type-only modules hold no logic. The locale files hold no logic
      // either, and a coverage number for a translation would only measure which strings a
      // test happened to render; completeness is checked structurally instead.
      exclude: ['**/index.ts', '**/types.ts', 'packages/i18n/src/locales/**'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
      reporter: ['text', 'lcov'],
    },
  },
})
