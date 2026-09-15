import type { Context, MiddlewareHandler } from 'hono'

/**
 * A fixed-window rate limit, for the two routes that enumerate.
 *
 * `GET /v1/users/:username` and its games listing are public by design, and public plus
 * addressable-by-name means walking the namespace is a request away. Nothing behind them is
 * secret -- a profile is meant to be read -- so this is about the cost of scraping rather than
 * about confidentiality: a limit turns "download every account in an afternoon" into something
 * that takes long enough to be visible and annoying.
 *
 * **It is only mounted where a client can actually be identified.** Rate limiting without a
 * believable client key is theatre: the choices are attributing every request to one shared
 * bucket, where a single caller exhausts everybody's quota, or trusting a header any client can
 * forge, where the limit is bypassed by setting it. Neither is better than not pretending. So
 * `trustProxy` is a deliberate deployment statement -- "something in front of this rewrites
 * `X-Forwarded-For`" -- and where it is false there is no limiter at all. See values-dev.yaml,
 * whose comment already says why this host cannot believe a client IP: Caddy declares trusted
 * proxies only for the Cloudflare-proxied production block.
 *
 * **The window is per pod, deliberately.** Production runs two replicas, so the effective limit
 * is up to twice what is configured. A shared counter would mean a write to Postgres on every
 * public profile view, which is a worse trade for a limit whose job is to make bulk collection
 * slow rather than to be exact. If it ever needs to be exact, that is a different mechanism and
 * should be chosen on purpose.
 */

/** Hono's context, narrowed to what a client key needs. */
type Keyable = Pick<Context, 'req'>

/**
 * Who is asking, as far as the deployment can honestly tell.
 *
 * `CF-Connecting-IP` first, because production is behind Cloudflare and that header is the one
 * Cloudflare guarantees it sets and overwrites. `X-Forwarded-For` second, leftmost entry, which
 * is the original client where every hop is trusted. Both are believable only because
 * `trustProxy` says something in front is rewriting them.
 */
export function clientKey(context: Keyable): string {
  const cloudflare = context.req.header('cf-connecting-ip')
  if (cloudflare !== undefined && cloudflare !== '') return cloudflare
  const forwarded = context.req.header('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  // No usable key is not "allow": a request that arrives with neither header on a deployment
  // that said it is behind a proxy is unattributable, and unattributable requests share one
  // bucket rather than escaping the limit entirely.
  return first === undefined || first === '' ? 'unattributed' : first
}

export interface LimitOptions {
  /** Requests allowed per window, per pod, per client. */
  readonly limit: number
  readonly windowMs: number
  /** Injected so a test can move it rather than wait. */
  readonly now?: () => number
}

interface Window {
  count: number
  resetAt: number
}

/**
 * The limiter, as Hono middleware.
 *
 * Fixed window rather than a token bucket or a sliding log: the burst at a window boundary is up
 * to twice the limit, which for this purpose is irrelevant, and in exchange the state is one
 * integer and one timestamp per client rather than a list of request times per client. For a
 * public endpoint, the memory a limiter costs is itself part of the attack surface.
 */
export function rateLimit(options: LimitOptions): MiddlewareHandler {
  const clock = options.now ?? ((): number => Date.now())
  const windows = new Map<string, Window>()

  /*
   * Bounded memory, swept on the cheapest schedule there is: whenever the map has grown past
   * what a real client population looks like, drop everything already expired. Without this a
   * caller cycling forged keys turns the limiter into a memory leak, which is a worse outcome
   * than the scraping it exists to slow down.
   */
  const sweep = (at: number): void => {
    if (windows.size < 10_000) return
    for (const [key, window] of windows) if (window.resetAt <= at) windows.delete(key)
  }

  return async (context, next) => {
    const at = clock()
    sweep(at)

    const key = clientKey(context)
    const window = windows.get(key)
    if (window === undefined || window.resetAt <= at) {
      windows.set(key, { count: 1, resetAt: at + options.windowMs })
      await next()
      return
    }

    window.count += 1
    if (window.count > options.limit) {
      const seconds = Math.ceil((window.resetAt - at) / 1000)
      // `Retry-After` because a well-behaved client deserves to be told when to come back, and
      // because a scraper that ignores it is then unambiguously a scraper.
      context.header('retry-after', String(seconds))
      return context.json({ error: 'slow-down' }, 429)
    }
    await next()
  }
}
