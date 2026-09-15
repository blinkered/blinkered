/**
 * The browser's half of Sign in with Apple, which is smaller than it sounds.
 *
 * There is no SDK and no script tag. The whole client side is: leave for a server route, and read
 * one query parameter on the way back. Everything else -- the authorize URL, the state and nonce
 * cookies, the token exchange, the signature check -- happens on the server, because the browser
 * must never hold anything Apple signed. `docs/AUTH.md` has the shape of the flow.
 */

/** Where the handshake starts. A full navigation, not fetch: the browser has to leave. */
export const APPLE_START = '/v1/auth/apple'

/**
 * What came back, or nothing.
 *
 * The callback redirects to `/?signin=<reason>`, with `ok` for success. Returning `null` for an
 * ordinary page load is what lets the caller run this unconditionally on mount.
 */
export function returnedFromApple(
  search: string,
): { readonly ok: boolean; readonly reason: string } | null {
  const reason = new URLSearchParams(search).get('signin')
  if (reason === null || reason === '') return null
  return { ok: reason === 'ok', reason }
}

/**
 * What to tell somebody whose sign-in did not work.
 *
 * Deliberately vague about the ones that are our problem rather than theirs. "Your session
 * expired" is true and useful; "the signature on the token Apple returned did not verify" is
 * true and tells a person nothing they can act on, while telling anybody probing the flow
 * exactly which check they tripped.
 */
export function appleProblem(reason: string): string {
  switch (reason) {
    case 'cancelled':
      return 'Signing in with Apple was cancelled.'
    case 'expired':
      return 'That took too long. Try signing in again.'
    case 'no-username':
      return 'Could not finish creating an account. Try again in a moment.'
    default:
      return 'Signing in with Apple did not work. Try again, or use your email.'
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
