import type { Messages } from '@blinkered/i18n'

/**
 * The browser's half of signing in with Apple or Google, which is smaller than it sounds.
 *
 * There is no SDK and no script tag for either. The whole client side is: leave for a server
 * route, and read one query parameter on the way back. Everything else -- the authorize URL, the
 * state and nonce cookies, the token exchange, the signature check -- happens on the server,
 * because the browser must never hold anything a provider signed. `docs/AUTH.md` has the shape.
 */

export type Sso = 'apple' | 'google'

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
