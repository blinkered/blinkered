import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { clientKey, rateLimit } from '../src/rateLimit.js'

/** A tiny app that says yes, so what is asserted is the limiter rather than a route. */
function limited(options: { limit: number; windowMs: number; now: () => number }): Hono {
  const app = new Hono()
  app.use('/users/*', rateLimit(options))
  app.get('/users/:name', (context) => context.text('ok'))
  return app
}

const from = (ip: string): { headers: Record<string, string> } => ({
  headers: { 'x-forwarded-for': ip },
})

describe('who is asking', () => {
  const keyOf = (headers: Record<string, string>): string =>
    clientKey({ req: { header: (name: string) => headers[name] } } as never)

  it('prefers the header Cloudflare guarantees it overwrites', () => {
    expect(keyOf({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' })).toBe(
      '203.0.113.7',
    )
  })

  it('falls back to the leftmost forwarded address, which is the original client', () => {
    expect(keyOf({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1, 10.0.0.2' })).toBe('198.51.100.1')
  })

  it('puts the unattributable in one bucket rather than letting them past', () => {
    // Not "allow". A request with neither header, on a deployment that said it is behind a
    // proxy, is odd; letting it through unlimited would make the limit bypassable by stripping
    // a header.
    expect(keyOf({})).toBe('unattributed')
    expect(keyOf({ 'x-forwarded-for': '  ' })).toBe('unattributed')
  })
})

describe('without an injected clock', () => {
  it('uses the real one', async () => {
    // Every other test here pins time, which would leave the default unexercised: the limiter
    // that actually runs in production is the one nothing had covered.
    const app = new Hono()
    app.use('/users/*', rateLimit({ limit: 1, windowMs: 60_000 }))
    app.get('/users/:name', (context) => context.text('ok'))
    expect((await app.request('/users/trout', from('203.0.113.7'))).status).toBe(200)
    expect((await app.request('/users/trout', from('203.0.113.7'))).status).toBe(429)
  })
})

describe('the limit', () => {
  let at = 1_000_000

  const app = (limit = 3): Hono => {
    at = 1_000_000
    return limited({ limit, windowMs: 60_000, now: () => at })
  }

  it('allows up to the limit and refuses the next one', async () => {
    const one = app(3)
    for (let n = 0; n < 3; n += 1) {
      expect((await one.request('/users/trout', from('203.0.113.7'))).status).toBe(200)
    }
    const refused = await one.request('/users/trout', from('203.0.113.7'))
    expect(refused.status).toBe(429)
    expect(await refused.json()).toEqual({ error: 'slow-down' })
  })

  it('says when to come back, so a client that ignores it is unambiguously a scraper', async () => {
    const one = app(1)
    await one.request('/users/trout', from('203.0.113.7'))
    at += 20_000
    const refused = await one.request('/users/trout', from('203.0.113.7'))
    expect(refused.headers.get('retry-after')).toBe('40')
  })

  it('counts each client separately', async () => {
    const one = app(1)
    expect((await one.request('/users/trout', from('203.0.113.7'))).status).toBe(200)
    // A second caller is unaffected by the first having spent its allowance.
    expect((await one.request('/users/trout', from('198.51.100.1'))).status).toBe(200)
    expect((await one.request('/users/trout', from('203.0.113.7'))).status).toBe(429)
  })

  it('counts the route rather than the name, so one client cannot walk the namespace', async () => {
    const one = app(2)
    await one.request('/users/trout', from('203.0.113.7'))
    await one.request('/users/perch', from('203.0.113.7'))
    expect((await one.request('/users/pike', from('203.0.113.7'))).status).toBe(429)
  })

  it('forgives once the window has passed', async () => {
    const one = app(1)
    await one.request('/users/trout', from('203.0.113.7'))
    expect((await one.request('/users/trout', from('203.0.113.7'))).status).toBe(429)
    at += 60_001
    expect((await one.request('/users/trout', from('203.0.113.7'))).status).toBe(200)
  })

  it('does not grow without bound when somebody cycles forged keys', async () => {
    /*
     * The limiter's own memory is part of the attack surface: without a sweep, a caller sending
     * a different forged `X-Forwarded-For` every request turns it into a leak, which is a worse
     * outcome than the scraping it exists to slow down.
     */
    const one = limited({ limit: 1, windowMs: 1_000, now: () => at })
    for (let n = 0; n < 10_050; n += 1) {
      await one.request('/users/trout', from(`198.51.100.${String(n)}`))
    }
    at += 2_000
    // The sweep runs on the next request past the threshold and drops what has expired.
    await one.request('/users/trout', from('203.0.113.7'))
    await one.request('/users/trout', from('203.0.113.8'))
    expect((await one.request('/users/trout', from('203.0.113.8'))).status).toBe(429)
  })
})
