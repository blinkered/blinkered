import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appleNatively, googleNatively, nativeSsoAvailable } from '../src/nativeAuth.js'
import { forgetToken, token } from '../src/api.js'

/**
 * The app's half of a native sign-in: what it asks for, in what order, and what it keeps.
 *
 * All of it is here rather than in Swift, which is the point of the split -- the plugin shows a
 * sheet and returns a string. So everything worth checking is checkable: that the nonce comes
 * from the server and is hashed before Apple sees it, that a dismissed sheet is not an error,
 * that a 200 with no token in it is not a sign-in, and that a Google callback carrying `?error=`
 * is read rather than exchanged.
 */

const TOKEN_KEY = 'blinkered.token.v1'

function fakeStorage(): Storage {
  const held = new Map<string, string>()
  return {
    get length() {
      return held.size
    },
    clear: () => {
      held.clear()
    },
    getItem: (key: string) => held.get(key) ?? null,
    key: (at: number) => [...held.keys()][at] ?? null,
    removeItem: (key: string) => {
      held.delete(key)
    },
    setItem: (key: string, value: string) => {
      held.set(key, value)
    },
  }
}

/** The plugin, scripted, and a record of what it was handed. */
interface Script {
  apple?: () => Promise<{ identityToken?: unknown }>
  browser?: () => Promise<{ url?: unknown }>
  seen: { nonceHash?: string; url?: string; scheme?: string }
}

function beNative(script: Script | null): void {
  if (script === null) {
    Reflect.deleteProperty(globalThis, 'Capacitor')
    return
  }
  Object.defineProperty(globalThis, 'Capacitor', {
    value: {
      isNativePlatform: () => true,
      Plugins: {
        NativeAuth: {
          signInWithApple: (options: { nonceHash: string }) => {
            script.seen.nonceHash = options.nonceHash
            return (script.apple ?? (() => Promise.resolve({ identityToken: 'a.b.c' })))()
          },
          signInWithBrowser: (options: { url: string; scheme: string }) => {
            script.seen.url = options.url
            script.seen.scheme = options.scheme
            return (
              script.browser ?? (() => Promise.resolve({ url: 'blinkered://auth?code=the-code' }))
            )()
          },
        },
      },
    },
    configurable: true,
    writable: true,
  })
}

