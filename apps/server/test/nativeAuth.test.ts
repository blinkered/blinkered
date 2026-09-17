import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { appleNativeProvider, appleProvider } from '../src/auth/apple.js'
import type { AppleConfig } from '../src/auth/apple.js'
import { googleProvider } from '../src/auth/google.js'
import { OidcError } from '../src/auth/oidc.js'
import type { OidcClient, OidcIdentity } from '../src/auth/oidc.js'
import { authRoutes } from '../src/auth/routes.js'
import type { AuthDeps } from '../src/auth/routes.js'
import { hashSessionToken } from '../src/auth/secrets.js'
import { capturingMailer, fakeStore } from './fake.js'

/**
 * The three routes the native app signs in through, and the two doors it arrives by.
 *
 * The shell cannot use the web flow at all -- its origin is `capacitor://localhost`, app-bound
 * domains refuses the navigation, and Google refuses an embedded WebView -- so the handshake
 * happens outside the app and ends here. What is worth asserting is not that a happy path works
 * but that the secrets involved behave like secrets: issued by the server, good once, and worth
 * nothing after a minute.
 *
 * The identity checking itself is `oidc.ts` and is covered by `apple.test.ts`; the clients here
 * are scripted, which is the same approach `appleRoutes.test.ts` takes and for the same reason.
 */

const config: AppleConfig = {
  teamId: 'ZJ3A78KXA4',
  keyId: '85Z9WXC2Q9',
  servicesId: 'com.tightlinesoftware.blinkered.signin',
  redirectUri: 'https://playblinkered.com/v1/auth/apple/callback',
  privateKey: 'unused: the client is scripted',
  bundleId: 'com.tightlinesoftware.blinkered',
}

const SOMEBODY: OidcIdentity = {
  sub: '001234.abc.5678',
  email: 'player@example.com',
  emailVerified: true,
  isPrivateRelay: false,
}

/** SHA-256 hex, which is what the app computes with `crypto.subtle` and shows Apple. */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

describe('the audience of a native Apple token', () => {
  it('is the app, not the website', () => {
    /*
     * The one field that differs, and the only reason this function exists. A native credential
     * is minted for the App ID; accepting the Services ID here -- or accepting either on both
     * routes -- would mean a token issued to one client signs somebody in through the other.
     */
    expect(appleNativeProvider(config).clientId).toBe('com.tightlinesoftware.blinkered')
    expect(appleProvider(config).clientId).toBe('com.tightlinesoftware.blinkered.signin')
  })

  it('checks tokens against the same keys and issuer', () => {
    const native = appleNativeProvider(config)
    expect(native.keysUrl).toBe(appleProvider(config).keysUrl)
    expect(native.issuers).toEqual(['https://appleid.apple.com'])
  })
})

