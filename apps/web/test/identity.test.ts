import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { whoAmI } from '../src/account.js'
import type { Account } from '../src/account.js'
import { cached, forget, remember } from '../src/identity.js'

/**
 * The cached identity, and the distinction it exists to protect.
 *
 * The rule under test is one sentence: **only a 401 means signed out.** Everything else that
 * stops the app finding out -- no network, a 500, a build with no API behind it, a body that
 * will not parse -- is `offline`, and an offline answer hands back the last account this device
 * was told about rather than null.
 *
 * Worth pinning here rather than checking in a browser once, because the failure is silent and
 * looks like a feature: an offline player renders as signed out, their session is still valid,
 * and the only symptom is somebody reporting that the app lost their account.
 *
 * Same footing as the other tests in this directory: `apps/web` stays outside the coverage gate,
 * and the Playwright suite ACCOUNTS.md item 5 asks for is still the thing that would close the
 * real gap.
 */

/** What the module reads and writes, so a test can put a shape in it by hand. */
const KEY = 'blinkered.account.v1'

const ACCOUNT: Account = {
  userId: 'u_1',
  username: 'clever-beacon-1267',
  avatarSeed: 'seed-1267',
  country: 'US',
  uiLanguage: 'en',
  gameLanguage: 'fi',
  bio: null,
  isAdmin: false,
}

/** A storage made of a Map, or one that refuses, as in `reportDraft.test.ts`. */
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

/** A `fetch` that answers however the test says, including by refusing to connect. */
function answering(reply: { status: number; body?: unknown } | 'unreachable'): typeof fetch {
  return vi.fn((): Promise<Response> => {
    // A rejected promise rather than a thrown error, because that is what a browser does when
    // it cannot open the connection, and the `catch` under test is the one that has to see it.
    if (reply === 'unreachable') return Promise.reject(new TypeError('Failed to fetch'))
    return Promise.resolve(
      new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
        status: reply.status,
        headers: { 'content-type': 'application/json' },
      }),
    )
  })
}

describe('the cached account', () => {
  let storage: Storage

  beforeEach(() => {
    storage = fakeStorage()
    use(storage)
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('hands back what it was given', () => {
    remember(ACCOUNT)
    expect(cached()).toEqual(ACCOUNT)
  })

  it('is empty before anything is remembered', () => {
    expect(cached()).toBeNull()
  })

  it('is empty after forgetting', () => {
    remember(ACCOUNT)
    forget()
    expect(cached()).toBeNull()
  })

  it('refuses a blob that is not JSON', () => {
    storage.setItem(KEY, 'not json {')
    expect(cached()).toBeNull()
  })

  it('refuses JSON that is not an object', () => {
    storage.setItem(KEY, '"a string"')
    expect(cached()).toBeNull()
    storage.setItem(KEY, 'null')
    expect(cached()).toBeNull()
  })

  /*
   * The shape check, field by field.
   *
   * This store outlives the code that wrote it, so a shape from an older release has to read as
   * "no cached identity" rather than reach a screen as a half-account.
   */
  it.each([
    ['no userId', { ...ACCOUNT, userId: undefined }],
    ['no username', { ...ACCOUNT, username: undefined }],
    ['no avatarSeed', { ...ACCOUNT, avatarSeed: undefined }],
    ['isAdmin as a string', { ...ACCOUNT, isAdmin: 'yes' }],
    ['country undefined rather than null', { ...ACCOUNT, country: undefined }],
    ['uiLanguage undefined rather than null', { ...ACCOUNT, uiLanguage: undefined }],
    ['gameLanguage undefined rather than null', { ...ACCOUNT, gameLanguage: undefined }],
    ['bio as a number', { ...ACCOUNT, bio: 7 }],
  ])('refuses one with %s', (_what, shape) => {
    storage.setItem(KEY, JSON.stringify(shape))
    expect(cached()).toBeNull()
  })

  it('survives a storage that refuses, in both directions', () => {
    use(fakeStorage({ refuses: true }))
    expect(() => {
      remember(ACCOUNT)
    }).not.toThrow()
    expect(cached()).toBeNull()
    expect(() => {
      forget()
    }).not.toThrow()
  })
})

describe('asking who we are', () => {
  let storage: Storage
  const realFetch = globalThis.fetch

  beforeEach(() => {
    storage = fakeStorage()
    use(storage)
  })

  afterEach(() => {
    globalThis.fetch = realFetch
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('is signed in when the server describes somebody, and caches it', async () => {
    globalThis.fetch = answering({ status: 200, body: ACCOUNT })
    await expect(whoAmI()).resolves.toEqual({ state: 'signed-in', account: ACCOUNT })
    expect(cached()).toEqual(ACCOUNT)
  })

  it('is signed out on a 401, and drops the cache', async () => {
    remember(ACCOUNT)
    globalThis.fetch = answering({ status: 401, body: { error: 'signed-out' } })
    await expect(whoAmI()).resolves.toEqual({ state: 'signed-out' })
    // The decisive assertion: a definite signed-out is the one case that clears it.
    expect(cached()).toBeNull()
  })

  it('is offline with the cached account when the network refuses', async () => {
    remember(ACCOUNT)
    globalThis.fetch = answering('unreachable')
    await expect(whoAmI()).resolves.toEqual({ state: 'offline', account: ACCOUNT })
    // Still there. This is the whole point of the file.
    expect(cached()).toEqual(ACCOUNT)
  })

  it('is offline with no account when the network refuses and nothing was cached', async () => {
    globalThis.fetch = answering('unreachable')
    await expect(whoAmI()).resolves.toEqual({ state: 'offline', account: null })
  })

  /*
   * A server that is there and broken is not a sign-out.
   *
   * 500 and 502 are the deployment being unwell, and 404 is a build served with no API behind
   * it. None of them is the server saying nobody is signed in, so none of them may clear the
   * cache or sign the interface out.
   */
  it.each([500, 502, 404])('is offline on a %i, keeping the cache', async (status) => {
    remember(ACCOUNT)
    globalThis.fetch = answering({ status })
    await expect(whoAmI()).resolves.toEqual({ state: 'offline', account: ACCOUNT })
    expect(cached()).toEqual(ACCOUNT)
  })

  it('is offline when a 200 carries a body that will not parse', async () => {
    remember(ACCOUNT)
    globalThis.fetch = vi.fn((): Promise<Response> =>
      Promise.resolve(
        new Response('not json {', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )
    await expect(whoAmI()).resolves.toEqual({ state: 'offline', account: ACCOUNT })
  })
})
