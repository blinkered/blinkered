import { serve } from '@hono/node-server'
import { createApp } from '../app.js'
import { consoleMailer } from '../auth/mail.js'
import { pgStore } from '../pgStore.js'
import { smtpMailer } from '../auth/smtp.js'
import { appleProvider } from '../auth/apple.js'
import { googleProvider } from '../auth/google.js'
import { oidcClient } from '../auth/oidc.js'
import type { OidcProvider } from '../auth/oidc.js'
import { appleConfig, databaseConfig, googleConfig, smtpConfig } from '../config.js'
import { connect } from '../db.js'

/**
 * Serves the API. An entrypoint and nothing but.
 *
 * Everything worth testing is in `app.ts` and the modules it composes, which is why this file
 * assembles rather than decides. `src/bin` is excluded from coverage wholesale: covering it would
 * mean binding a socket to prove that `serve` was called.
 *
 * Sign-in is mounted only when there is somewhere for mail to go. Without a mailer the game
 * still serves and the probes still pass, and `/v1/auth/*` is a 404 -- which is a clearer failure
 * than a route that accepts an address and drops the code on the floor.
 *
 * `BLINKERED_MAIL_CONSOLE` is the development loop's answer to that, and it has to be asked for
 * by name. `mail.ts` argues against defaulting to `consoleMailer` and is right: a production
 * deployment missing its provider would come up healthy, accept sign-ups, and write every login
 * code in the estate into a log aggregator. Set in compose.yaml, where the whole stack is
 * disposable, and nowhere else.
 */
const port = Number(process.env.PORT ?? 8080)
const smtp = smtpConfig(process.env)
const { db } = connect(databaseConfig(process.env))

const mailer =
  smtp !== null
    ? smtpMailer(smtp)
    : process.env.BLINKERED_MAIL_CONSOLE === 'true'
      ? consoleMailer()
      : null

const apple = appleConfig(process.env)
const google = googleConfig(process.env)

/*
 * The third-party providers this deployment can actually offer.
 *
 * Built from whatever credentials are present rather than from a list of what exists, so a
 * missing key is a provider that is not mounted rather than a process that will not start. A
 * laptop usually has neither and serves the game perfectly well.
 */
const providers: OidcProvider[] = [
  ...(apple === null ? [] : [appleProvider(apple)]),
  ...(google === null ? [] : [googleProvider(google)]),
]

const app = createApp(
  mailer === null
    ? {}
    : {
        auth: {
          store: pgStore(db),
          mailer,
          oidc: providers.map((provider) => ({ provider, client: oidcClient(provider, fetch) })),
        },
      },
)
for (const [name, config] of [
  ['BLINKERED_APPLE_PRIVATE_KEY', apple],
  ['BLINKERED_GOOGLE_CLIENT_SECRET', google],
] as const) {
  if (config === null) console.warn(`no ${name}: that provider is not mounted`)
}
if (mailer === null) {
  console.warn('no BLINKERED_SMTP_HOST and no BLINKERED_MAIL_CONSOLE: sign-in is not mounted')
}

serve({ fetch: app.fetch, port })
