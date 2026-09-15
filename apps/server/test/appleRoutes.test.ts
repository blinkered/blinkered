import { beforeEach, describe, expect, it } from 'vitest'
import { authRoutes } from '../src/auth/routes.js'
import type { AuthDeps } from '../src/auth/routes.js'
import { appleProvider } from '../src/auth/apple.js'
import type { AppleConfig } from '../src/auth/apple.js'
import { OidcError } from '../src/auth/oidc.js'
import type { OidcClient, OidcIdentity } from '../src/auth/oidc.js'
import { capturingMailer, fakeStore } from './fake.js'

/**
 * The two Apple routes, driven with a scripted client.
 *
 * The protocol itself -- signatures, claims, the JWKS cache -- is `apple.test.ts`, against real
 * keys. What is asserted here is the part that is ours: the state and nonce cookies, what happens
 * to each way the handshake can go wrong, and which account a given identity lands in.
 */

const config: AppleConfig = {
  teamId: 'ZJ3A78KXA4',
  keyId: '85Z9WXC2Q9',
  servicesId: 'com.tightlinesoftware.blinkered.signin',
  redirectUri: 'https://playblinkered.com/v1/auth/apple/callback',
  privateKey: 'unused: the client is scripted',
}

/** What Apple would have said, or what it would have failed with. */
function scripted(answer: OidcIdentity | OidcError): OidcClient {
  return {
    exchange: () => (answer instanceof OidcError ? Promise.reject(answer) : Promise.resolve('t')),
    verify: () => (answer instanceof OidcError ? Promise.reject(answer) : Promise.resolve(answer)),
  }
}