describe('signing in from the native app', () => {
  let store: ReturnType<typeof fakeStore>
  let app: ReturnType<typeof authRoutes>
  /** What the scripted Apple verifier will answer, and what it was asked. */
  let answer: OidcIdentity | OidcError | Error
  let asked: { token: string; nonce: string } | null
  let appleNative: OidcClient
  let clock = new Date('2026-09-17T12:00:00Z')

  const google = googleProvider({
    clientId: '1234.apps.googleusercontent.com',
    clientSecret: 'a-real-secret',
    redirectUri: 'https://playblinkered.com/v1/auth/google/callback',
  })

  const build = (): void => {
    appleNative = {
      exchange: () => Promise.reject(new Error('a native credential is never exchanged')),
      verify: (token, nonce) => {
        asked = { token, nonce }
        return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer)
      },
    }
    const deps: AuthDeps = {
      store,
      mailer: capturingMailer(),
      now: () => clock,
      secureCookies: false,
      oidc: [
        {
          provider: google,
          client: {
            exchange: () => Promise.resolve('an-id-token'),
            verify: () =>
              Promise.resolve({
                sub: '117234567890123456789',
                email: 'player@example.com',
                emailVerified: true,
                isPrivateRelay: false,
              }),
          },
        },
      ],
      appleNative,
    }
    app = authRoutes(deps)
  }

  beforeEach(() => {
    store = fakeStore()
    answer = SOMEBODY
    asked = null
    clock = new Date('2026-09-17T12:00:00Z')
    build()
  })

  const nonce = async (): Promise<string> => {
    const response = await app.request('/native/nonce', { method: 'POST' })
    expect(response.status).toBe(200)
    const body = (await response.json()) as { nonce: string }
    return body.nonce
  }

  const post = async (path: string, body: unknown): Promise<Response> =>
    app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  describe('the nonce', () => {
    it('is issued by the server, and a different one every time', async () => {
      const first = await nonce()
      const second = await nonce()
      expect(first).not.toBe(second)
      // Long enough to be unguessable: 32 bytes as base64url.
      expect(first.length).toBeGreaterThanOrEqual(43)
    })
  })

  describe('a native Apple credential', () => {
    it('signs somebody in and hands back a bearer token that works', async () => {
      const response = await post('/native/apple', {
        identityToken: 'a.signed.token',
        nonce: await nonce(),
      })
      expect(response.status).toBe(200)
      const body = (await response.json()) as { userId: string; token: string; expiresAt: string }
      expect(body.token).toBeTruthy()
      // A year, which is the bearer lifetime and not the thirty days a cookie gets.
      expect(new Date(body.expiresAt).getTime() - clock.getTime()).toBe(365 * 24 * 60 * 60 * 1000)
      expect(store.identities[0]?.provider).toBe('apple')

      /*
       * The token is worth a session, and the session is what the rest of the API reads. Checked
       * here rather than by calling `/me`, which belongs to the account routes: this suite mounts
       * the auth ones, and a 404 would have looked like a rejected token.
       */
      const session = store.sessions.get(hashSessionToken(body.token))
      expect(session?.kind).toBe('bearer')
      expect(session?.userId).toBe(body.userId)
    })

    it('expects the nonce Apple echoes to be a hash of the one it issued', async () => {
      const issued = await nonce()
      await post('/native/apple', { identityToken: 'a.signed.token', nonce: issued })
      /*
       * Not the nonce itself. The app hashes it before showing Apple, so the value inside the
       * signed token is a hash -- and the row that authorises it is keyed on a *different* hash
       * of the same secret, which is why seeing the token is not the same as holding the nonce.
       */
      expect(asked?.nonce).toBe(sha256(issued))
      expect(asked?.token).toBe('a.signed.token')
    })

    it('will not take the same nonce twice', async () => {
      const issued = await nonce()
      expect((await post('/native/apple', { identityToken: 't', nonce: issued })).status).toBe(200)
      const again = await post('/native/apple', { identityToken: 't', nonce: issued })
      expect(again.status).toBe(401)
      expect(await again.json()).toEqual({ error: 'expired' })
    })

    it('will not take a nonce nobody issued', async () => {
      const response = await post('/native/apple', { identityToken: 't', nonce: 'invented' })
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'expired' })
      // And nothing was checked: the token never reached the verifier.
      expect(asked).toBeNull()
    })

    it('will not take a nonce that has run out', async () => {
      const issued = await nonce()
      clock = new Date(clock.getTime() + 11 * 60 * 1000)
      expect((await post('/native/apple', { identityToken: 't', nonce: issued })).status).toBe(401)
    })

    it('spends the nonce even when the token turns out to be bad', async () => {
      // Otherwise a nonce survives a failed attempt, which is a nonce somebody can grind against.
      answer = new OidcError('bad-signature')
      const issued = await nonce()
      const first = await post('/native/apple', { identityToken: 'forged', nonce: issued })
      expect(first.status).toBe(401)
      expect(await first.json()).toEqual({ error: 'bad-signature' })
      answer = SOMEBODY
      expect((await post('/native/apple', { identityToken: 't', nonce: issued })).status).toBe(401)
    })

    it('gives up with a 503 when no username can be found', async () => {
      // Five tries at a generated name, all taken, which is a state of the world rather than a
      // bad request -- hence 503 and not 400. The web callback reports the same reason.
      store.createUser = () => Promise.resolve(null)
      const response = await post('/native/apple', { identityToken: 't', nonce: await nonce() })
      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: 'no-username' })
    })

    it('refuses a body with nothing in it', async () => {
      expect((await post('/native/apple', {})).status).toBe(400)
      expect((await post('/native/apple', { identityToken: 't' })).status).toBe(400)
      expect((await post('/native/apple', { nonce: 'n' })).status).toBe(400)
    })

    it('lets anything that is not the provider’s fault keep going up', async () => {
      // A dead network or a database down is not a bad token, and reporting it as one would put
      // an outage behind a message telling the player their sign-in failed.
      answer = new Error('the keys endpoint is down')
      const issued = await nonce()
      const response = await post('/native/apple', { identityToken: 't', nonce: issued })
      // A 500, because Hono turns an unhandled throw into one. The point is what it is *not*: a
      // 401 blaming the credential for the key server being unreachable.
      expect(response.status).toBe(500)
    })

    it('answers 501 where the deployment has no Apple key', async () => {
      // No `appleNative` at all, which is a laptop and any deployment without the .p8.
      const deps: AuthDeps = { store, mailer: capturingMailer(), now: () => clock }
      const without = authRoutes(deps)
      const response = await without.request('/native/apple', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identityToken: 't', nonce: 'n' }),
      })
      // 501 rather than 404: the route is real and only the provider is missing, which is the
      // same distinction the web stubs make.
      expect(response.status).toBe(501)
      expect(await response.json()).toEqual({ error: 'not-implemented' })
    })

    it('gives back the same account the second time, not a new one', async () => {
      /*
       * `accountFor` is shared with the web callback and its linking rules are argued in
       * `appleRoutes.test.ts`. What is asserted here is that this route is a caller of it at all:
       * a native route that created an account per sign-in would look like it worked.
       */
      const first = await post('/native/apple', { identityToken: 't', nonce: await nonce() })
      const mine = ((await first.json()) as { userId: string }).userId
      const second = await post('/native/apple', { identityToken: 't', nonce: await nonce() })
      expect(((await second.json()) as { userId: string }).userId).toBe(mine)
      expect(store.users.size).toBe(1)
    })
  })

  describe('a native Google handshake', () => {
    const cookiesFrom = (response: Response): Map<string, string> => {
      const jar = new Map<string, string>()
      for (const header of response.headers.getSetCookie()) {
        const [pair] = header.split(';')
        const [name, ...rest] = String(pair).split('=')
        jar.set(String(name), rest.join('='))
      }
      return jar
    }

    const start = async (native: boolean): Promise<Map<string, string>> =>
      cookiesFrom(await app.request(native ? '/google?native=1' : '/google'))

    const callback = async (
      jar: Map<string, string>,
      query: Record<string, string> = {},
    ): Promise<Response> =>
      app.request(
        `/google/callback?${new URLSearchParams({
          state: String(jar.get('blinkered_google_state')),
          code: 'the-code',
          ...query,
        }).toString()}`,
        { headers: { cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') } },
      )

    it('marks the handshake native at the start, and only when asked', async () => {
      expect((await start(true)).get('blinkered_google_native')).toBe('1')
      expect((await start(false)).has('blinkered_google_native')).toBe(false)
    })

    it('ends at the app’s own scheme with a code, and sets no session cookie', async () => {
      const response = await callback(await start(true))
      expect(response.status).toBe(302)
      const location = new URL(String(response.headers.get('location')))
      expect(location.protocol).toBe('blinkered:')
      expect(location.searchParams.get('code')).toBeTruthy()
      /*
       * No cookie, and this is the point of the whole detour: a cookie set on playblinkered.com
       * is of no use to an app served from `capacitor://localhost`, and setting one anyway would
       * leave a live browser session behind that nobody asked for.
       */
      expect(cookiesFrom(response).has('blinkered_session')).toBe(false)
    })

    it('trades that code for a bearer token, once', async () => {
      const response = await callback(await start(true))
      const code = new URL(String(response.headers.get('location'))).searchParams.get('code')
      const first = await post('/native/exchange', { code })
      expect(first.status).toBe(200)
      const body = (await first.json()) as { token: string; userId: string }
      const session = store.sessions.get(hashSessionToken(body.token))
      expect(session?.kind).toBe('bearer')
      expect(session?.userId).toBe(body.userId)

      const again = await post('/native/exchange', { code })
      expect(again.status).toBe(401)
      expect(await again.json()).toEqual({ error: 'expired' })
    })

    it('lets the code run out in a minute', async () => {
      const response = await callback(await start(true))
      const code = new URL(String(response.headers.get('location'))).searchParams.get('code')
      clock = new Date(clock.getTime() + 61 * 1000)
      expect((await post('/native/exchange', { code })).status).toBe(401)
    })

    it('refuses a code nobody issued, and an empty one', async () => {
      expect((await post('/native/exchange', { code: 'invented' })).status).toBe(401)
      expect((await post('/native/exchange', {})).status).toBe(400)
      expect((await post('/native/exchange', { code: '' })).status).toBe(400)
    })

    it('reports a failure to the app rather than to a web page', async () => {
      /*
       * `/?signin=cancelled` would load the game *inside* `ASWebAuthenticationSession`: a sheet
       * showing a playable board, with the app behind it waiting for a callback that never comes.
       * The custom scheme is what closes the sheet, so both endings have to use it.
       */
      const response = await callback(await start(true), { error: 'access_denied' })
      expect(response.headers.get('location')).toBe('blinkered://auth?error=cancelled')
    })

    it('still ends at a cookie and a page when a browser started it', async () => {
      const response = await callback(await start(false))
      expect(response.headers.get('location')).toBe('/?signin=ok')
      expect(cookiesFrom(response).get('blinkered_session')).toBeTruthy()
    })

    it('forgets the native marker on the way out', async () => {
      // Left behind, it would make the *next* handshake in that browser native and send somebody
      // to a URL scheme their browser has never heard of.
      const response = await callback(await start(true))
      const cleared = response.headers
        .getSetCookie()
        .find((line) => line.startsWith('blinkered_google_native='))
      expect(cleared).toContain('Max-Age=0')
    })
  })
})
