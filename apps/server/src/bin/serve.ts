import { serve } from '@hono/node-server'
import { createApp } from '../app.js'
import { pgAuthStore } from '../auth/pgStore.js'
import { smtpMailer } from '../auth/smtp.js'
import { databaseConfig, smtpConfig } from '../config.js'
import { connect } from '../db.js'

/**
 * Serves the API. An entrypoint and nothing but.
 *
 * Everything worth testing is in `app.ts` and the modules it composes, which is why this file
 * assembles rather than decides. `src/bin` is excluded from coverage wholesale: covering it would
 * mean binding a socket to prove that `serve` was called.
 *
 * Sign-in is mounted only when there is somewhere for mail to go. Without `BLINKERED_SMTP_HOST`
 * the game still serves and the probes still pass, and `/v1/auth/*` is a 404 -- which is a
 * clearer failure than a route that accepts an address and drops the code on the floor.
 */
const port = Number(process.env.PORT ?? 8080)
const smtp = smtpConfig(process.env)
const { db } = connect(databaseConfig(process.env))

const app = createApp(
  smtp === null ? {} : { auth: { store: pgAuthStore(db), mailer: smtpMailer(smtp) } },
)
if (smtp === null) console.warn('no BLINKERED_SMTP_HOST: sign-in is not mounted')

serve({ fetch: app.fetch, port })
