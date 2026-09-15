import { beforeEach, describe, expect, it } from 'vitest'
import { authRoutes } from '../src/auth/routes.js'
import type { AuthDeps } from '../src/auth/routes.js'
import { googleProvider } from '../src/auth/google.js'
import { OidcError } from '../src/auth/oidc.js'
import type { OidcClient, OidcIdentity } from '../src/auth/oidc.js'
import { capturingMailer, fakeStore } from './fake.js'

/**
 * Google's two routes.
 *
 * Deliberately not a copy of `appleRoutes.test.ts`. The account handling, the linking rule and
 * every failure path are the same code and are covered there; what is asserted here is the part
 * that genuinely differs, which is the shape of the callback and the cookie that follows from it.
 */

const provider = googleProvider({
  clientId: '1234.apps.googleusercontent.com',
  clientSecret: 'a-real-secret',
  redirectUri: 'https://playblinkered.com/v1/auth/google/callback',
})

const SOMEBODY: OidcIdentity = {
  sub: '117234567890123456789',
  email: 'player@example.com',
  emailVerified: true,
  isPrivateRelay: false,
}

function scripted(answer: OidcIdentity | OidcError): OidcClient {
  return {
    exchange: () => (answer instanceof OidcError ? Promise.reject(answer) : Promise.resolve('t')),
    verify: () => (answer instanceof OidcError ? Promise.reject(answer) : Promise.resolve(answer)),
  }
}

function cookiesFrom(response: Response): Map<string, string> {
  const jar = new Map<string, string>()
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(';')
    const [name, ...rest] = String(pair).split('=')
    jar.set(String(name), rest.join('='))
  }
  return jar
}

describe('signing in with Google', () => {
  let store: ReturnType<typeof fakeStore>
  let app: ReturnType<typeof authRoutes>
  let client: OidcClient
  const clock = new Date('2026-09-15T12:00:00Z')

  const build = (): void => {
    const deps: AuthDeps = {
      store,
      mailer: capturingMailer(),
      now: () => clock,
      secureCookies: false,
      oidc: [{ provider, client }],
    }
    app = authRoutes(deps)
  }

  beforeEach(() => {
    store = fakeStore()
    client = scripted(SOMEBODY)
    build()
  })

  const start = async (): Promise<Map<string, string>> => cookiesFrom(await app.request('/google'))

  /** Google comes back as a GET with a query string, which is the whole difference. */
  const callback = async (
    query: Record<string, string>,
    jar: Map<string, string>,
  ): Promise<Response> =>
    app.request(`/google/callback?${new URLSearchParams(query).toString()}`, {
      headers: { cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') },
    })

  const round = async (overrides: Record<string, string> = {}): Promise<Response> => {
    const jar = await start()
    return callback(
      { state: String(jar.get('blinkered_google_state')), code: 'the-code', ...overrides },
      jar,
    )
  }

  it('redirects to Google with the client id and three scopes', async () => {
    const response = await app.request('/google')
    expect(response.status).toBe(302)
    const url = new URL(String(response.headers.get('location')))
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('client_id')).toBe('1234.apps.googleusercontent.com')
    expect(url.searchParams.get('scope')).toBe('openid email profile')
  })

  it('keeps its state cookie SameSite=Lax, because the callback is a navigation', async () => {
    /*
     * The counterpart to Apple's `SameSite=None`. Google's callback is an ordinary cross-site
     * redirect, and a Lax cookie *is* sent on a cross-site navigation, so the stricter setting
     * works here and should be used. Loosening it to match Apple would be a real weakening for
     * no reason at all.
     */
    const header = (await app.request('/google')).headers
      .getSetCookie()
      .find((line) => line.startsWith('blinkered_google_state='))
    expect(header).toContain('SameSite=Lax')
    expect(header).toContain('Secure')
    expect(header).toContain('HttpOnly')
    expect(header).toContain('Path=/v1/auth/google')
  })

  it('answers the callback as a GET and signs somebody in', async () => {
    const response = await round()
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/?signin=ok')
    expect(cookiesFrom(response).get('blinkered_session')).toBeTruthy()
    expect(store.identities[0]?.provider).toBe('google')
  })

  it('does not answer a form post, which is Apple’s shape rather than Google’s', async () => {
    const response = await app.request('/google/callback', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'state=x&code=y',
    })
    expect(response.status).toBe(404)
  })

  it('says cancelled when somebody declines at Google', async () => {
    // Google spells it `access_denied` where Apple says `user_cancelled_authorize`. Both are a
    // person changing their mind, and neither should look like a fault.
    const jar = await start()
    const response = await callback({ error: 'access_denied' }, jar)
    expect(response.headers.get('location')).toBe('/?signin=cancelled')
  })

  it('refuses a callback whose state does not match the cookie', async () => {
    expect((await round({ state: 'forged' })).headers.get('location')).toBe('/?signin=bad-state')
  })

  it('links to an account that already holds the verified address', async () => {
    await store.createUser({
      id: 'existing',
      username: 'existing',
      identity: {
        provider: 'email',
        providerAccountId: 'player@example.com',
        email: 'player@example.com',
        emailVerified: true,
      },
    })
    await round()
    expect(store.users.size).toBe(1)
    expect(store.identities.filter((i) => i.userId === 'existing')).toHaveLength(2)
  })

  it('leaves Apple a 501 when only Google is configured', async () => {
    expect((await app.request('/apple')).status).toBe(501)
  })
})
