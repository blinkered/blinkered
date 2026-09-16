import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, forgetToken, rememberToken, token, wantsToken } from '../src/api.js'

/**
 * Where a request goes, and what it carries.
 *
 * Two platforms with incompatible answers, and the bug this replaces was that only one of them
 * had ever been considered. In the shell a root-relative `/v1/me` resolves to
 * `capacitor://localhost/v1/me` -- a file in the app bundle -- so signed-in features were not
 * failing, they were never being sent anywhere.
 *
 * The native half is selected by `isNativeApp()`, which reads the global Capacitor injects. These
 * tests install and remove that global, which is the whole of the platform detection.
 */

function beNative(yes: boolean): void {
  if (!yes) {
    Reflect.deleteProperty(globalThis, 'Capacitor')
    return
  }
  Object.defineProperty(globalThis, 'Capacitor', {
    value: { isNativePlatform: () => true },
    configurable: true,
    writable: true,
  })
}

function fakeStorage(options: { refuses?: boolean } = {}): Storage {
  const held = new Map<string, string>()
  const refuse = (): never => {
    throw new DOMException('denied', 'SecurityError')
  }
  return {
    get length() {
      return held.size
    },
    clear: () => {
      held.clear()
    },
    key: (at: number) => [...held.keys()][at] ?? null,
    getItem: (key: string) => (options.refuses === true ? refuse() : (held.get(key) ?? null)),
    setItem: (key: string, value: string) => {
      if (options.refuses === true) refuse()
      held.set(key, value)
    },
    removeItem: (key: string) => {
      if (options.refuses === true) refuse()
      held.delete(key)
    },
  }
}

function use(storage: Storage): void {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

/** Records what `fetch` was asked for, and answers 200. */
function recording(): {
  fetch: typeof fetch
  calls: { url: string; init: RequestInit }[]
} {
  const calls: { url: string; init: RequestInit }[] = []
  // Narrowed rather than stringified: `Request` has no useful `toString`, so `String(url)` would
  // quietly record '[object Object]' and every assertion about a URL would be vacuous.
  const href = (url: string | URL | Request): string =>
    typeof url === 'string' ? url : url instanceof URL ? url.href : url.url
  const stub = vi.fn((url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    calls.push({ url: href(url), init: init ?? {} })
    return Promise.resolve(new Response('{}', { status: 200 }))
  })
  return { fetch: stub, calls }
}

const realFetch = globalThis.fetch

describe('the token on the device', () => {
  beforeEach(() => {
    use(fakeStorage())
  })
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('round-trips and clears', () => {
    expect(token()).toBeNull()
    rememberToken('abc123')
    expect(token()).toBe('abc123')
    forgetToken()
    expect(token()).toBeNull()
  })

  it('survives a storage that refuses, in all three directions', () => {
    use(fakeStorage({ refuses: true }))
    expect(() => {
      rememberToken('abc123')
    }).not.toThrow()
    expect(token()).toBeNull()
    expect(() => {
      forgetToken()
    }).not.toThrow()
  })
})

describe('a request from a browser', () => {
  beforeEach(() => {
    use(fakeStorage())
    beNative(false)
  })
  afterEach(() => {
    globalThis.fetch = realFetch
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('stays root-relative and carries the cookie', async () => {
    const stub = recording()
    globalThis.fetch = stub.fetch
    await apiFetch('me')
    expect(stub.calls[0]?.url).toBe('/v1/me')
    expect(stub.calls[0]?.init.credentials).toBe('same-origin')
  })

  it('sends no bearer, even if a token somehow got stored', async () => {
    // A browser presenting a bearer would be presenting a credential it has no way to have
    // obtained, and the server's CORS admits that header from the shell origin only.
    rememberToken('abc123')
    const stub = recording()
    globalThis.fetch = stub.fetch
    await apiFetch('me')
    expect(new Headers(stub.calls[0]?.init.headers).get('authorization')).toBeNull()
  })

  it('does not ask sign-in for a token', () => {
    expect(wantsToken()).toBe(false)
  })
})

describe('a request from the native shell', () => {
  beforeEach(() => {
    use(fakeStorage())
    beNative(true)
  })
  afterEach(() => {
    globalThis.fetch = realFetch
    beNative(false)
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('goes to an absolute origin, because a relative path resolves into the bundle', async () => {
    const stub = recording()
    globalThis.fetch = stub.fetch
    await apiFetch('me')
    expect(stub.calls[0]?.url).toBe('https://playblinkered.com/v1/me')
  })

  it('carries the bearer token and omits credentials', async () => {
    rememberToken('abc123')
    const stub = recording()
    globalThis.fetch = stub.fetch
    await apiFetch('me')
    expect(new Headers(stub.calls[0]?.init.headers).get('authorization')).toBe('Bearer abc123')
    // There is no cookie to send, and asking invites the browser to attach something the
    // server's CORS deliberately will not accept.
    expect(stub.calls[0]?.init.credentials).toBe('omit')
  })

  it('sends no authorization header before there is a token', async () => {
    const stub = recording()
    globalThis.fetch = stub.fetch
    await apiFetch('me')
    expect(new Headers(stub.calls[0]?.init.headers).get('authorization')).toBeNull()
  })

  it('keeps the headers a caller passed', async () => {
    rememberToken('abc123')
    const stub = recording()
    globalThis.fetch = stub.fetch
    await apiFetch('me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    const sent = new Headers(stub.calls[0]?.init.headers)
    expect(sent.get('content-type')).toBe('application/json')
    expect(sent.get('authorization')).toBe('Bearer abc123')
    expect(stub.calls[0]?.init.method).toBe('PATCH')
  })

  it('asks sign-in for a token', () => {
    expect(wantsToken()).toBe(true)
  })
})
