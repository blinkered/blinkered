import { afterEach, describe, expect, it } from 'vitest'
import { returnedFromSso, ssoAvailable, startUrl } from '../src/sso.js'

/**
 * Where the provider buttons are offered, which is a question about the platform.
 *
 * They were offered everywhere, and in the native shell pressing one restarted the app at the
 * first screen of the tour: a root-relative navigation to `/v1/auth/apple` resolves against
 * `capacitor://localhost`, Capacitor's local server answers an unknown path with `index.html`,
 * and the app boots again. It read as a crash on a phone and as nothing at all in every test,
 * because nothing here had ever run as the shell.
 *
 * `api.test.ts` installs the same global for the same reason. That file is the fetch half of this
 * mistake; this is the navigation half, which is the one that got missed.
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

afterEach(() => {
  beNative(false)
})

describe('where sign-in with a provider is offered', () => {
  it('is offered in a browser', () => {
    beNative(false)
    expect(ssoAvailable()).toBe(true)
  })

  it('is not offered in the native shell', () => {
    beNative(true)
    expect(ssoAvailable()).toBe(false)
  })

  /**
   * The URL is deliberately root-relative and stays that way.
   *
   * Making it absolute would fix neither wall behind it -- app-bound domains refuses the
   * navigation, and Google refuses an embedded WebView -- so an absolute URL would buy a
   * different failure rather than a success. The platform check is the fix; this is here so that
   * anybody who "fixes" the URL instead has to read that.
   */
  it('starts at a path on this origin', () => {
    expect(startUrl('apple')).toBe('/v1/auth/apple')
    expect(startUrl('google')).toBe('/v1/auth/google')
  })
})

describe('coming back from a provider', () => {
  it('reads nothing out of an ordinary page load', () => {
    expect(returnedFromSso('')).toBeNull()
    expect(returnedFromSso('?board=en')).toBeNull()
    // An empty value is not an answer either; a bare `?signin=` is a malformed return, not a
    // success, and treating it as one would sign somebody in on a hand-typed URL.
    expect(returnedFromSso('?signin=')).toBeNull()
  })

  it('reads success and failure', () => {
    expect(returnedFromSso('?signin=ok')).toEqual({ ok: true, reason: 'ok' })
    expect(returnedFromSso('?signin=cancelled')).toEqual({ ok: false, reason: 'cancelled' })
  })
})
