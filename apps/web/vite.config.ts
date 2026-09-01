import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const source = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

const DATA = source('../../packages/words/data')
const MANIFEST = 'manifest.json'

/**
 * Serves the shipped word lists straight out of `packages/words/data`.
 *
 * They live there rather than in `public/` because that directory is the license audit: each
 * language sits next to its own LICENSE and PROVENANCE.md, and a copy in the app would drift
 * from them. In dev they are served from disk; in a build they are emitted as assets. Either
 * way the app fetches `/words/manifest.json` and discovers what is actually there, so a build
 * offers exactly the languages whose list exists rather than every language with an alphabet.
 */
function wordLists(): Plugin {
  const listPath = (tag: string): string => join(DATA, tag, 'words.txt')

  const languages = (): string[] => {
    const manifest = join(DATA, MANIFEST)
    if (!existsSync(manifest)) return []
    const parsed = JSON.parse(readFileSync(manifest, 'utf8')) as { languages?: { tag: string }[] }
    return (parsed.languages ?? [])
      .map((entry) => entry.tag)
      .filter((tag) => existsSync(listPath(tag)))
  }

  return {
    name: 'blinkered-word-lists',

    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? '').split('?')[0] ?? ''
        const file =
          path === `/words/${MANIFEST}`
            ? join(DATA, MANIFEST)
            : /^\/words\/[\w-]+\.txt$/.test(path)
              ? listPath(path.slice('/words/'.length, -'.txt'.length))
              : null
        if (file === null || !existsSync(file)) {
          next()
          return
        }
        response.setHeader(
          'content-type',
          file.endsWith('.json') ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
        )
        response.end(readFileSync(file))
      })
    },

    generateBundle() {
      const manifest = join(DATA, MANIFEST)
      if (!existsSync(manifest)) {
        this.warn('no word lists found: run `pnpm dictionary build`')
        return
      }
      this.emitFile({
        type: 'asset',
        fileName: `words/${MANIFEST}`,
        source: readFileSync(manifest, 'utf8'),
      })
      for (const tag of languages()) {
        this.emitFile({
          type: 'asset',
          fileName: `words/${tag}.txt`,
          source: readFileSync(listPath(tag), 'utf8'),
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), wordLists()],
  // Resolve the workspace packages to their sources rather than their build output, so a
  // fresh clone runs with no build step and editing the engine hot-reloads the game.
  resolve: {
    alias: {
      '@blinkered/engine': source('../../packages/engine/src/index.ts'),
      '@blinkered/words': source('../../packages/words/src/index.ts'),
      '@blinkered/i18n': source('../../packages/i18n/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    /*
     * `/v1` goes to the API, so the dev server is one origin exactly as production is.
     *
     * Without this, working on anything that talks to the API means either giving up hot reload
     * and using `docker compose up`, or running the two on different ports and adding CORS to
     * make it work -- and CORS in development, absent in production, is a difference that hides
     * bugs in both directions. The session is a same-origin cookie; the dev server should be one
     * origin too.
     *
     * The API is not started by this. Run `pnpm --filter @blinkered/server dev` alongside. With
     * nothing listening, a request here fails rather than hanging, which is the honest outcome:
     * `/v1` is not something Vite can serve.
     */
    proxy: {
      '/v1': {
        target: process.env.BLINKERED_API ?? 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Two pages, because the rules open in their own tab. Sharing the build means they share
    // the message catalogue, so the rules are translated by the same sixteen locales the game
    // is rather than by a second copy of them that drifts.
    rollupOptions: {
      input: {
        main: source('./index.html'),
        howToPlay: source('./how-to-play.html'),
      },
    },
  },
})
