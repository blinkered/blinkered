import { serve } from '@hono/node-server'
import { createApp } from '../app.js'

/**
 * Serves the API. An entrypoint and nothing but.
 *
 * Everything worth testing is in `app.ts`, which is why this file is three lines. `src/bin` is
 * excluded from coverage wholesale: covering it would mean binding a socket to prove that
 * `serve` was called.
 */
const port = Number(process.env.PORT ?? 8080)
serve({ fetch: createApp().fetch, port })
