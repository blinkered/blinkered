import { Hono } from 'hono'
import { accountRoutes } from './account/routes.js'
import { adminRoutes } from './admin/routes.js'
import { authRoutes } from './auth/routes.js'
import type { AuthDeps } from './auth/routes.js'
import type { LimitOptions } from './rateLimit.js'
import type { Store } from './types.js'

/**
 * Everything the mounted half of the API needs.
 *
 * One object rather than one per feature: it is one database and one session, and splitting the
 * dependencies would only mean wiring the same store in twice. The *ports* are split -- see
 * `types.ts` -- which is what keeps the fakes in the test suite small.
 */
export interface ApiDeps extends AuthDeps {
  readonly store: Store
  /** Passed through to the public profile routes. See `rateLimit.ts`. */
  readonly publicLimit?: LimitOptions
}

/**
 * The API, as a value rather than as a running process.
 *
 * Built by a function and returned rather than created at module scope, so a test can have one
 * without a port, a socket, or a teardown. `bin/serve.ts` is the only thing that listens.
 *
 * Application routes live under `/v1`, and the prefix is **not** stripped on the way in. Traefik
 * routes the `/v1` prefix to this service and forwards the path as it stands, so the app has to
 * own it; the local nginx proxy is configured to behave the same way rather than helpfully
 * rewriting, because a development stack that differs from production in the routing is a
 * development stack that cannot show you a routing bug.
 *
 * `auth` is optional so that the health checks, and the tests that only care about them, need no
 * database and no mailer. A deployment without it serves the game and answers probes and cannot
 * sign anybody in, which is a better failure than a process that will not start.
 */
export function createApp(options: { auth?: ApiDeps } = {}): Hono {
  const app = new Hono()

  /*
   * Two health checks, and they answer different questions.
   *
   * `/healthz` is the kubelet's. It is reached on the pod directly, never through the ingress,
   * and it deliberately says nothing about the database: a liveness probe that fails when a
   * dependency is unreachable gets the pod restarted, which does not reach the dependency
   * either, so an outage downstream becomes a crash loop upstream.
   *
   * `/v1/healthz` is reached the way a browser reaches everything else, through the proxy that
   * owns the origin. It answering is proof of the whole path -- ingress rule, service, port --
   * which is a different fact from the process being alive, and the one that is usually wrong
   * after a deployment change.
   */
  app.get('/healthz', (context) => context.text('ok'))

  const v1 = new Hono()

  /*
   * The one cross-origin caller this API has, and it is not a website.
   *
   * There was no CORS here at all, on purpose and correctly: nginx serves the bundle and the API
   * on one origin, so every browser request is same-origin and the session is an ordinary cookie.
   * The native shell breaks that premise rather than bending it. It is served from
   * `capacitor://localhost`, so every call to `playblinkered.com` is cross-origin, and no amount
   * of CORS would make the cookie travel -- which is why the shell authenticates with a bearer
   * token instead.
   *
   * **`Allow-Credentials` is deliberately absent, and that is the security property.** Without it
   * a browser will not send cookies cross-origin no matter what a page asks for, so the cookie
   * session stays strictly same-origin and this header block cannot become a way to ride one. The
   * only credential it admits is an `Authorization` header, which a client has to hold
   * deliberately and cannot be made to send by a third-party page.
   *
   * The origin list is exact rather than a pattern. `capacitor://localhost` is the whole of it:
   * the scheme is Capacitor's own on iOS, and a wildcard here would admit every page on the web
   * to an API that answers 401 to them anyway but should not be asked.
   */
  const APP_ORIGINS = new Set(['capacitor://localhost'])
  v1.use('*', async (context, next) => {
    const origin = context.req.header('origin')
    const allowed = origin !== undefined && APP_ORIGINS.has(origin)
    if (allowed) {
      context.header('Access-Control-Allow-Origin', origin)
      // So a proxy or a CDN cannot serve one origin's answer to another.
      context.header('Vary', 'Origin')
    }
    /*
     * Preflight, answered here rather than by a route.
     *
     * A browser sends `OPTIONS` before any request carrying an `Authorization` header, and it
     * never reaches a handler: there is no route for it, so without this it is a 404 and the real
     * request is never sent. The symptom is every authenticated call failing in the app while
     * the same call works from a terminal.
     */
    if (context.req.method === 'OPTIONS') {
      if (!allowed) return context.body(null, 403)
      context.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
      context.header('Access-Control-Allow-Headers', 'authorization, content-type')
      // A day, so a phone on a flaky connection is not re-asking this before every call.
      context.header('Access-Control-Max-Age', '86400')
      return context.body(null, 204)
    }
    await next()
  })

  v1.get('/healthz', (context) => context.text('ok'))
  const auth = options.auth
  if (auth !== undefined) {
    v1.route('/auth', authRoutes(auth))
    /*
     * The account itself: `/me`, `/me/games`, `/usernames/:name`, `/games/import`.
     *
     * Mounted flat rather than under a prefix of their own, because these are the nouns of the
     * API rather than a subsystem of it, and `/v1/account/me` would say the same word twice.
     */
    v1.route('/', accountRoutes(auth))
    /*
     * Moderation, under a prefix of its own, which is the opposite call from the one above.
     *
     * `/me` and `/games` are the nouns of the API and get no prefix. This is a subsystem: every
     * route in it exists for one audience, they are all behind one gate, and the prefix is what
     * makes that visible in an access log. It also means the gate can be middleware over a
     * subtree rather than a check somebody has to remember per handler.
     */
    v1.route('/admin', adminRoutes(auth))
  }

  app.route('/v1', v1)

  return app
}
