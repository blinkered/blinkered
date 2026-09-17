import type { Messages } from '@blinkered/i18n'
import { isNativeApp } from './platform.js'

/**
 * The browser's half of signing in with Apple or Google, which is smaller than it sounds.
 *
 * There is no SDK and no script tag for either. The whole client side is: leave for a server
 * route, and read one query parameter on the way back. Everything else -- the authorize URL, the
 * state and nonce cookies, the token exchange, the signature check -- happens on the server,
 * because the browser must never hold anything a provider signed. `docs/AUTH.md` has the shape.
 */

export type Sso = 'apple' | 'google'

/**
 * Whether **this** flow -- a redirect in the address bar -- can work where the app is running.
 *
 * Not the same question as whether the buttons are shown. The shell offers them through
 * `nativeAuth.ts`, which does the handshake outside the WebView; what cannot happen there is the
 * navigation below, and the three reasons why are worth keeping because each of them defeats a
 * different attempted fix:
 *
 * Not a preference, and not a thing that can be fixed by editing a URL. There are three walls
 * behind it and the first one is what somebody actually sees:
 *
 * 1. `startUrl` is root-relative, and this is a navigation rather than a fetch, so it never
 *    passes through `api.ts` and never becomes absolute. In the shell the document's origin is
 *    `capacitor://localhost`, so pressing the button asks Capacitor's local server for
 *    `/v1/auth/apple`, which does not exist in the bundle; the server falls back to `index.html`
 *    the way it does for any unknown path, and **the app reboots at the first screen of the
 *    tour.** Instantly, with no network involved, which is what makes it look like a crash.
 * 2. `WKAppBoundDomains` in `Info.plist` lists this app's own domains, and WebKit refuses to
 *    navigate an app-bound WebView anywhere else. Apple's and Google's sheets are elsewhere.
 * 3. Google refuses OAuth in an embedded WebView outright -- `disallowed_useragent` -- and
 *    Apple's `response_mode=form_post` flow assumes a real browser. So the redirect handshake
 *    cannot work inside a WebView however it is configured.
 *
 * So the shell does it out of process instead: `ASAuthorizationAppleIDProvider` for Apple,
 * `ASWebAuthenticationSession` for Google, a one-minute code on a custom scheme, and a bearer
 * token in `rememberToken()`. `nativeAuth.ts` is that path and `docs/IOS.md` has the shape.
 *
 * Which leaves this function meaning exactly one thing: draw the buttons that navigate. In the
 * shell the same two buttons are drawn by the same component and call the plugin instead.
 */
export function ssoAvailable(): boolean {
  return !isNativeApp()
}

/** Where the handshake starts. A full navigation, not fetch: the browser has to leave. */
export function startUrl(provider: Sso): string {
  return `/v1/auth/${provider}`
}

/**
 * What came back, or nothing.
 *
 * The callback redirects to `/?signin=<reason>`, with `ok` for success. Returning `null` for an
 * ordinary page load is what lets the caller run this unconditionally on mount.
 */
export function returnedFromSso(
  search: string,
): { readonly ok: boolean; readonly reason: string } | null {
  const reason = new URLSearchParams(search).get('signin')
  if (reason === null || reason === '') return null
  return { ok: reason === 'ok', reason }
}

/**
 * What to tell somebody whose sign-in did not work.
 *
 * Deliberately vague about the ones that are our problem rather than theirs. "That took too
 * long" is true and useful; "the signature on the token the provider returned did not verify" is
 * true and tells a person nothing they can act on, while telling anybody probing the flow
 * exactly which check they tripped.
 */
export function ssoProblem(messages: Messages, reason: string): string {
  switch (reason) {
    case 'cancelled':
      return messages.ssoCancelled
    case 'expired':
      return messages.ssoExpired
    case 'no-username':
      return messages.ssoNoUsername
    default:
      return messages.ssoFailed
  }
}

/**
 * Removes the parameter without reloading or adding a history entry.
 *
 * `replaceState`, so Back does not return to a URL that would look like a second sign-in attempt,
 * and so a refresh does not show the same message again.
 */
export function clearSignInParam(): void {
  const url = new URL(globalThis.location.href)
  url.searchParams.delete('signin')
  globalThis.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}