const SOMEBODY: OidcIdentity = {
  sub: '001234.abcdef.5678',
  email: 'player@example.com',
  emailVerified: true,
  isPrivateRelay: false,
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

describe('signing in with Apple', () => {
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
      oidc: [{ provider: appleProvider(config), client }],
    }
    app = authRoutes(deps)
  }

  beforeEach(() => {
    store = fakeStore()
    client = scripted(SOMEBODY)
    build()
  })

  /** Starts the handshake and hands back the cookies it set. */
  const start = async (): Promise<Map<string, string>> => cookiesFrom(await app.request('/apple'))

  const callback = async (
    form: Record<string, string>,
    jar: Map<string, string>,
  ): Promise<Response> =>
    app.request('/apple/callback', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; '),
      },
      body: new URLSearchParams(form).toString(),
    })

  const round = async (overrides: Record<string, string> = {}): Promise<Response> => {
    const jar = await start()
    return callback(
      { state: String(jar.get('blinkered_apple_state')), code: 'the-code', ...overrides },
      jar,
    )
  }

  describe('starting it', () => {
    it('redirects to Apple', async () => {
      const response = await app.request('/apple')
      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('https://appleid.apple.com/auth/authorize')
    })

    it('sets a state and a nonce, and they differ', async () => {
      const jar = await start()
      expect(jar.get('blinkered_apple_state')).toBeDefined()
      expect(jar.get('blinkered_apple_nonce')).toBeDefined()
      expect(jar.get('blinkered_apple_state')).not.toBe(jar.get('blinkered_apple_nonce'))
    })

    it('sends the state cookie SameSite=None and Secure', async () => {
      /*
       * The one that costs an afternoon. Apple's callback is a cross-site POST, and a Lax cookie
       * is not sent on one, so a Lax state cookie is simply missing when the callback arrives and
       * the failure reads as a forged state. Secure is not optional either: SameSite=None
       * requires it, whatever `secureCookies` says, which is why this asserts it while the deps
       * above have `secureCookies: false`.
       */
      const header = (await app.request('/apple')).headers
        .getSetCookie()
        .find((line) => line.startsWith('blinkered_apple_state='))
      expect(header).toContain('SameSite=None')
      expect(header).toContain('Secure')
      expect(header).toContain('HttpOnly')
    })
  })

  describe('coming back', () => {
    it('signs somebody in and sets a session cookie', async () => {
      const response = await round()
      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('/?signin=ok')
      expect(cookiesFrom(response).get('blinkered_session')).toBeTruthy()
    })

    it('creates the account on a first arrival, with the Apple sub as the identity', async () => {
      await round()
      expect(store.identities).toHaveLength(1)
      expect(store.identities[0]?.provider).toBe('apple')
      expect(store.identities[0]?.providerAccountId).toBe(SOMEBODY.sub)
    })

    it('finds the same account the second time rather than making another', async () => {
      await round()
      build()
      await round()
      expect(store.users.size).toBe(1)
      expect(store.identities).toHaveLength(1)
    })

    it('clears the handshake cookies once it is done', async () => {
      const jar = cookiesFrom(await round())
      expect(jar.get('blinkered_apple_state')).toBe('')
      expect(jar.get('blinkered_apple_nonce')).toBe('')
    })
  })

  describe('linking to an account that already exists', () => {
    /** An account made the way the code flow makes one. */
    const withEmail = async (email: string): Promise<string> => {
      const id = await store.createUser({
        id: 'existing-user',
        username: 'existing',
        identity: { provider: 'email', providerAccountId: email, email, emailVerified: true },
      })
      return String(id)
    }

    it('links a verified address to the account that already has it', async () => {
      const userId = await withEmail('player@example.com')
      await round()
      expect(store.users.size).toBe(1)
      expect(store.identities.filter((i) => i.userId === userId)).toHaveLength(2)
    })

    it('refuses to link an unverified address, which would be a takeover', async () => {
      /*
       * The security assertion in this file. Without the `emailVerified` check, anybody able to
       * assert an address at their identity provider walks into the Blinkered account that owns
       * it, without ever touching the inbox.
       */
      await withEmail('player@example.com')
      client = scripted({ ...SOMEBODY, emailVerified: false })
      build()
      await round()
      expect(store.users.size).toBe(2)
    })

    it('refuses to link a relay address, which is a forwarding rule rather than a mailbox', async () => {
      await withEmail('k7m2xq9p4r@privaterelay.appleid.com')
      client = scripted({
        ...SOMEBODY,
        email: 'k7m2xq9p4r@privaterelay.appleid.com',
        isPrivateRelay: true,
      })
      build()
      await round()
      expect(store.users.size).toBe(2)
    })

    it('finds the Apple account when the code flow arrives second', async () => {
      /*
       * The direction that used to make two accounts. Signing in with Apple and then typing the
       * same address into the email form is one person pressing two buttons, and which one they
       * pressed first should not decide how many accounts they end up with.
       */
      await round()
      expect(store.users.size).toBe(1)
      const [account] = [...store.users.values()]
      expect(await store.userIdForVerifiedEmail('player@example.com')).toBe(account?.userId)
    })

    it('will not match an address no provider has verified', async () => {
      client = scripted({ ...SOMEBODY, emailVerified: false })
      build()
      await round()
      // Recorded against the account, but not something another sign-in may link to: an address
      // a provider passed along is a claim, and linking on a claim hands over the account.
      expect(await store.userIdForVerifiedEmail('player@example.com')).toBeNull()
    })

    it('makes a new account when nothing matches', async () => {
      await withEmail('somebody-else@example.com')
      await round()
      expect(store.users.size).toBe(2)
    })

    it('makes a new account when Apple sends no address at all', async () => {
      client = scripted({ ...SOMEBODY, email: null })
      build()
      await round()
      expect(store.users.size).toBe(1)
      expect(store.identities[0]?.email).toBeNull()
    })
  })

  describe('when it goes wrong', () => {
    const reasonOf = (response: Response): string =>
      new URL(String(response.headers.get('location')), 'https://x').searchParams.get('signin') ??
      ''

    it('redirects rather than returning a status, because a browser is reading it', async () => {
      const response = await round({ state: 'not-the-state' })
      expect(response.status).toBe(302)
      expect(reasonOf(response)).toBe('bad-state')
    })

    it('says cancelled when somebody backs out at Apple', async () => {
      const jar = await start()
      expect(reasonOf(await callback({ error: 'user_cancelled_authorize' }, jar))).toBe('cancelled')
    })

    it('says expired when the handshake cookies are gone', async () => {
      const response = await callback({ state: 'x', code: 'y' }, new Map())
      expect(reasonOf(response)).toBe('expired')
    })

    it('rejects a callback with no code', async () => {
      expect(reasonOf(await round({ code: '' }))).toBe('bad-state')
    })

    it('surfaces the reason an Apple error carries', async () => {
      client = scripted(new OidcError('bad-signature'))
      build()
      expect(reasonOf(await round())).toBe('bad-signature')
    })

    it('survives a body that is not a form', async () => {
      const jar = await start()
      const response = await app.request('/apple/callback', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; '),
        },
        body: '%%%',
      })
      expect(response.status).toBe(302)
    })

    it('lets a failure that is not Apple’s become a 500 rather than a friendly message', async () => {
      // A network that is down is not a failed sign-in. Catching it into `?signin=whatever` would
      // hide an outage behind a message telling the player to try again, which is the difference
      // between a page that is wrong and a page that lies.
      client = {
        exchange: () => Promise.reject(new Error('the network is on fire')),
        verify: () => Promise.reject(new Error('unused')),
      }
      build()
      expect((await round()).status).toBe(500)
    })

    it('gives up when no username can be found', async () => {
      store.createUser = () => Promise.resolve(null)
      expect(reasonOf(await round())).toBe('no-username')
    })
  })

  describe('when no key is configured', () => {
    it('answers 501, so a stub is not mistaken for a routing mistake', async () => {
      const bare = authRoutes({ store, mailer: capturingMailer(), now: () => clock })
      const response = await bare.request('/apple')
      expect(response.status).toBe(501)
      expect(await response.json()).toEqual({ error: 'not-implemented', provider: 'apple' })
    })

    it('still answers 501 for Google, which is not built either way', async () => {
      expect((await app.request('/google')).status).toBe(501)
    })
  })
})
