import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { capturingMailer, fakeStore, makeAdmin } from './fake.js'
import type { FakeUser } from './fake.js'

describe('the API', () => {
  it('answers /healthz without touching anything else', async () => {
    const response = await createApp().request('/healthz')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
  })

  it('answers /v1/healthz, which is the path a browser can actually reach', async () => {
    // A different fact from the one above: this one goes through the prefix the ingress routes
    // on, so it fails when the routing is wrong rather than when the process is dead.
    const response = await createApp().request('/v1/healthz')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
  })

  it('owns the /v1 prefix rather than expecting it to be stripped', async () => {
    // Traefik forwards the path as it stands, so a route registered at `/healthz` alone would
    // work in a test that asks for `/healthz` and 404 for every real request.
    const app = createApp()
    expect((await app.request('/v1/healthz')).status).toBe(200)
    expect((await app.request('/healthz')).status).toBe(200)
  })

  it('404s a path it does not have, rather than answering everything', async () => {
    // The same rule the static site follows: an unknown path is an error and should say so.
    const response = await createApp().request('/v1/nope')
    expect(response.status).toBe(404)
  })
})

describe('the auth routes, once the app is given what they need', () => {
  it('are absent when it is not, so probes work without a database', async () => {
    const app = createApp()
    expect((await app.request('/v1/healthz')).status).toBe(200)
    // 404 rather than a 500: a deployment with no mailer cannot sign anybody in, and saying so
    // is better than a process that refuses to start and takes the game down with it.
    expect((await app.request('/v1/auth/code', { method: 'POST' })).status).toBe(404)
  })

  it('are mounted under /v1/auth when it is', async () => {
    const app = createApp({ auth: { store: fakeStore(), mailer: capturingMailer() } })
    const response = await app.request('/v1/auth/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'nick@example.com' }),
    })
    expect(response.status).toBe(202)
  })

  it('mount moderation under /v1/admin, behind the session', async () => {
    const app = createApp({ auth: { store: fakeStore(), mailer: capturingMailer() } })
    // 401 rather than 404, which is the whole claim: the routes are there and the gate is in
    // front of them.
    expect((await app.request('/v1/admin/users')).status).toBe(401)
    expect((await app.request('/v1/admin/reports')).status).toBe(401)
  })

  it('dates a moderation action from the real clock when nothing injects one', async () => {
    /*
     * The deployed arrangement, which every other suite replaces with a fixed moment.
     *
     * Worth one test rather than none: `deps.now` is injected everywhere so that expiry can be
     * moved without waiting, and the consequence is that the clock a deployment actually uses is
     * the one code path no test takes. This takes it.
     */
    const store = fakeStore()
    const mailer = capturingMailer()
    const app = createApp({ auth: { store, mailer } })
    const headers = { 'content-type': 'application/json' }

    const signIn = async (email: string): Promise<string> => {
      await app.request('/v1/auth/code', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
      })
      const verified = await app.request('/v1/auth/code/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, code: mailer.sent.at(-1)?.code }),
      })
      return (verified.headers.get('set-cookie') ?? '').split(';')[0] as string
    }

    const theirs = await signIn('player@example.com')
    const cookie = await signIn('nick@example.com')
    const [them, me] = [...store.users.values()] as [FakeUser, FakeUser]
    makeAdmin(store, me.userId)

    const before = Date.now()
    const response = await app.request(`/v1/admin/users/${them.userId}/ban`, {
      method: 'POST',
      headers: { ...headers, cookie },
      body: '{}',
    })
    expect(response.status).toBe(200)
    // The ban is a moment, and it is this moment rather than `undefined` or the epoch.
    expect(store.users.get(them.userId)?.bannedAt?.getTime()).toBeGreaterThanOrEqual(before)
    // And the account it was aimed at is signed out, which is what a ban is.
    expect((await app.request('/v1/me', { headers: { cookie: theirs } })).status).toBe(401)
  })
})
