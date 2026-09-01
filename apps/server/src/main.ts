import { serve } from '@hono/node-server'
import { createApp } from './app.js'

/**
 * The entrypoint, and nothing but. Everything worth testing is in `app.ts`, which is why this
 * file is three lines and is excluded from coverage rather than being tested by binding a port.
 */
const port = Number(process.env.PORT ?? 8080)
serve({ fetch: createApp().fetch, port })
