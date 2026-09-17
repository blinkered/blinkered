import { afterEach, describe, expect, it, vi } from 'vitest'
import { pathOf, routeOf, urlOf } from '../src/route.js'

/**
 * Addresses, and the one about them that reached a phone: a shared link nobody could open.
 *
 * `urlOf` built its absolute form from the page's own origin, which is right on the web and
 * meaningless in the shell -- Nick shared a game from the app and Messages carried
 * `capacitor://localhost/g/T7EZjIEcIz8`, a scheme that means something only inside the app that
 * sent it. The rest of this file is the round trip between a path and a route, which is what a
 * permalink rests on.
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

/** There is no document in these tests, so the origin a browser would have is supplied. */
function beOnTheWeb(origin: string): void {
  vi.stubGlobal('location', { origin })
}

afterEach(() => {
  beNative(false)
  vi.unstubAllGlobals()
})

describe('where a shared link points', () => {
  it('is the page’s own origin on the web', () => {
    // So a link copied on the dev host points at the dev host, which is what makes a permalink
    // testable before it is public.
    beOnTheWeb('https://blinkered.devapps.tightlinesoftware.com')
    expect(urlOf({ at: 'played-game', id: 'T7EZjIEcIz8' })).toBe(
      'https://blinkered.devapps.tightlinesoftware.com/g/T7EZjIEcIz8',
    )
  })

  it('is the website in the native shell, not the shell’s own scheme', () => {
    // The origin the shell would have reported, to prove it is not the one used.
    beOnTheWeb('capacitor://localhost')
    beNative(true)
    expect(urlOf({ at: 'played-game', id: 'T7EZjIEcIz8' })).toBe(
      'https://playblinkered.com/g/T7EZjIEcIz8',
    )
    expect(urlOf({ at: 'player', username: 'trout' })).toBe('https://playblinkered.com/u/trout')
    expect(urlOf({ at: 'board', language: 'en', difficulty: 'insane' })).toBe(
      'https://playblinkered.com/l/en/insane',
    )
  })
})

describe('reading an address', () => {
  it('round-trips every route it can write', () => {
    for (const route of [
      { at: 'game' },
      { at: 'played-game', id: 'T7EZjIEcIz8' },
      { at: 'player', username: 'trout' },
      { at: 'board', language: 'en', difficulty: 'insane' },
      { at: 'admin' },
      { at: 'about' },
    ] as const) {
      expect(routeOf(pathOf(route))).toEqual(route)
    }
  })

  it('encodes and decodes a username that needs it', () => {
    // A name is what somebody typed, and the path is where it ends up.
    const path = pathOf({ at: 'player', username: 'ö trout' })
    expect(path).toBe('/u/%C3%B6%20trout')
    expect(routeOf(path)).toEqual({ at: 'player', username: 'ö trout' })
  })

  it('reads anything it does not recognise as the game', () => {
    // Which is what `/` has always been, and what nginx answers for these paths anyway.
    for (const path of ['/', '/nonsense', '/g', '/g/', '/u', '/l/en', '/about/more', '/admin/x']) {
      expect(routeOf(path)).toEqual({ at: 'game' })
    }
  })
})
