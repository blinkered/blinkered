import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

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
    const app = createApp({
      auth: {
        store: {
          countCodesSince: () => Promise.resolve(0),
          insertCode: () => Promise.resolve(),
          latestCode: () => Promise.resolve(null),
          recordAttempt: () => Promise.resolve(),
          consumeCode: () => Promise.resolve(),
          userIdForEmail: () => Promise.resolve(null),
          createUser: ({ id }) => Promise.resolve(id),
          createSession: () => Promise.resolve(),
        },
        mailer: { send: () => Promise.resolve() },
      },
    })
    const response = await app.request('/v1/auth/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'nick@example.com' }),
    })
    expect(response.status).toBe(202)
  })
})
