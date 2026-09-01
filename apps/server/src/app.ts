import { Hono } from 'hono'

/**
 * The API, as a value rather than as a running process.
 *
 * Built by a function and returned rather than created at module scope, so a test can have one
 * without a port, a socket, or a teardown. `main.ts` is the only thing that listens.
 *
 * There is one route. The rest of them arrive with the database, because every one of them either
 * reads or writes a row, and a route that answers from nothing would be a fixture pretending to
 * be an endpoint. See docs/ACCOUNTS.md for what is coming and in what order.
 */
export function createApp(): Hono {
  const app = new Hono()

  /*
   * Liveness, matching what the web pod already answers on.
   *
   * Deliberately says nothing about the database. A health check that fails when a dependency is
   * unreachable gets the pod killed and restarted, which does not reach the database either, so
   * an outage downstream turns into a crash loop upstream. Readiness is where that belongs, and
   * it can arrive with the thing it would be checking.
   */
  app.get('/healthz', (context) => context.text('ok'))

  return app
}
