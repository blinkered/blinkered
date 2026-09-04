import { Hono } from 'hono'
import { authRoutes } from './auth/routes.js'
import type { AuthDeps } from './auth/routes.js'

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
export function createApp(options: { auth?: AuthDeps } = {}): Hono {
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
  v1.get('/healthz', (context) => context.text('ok'))
  if (options.auth !== undefined) v1.route('/auth', authRoutes(options.auth))

  app.route('/v1', v1)

  return app
}
