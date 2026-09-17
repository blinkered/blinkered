import { isNativeApp } from './platform.js'

/**
 * Where a request goes and what it carries, which is the one thing the native shell changes.
 *
 * On the web this is the API the app has always talked to: `/v1/...`, same origin, session in a
 * cookie, and no CORS anywhere because nginx serves the bundle and the API together. Every
 * request in this file still resolves to exactly that in a browser.
 *
 * In the shell none of that holds. The app is served from `capacitor://localhost`, so:
 *
 * - **A root-relative path resolves into the app bundle.** `/v1/me` becomes
 *   `capacitor://localhost/v1/me`, which is a file that does not exist. This is why signed-in
 *   features did not merely fail in the shell, they were never sent anywhere.
 * - **The session cookie cannot travel.** It is `SameSite=Lax` and scoped to `playblinkered.com`,
 *   so a request from another origin never carries it, and WKWebView's third-party cookie policy
 *   is against it even if it did.
 *
 * So the shell sends an absolute URL and a bearer token, which is what `sessions.kind` has meant
 * since it was written. One place decides both, because the failure when two places disagree is
 * an app that is signed in for some calls and not others.
 */

/**
 * The origin the shell talks to.
 *
 * Production, unconditionally, and not configurable at runtime: an installed app has no address
 * bar to read a different one from, and a build that could be pointed at another host is a build
 * somebody can point at another host. A development shell is built from a development bundle.
 *
 * **Worth knowing before testing sign-in on a device:** an account created from the app is a
 * production account, and a game played in it goes on the production boards. Dev is behind the
 * VPN and a phone cannot reach it, so this is the honest arrangement rather than an oversight.
 *
 * Exported because the native sign-in needs it as well: `nativeAuth.ts` hands a URL to
 * `ASWebAuthenticationSession`, which is the one request in the app the WebView does not make --
 * iOS does -- so it cannot go through `apiFetch`. Reading the value from here keeps one answer to
 * "where does this app talk to".
 */
export const NATIVE_API_ORIGIN = 'https://playblinkered.com'

const TOKEN_KEY = 'blinkered.token.v1'

/**
 * The bearer token, on the device.
 *
 * **This is `localStorage`, and the keychain is the better home for it.** In a WKWebView that
 * store is inside the app's own sandbox, is not shared with Safari or any other app, and goes
 * when the app is uninstalled, so it is a reasonable place -- but it is readable by any script
 * running in the WebView, and the keychain is not. Moving it needs a Capacitor plugin and a way
 * for `apps/web` to reach it, which today would mean this package depending on Capacitor, and
 * `platform.ts` exists precisely so that it does not.
 *
 * Kept behind these three functions so that the move is a change to one file rather than a
 * change to every caller. Recorded as owed in docs/IOS.md.
 */
export function token(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function rememberToken(value: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, value)
  } catch {
    // Nothing better to do. The session lasts as long as this launch, and the next one asks for
    // a code again, which is a worse experience rather than a broken one.
  }
}

export function forgetToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* See `rememberToken`. */
  }
}

/**
 * One request to the API, from either platform.
 *
 * `credentials: 'same-origin'` on the web and stated rather than left to the default, for the
 * reason `account.ts` gave when it was written: relying on a default for the thing the whole
 * feature depends on is how it breaks the day something proxies it. In the shell credentials are
 * `omit`, because there is no cookie to send and asking for one invites the browser to attach
 * something to a cross-origin request that the server's CORS deliberately will not accept.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const native = isNativeApp()
  const url = native ? `${NATIVE_API_ORIGIN}/v1/${path}` : `/v1/${path}`
  const carried = token()
  const headers = new Headers(init.headers)
  // Only in the shell, and only when there is one. A browser that sent a bearer would be
  // presenting a credential it has no way to have obtained.
  if (native && carried !== null) headers.set('authorization', `Bearer ${carried}`)
  return fetch(url, {
    ...init,
    headers,
    credentials: native ? 'omit' : 'same-origin',
  })
}

/** Whether a sign-in should ask for a token rather than a cookie. The server does not guess. */
export function wantsToken(): boolean {
  return isNativeApp()
}
