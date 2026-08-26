import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  // Tests resolve workspace packages to their sources, so a cross-package test still
  // instruments the code it exercises and no build is needed to run the suite.
  resolve: {
    alias: {
      '@flippy/engine': source('./packages/engine/src/index.ts'),
      '@flippy/words': source('./packages/words/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/engine/src/**/*.ts', 'packages/words/src/**/*.ts'],
      exclude: ['**/index.ts', '**/types.ts'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
      reporter: ['text', 'lcov'],
    },
  },
})