/** Every request the module made, and canned answers keyed by path. */
function serving(answers: Record<string, { status?: number; body?: unknown }>): {
  calls: { path: string; body: unknown }[]
} {
  const calls: { path: string; body: unknown }[] = []
  vi.stubGlobal('fetch', (url: string, init?: { body?: string }) => {
    const path = new URL(url, 'https://playblinkered.com').pathname
    calls.push({
      path,
      body: init?.body === undefined ? null : (JSON.parse(init.body) as unknown),
    })
    const answer = answers[path] ?? { status: 404 }
    return Promise.resolve(
      new Response(JSON.stringify(answer.body ?? {}), {
        status: answer.status ?? 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
  })
  return { calls }
}

describe('signing in from the shell', () => {
  let script: Script

  beforeEach(() => {
    vi.stubGlobal('localStorage', fakeStorage())
    script = { seen: {} }
    beNative(script)
  })

  afterEach(() => {
    forgetToken()
    beNative(null)
    vi.unstubAllGlobals()
  })

  describe('whether to offer it at all', () => {
    it('is offered when the shell has the plugin', () => {
      expect(nativeSsoAvailable()).toBe(true)
    })

    it('is not offered in a browser', () => {
      beNative(null)
      expect(nativeSsoAvailable()).toBe(false)
    })

    it('is not offered by a shell whose Swift is older than its web build', () => {
      /*
       * A real state rather than a hypothetical one: `cap sync` copies the web assets into the
       * app and nothing keeps the two halves the same age. Offering a button that calls a method
       * which does not exist is the failure this check exists to prevent.
       */
      Object.defineProperty(globalThis, 'Capacitor', {
        value: { isNativePlatform: () => true, Plugins: { NativeAuth: {} } },
        configurable: true,
      })
      expect(nativeSsoAvailable()).toBe(false)
    })
  })

  describe('Apple', () => {
    it('asks the server for a nonce, shows Apple its hash, and keeps the token', async () => {
      const { calls } = serving({
        '/v1/auth/native/nonce': { body: { nonce: 'the-nonce' } },
        '/v1/auth/native/apple': { body: { userId: 'u', token: 'a-bearer-token' } },
      })
      expect(await appleNatively()).toEqual({ ok: true })

      expect(calls.map((call) => call.path)).toEqual([
        '/v1/auth/native/nonce',
        '/v1/auth/native/apple',
      ])
      // A hash, not the nonce: what travels to Apple is not what spends the row.
      expect(script.seen.nonceHash).toBe(await sha256('the-nonce'))
      expect(script.seen.nonceHash).not.toBe('the-nonce')
      expect(calls[1]?.body).toEqual({ identityToken: 'a.b.c', nonce: 'the-nonce' })
      expect(token()).toBe('a-bearer-token')
      expect(localStorage.getItem(TOKEN_KEY)).toBe('a-bearer-token')
    })

    it('says cancelled when the sheet is dismissed, and keeps nothing', async () => {
      serving({ '/v1/auth/native/nonce': { body: { nonce: 'n' } } })
      script.apple = () => Promise.reject(new Error('The operation was canceled.'))
      expect(await appleNatively()).toEqual({ ok: false, reason: 'cancelled' })
      expect(token()).toBeNull()
    })

    it('reports the server’s reason when the token is refused', async () => {
      serving({
        '/v1/auth/native/nonce': { body: { nonce: 'n' } },
        '/v1/auth/native/apple': { status: 401, body: { error: 'bad-signature' } },
      })
      expect(await appleNatively()).toEqual({ ok: false, reason: 'bad-signature' })
      expect(token()).toBeNull()
    })

    it('does not treat a 200 with no token as a sign-in', async () => {
      // There is no cookie to fall back on in the shell, so this would be an app showing an
      // account it cannot authenticate one request for.
      serving({
        '/v1/auth/native/nonce': { body: { nonce: 'n' } },
        '/v1/auth/native/apple': { body: { userId: 'u' } },
      })
      expect(await appleNatively()).toEqual({ ok: false, reason: 'failed' })
      expect(token()).toBeNull()
    })

    it('stops when the server will not issue a nonce', async () => {
      serving({ '/v1/auth/native/nonce': { status: 503 } })
      expect(await appleNatively()).toEqual({ ok: false, reason: 'failed' })
      expect(script.seen.nonceHash).toBeUndefined()
    })

    it('is refused outright in a browser', async () => {
      beNative(null)
      expect(await appleNatively()).toEqual({ ok: false, reason: 'failed' })
    })
  })

  describe('Google', () => {
    it('opens an absolute URL marked native, and trades the code for a token', async () => {
      const { calls } = serving({
        '/v1/auth/native/exchange': { body: { userId: 'u', token: 'a-bearer-token' } },
      })
      expect(await googleNatively()).toEqual({ ok: true })
      /*
       * Absolute, and that is the whole lesson of this feature: a root-relative URL handed to
       * iOS would be resolved against `capacitor://localhost` by the very code trying to escape
       * it, which is exactly how the web buttons used to restart the app.
       */
      expect(script.seen.url).toBe('https://playblinkered.com/v1/auth/google?native=1')
      expect(script.seen.scheme).toBe('blinkered')
      expect(calls[0]?.body).toEqual({ code: 'the-code' })
      expect(token()).toBe('a-bearer-token')
    })

    it('reads a refusal out of the callback rather than exchanging it', async () => {
      const { calls } = serving({})
      script.browser = () => Promise.resolve({ url: 'blinkered://auth?error=cancelled' })
      expect(await googleNatively()).toEqual({ ok: false, reason: 'cancelled' })
      expect(calls).toEqual([])
    })

    it('says cancelled when the browser sheet is closed', async () => {
      serving({})
      script.browser = () => Promise.reject(new Error('Login cancelled by user'))
      expect(await googleNatively()).toEqual({ ok: false, reason: 'cancelled' })
    })

    it('refuses a callback with neither a code nor an error', async () => {
      serving({})
      script.browser = () => Promise.resolve({ url: 'blinkered://auth' })
      expect(await googleNatively()).toEqual({ ok: false, reason: 'failed' })
    })

    it('is refused outright in a browser', async () => {
      beNative(null)
      expect(await googleNatively()).toEqual({ ok: false, reason: 'failed' })
    })
  })
})

/** The same digest the module computes, for comparing against. */
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
