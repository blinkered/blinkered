import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const source = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  // Resolve the workspace packages to their sources rather than their build output, so a
  // fresh clone runs with no build step and editing the engine hot-reloads the game.
  resolve: {
    alias: {
      '@blinkered/engine': source('../../packages/engine/src/index.ts'),
      '@blinkered/words': source('../../packages/words/src/index.ts'),
    },
  },
  server: { port: 5173 },
  build: { target: 'es2022', sourcemap: true },
})
