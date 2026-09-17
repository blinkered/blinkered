import { NATIVE_API_ORIGIN, apiFetch, rememberToken } from './api.js'
import { isNativeApp } from './platform.js'

/**
 * Signing in with Apple or Google from inside the native shell.
 *
 * The web flow cannot work there and `sso.ts` says why at length: a root-relative navigation
 * resolves into the app bundle, app-bound domains refuses to leave, and Google refuses an
 * embedded WebView outright. So the handshake happens **outside** the WebView, in code the
 * operating system runs, and this module is the seam between that and the app.
 *
 * **Everything except the two system sheets is here rather than in Swift.** The plugin fetches
 * nothing and decides nothing: it shows Apple's sheet and returns a token, or runs a browser
 * session and returns the URL it ended at. Each network call goes through `apiFetch`, so the
 * origin, the bearer header and the token store are the same ones the rest of the app uses, and
 * each decision is in TypeScript where the tests are. Swift that talks to an API is Swift that
 * needs its own copy of everything `api.ts` knows.
 *
 * Two doors, because the providers are genuinely different:
 *
 * - **Apple** is `ASAuthorizationAppleIDProvider`: a system sheet, no browser, and a signed
 *   identity token handed straight to the app. We post that token and a nonce the server issued.
 * - **Google** is `ASWebAuthenticationSession`: a real Safari outside the app, running the
 *   ordinary web flow, which ends by sending the browser to `blinkered://auth?code=...`. We trade
 *   that code for a token.
 */

/** What the Swift plugin offers. Two methods, both of them UI and nothing else. */
interface NativeAuthPlugin {
  /**
   * Apple's sheet. `nonceHash` is what goes in the request and comes back inside the token.
   *
   * Rejects when somebody dismisses it, which is not an error worth a message: `cancelled`.
   */
  signInWithApple(options: { nonceHash: string }): Promise<{ identityToken?: unknown }>
  /**
   * A browser session on `url`, ending when it is sent to a URL with `scheme`.
   *
   * Returns that final URL, unparsed. Reading it is this side's job, because what is in it is a
   * decision about our own API rather than about iOS.
   */
  signInWithBrowser(options: { url: string; scheme: string }): Promise<{ url?: unknown }>
}

interface CapacitorWithPlugins {
  readonly Plugins?: { readonly NativeAuth?: Partial<NativeAuthPlugin> }
}

/**
 * The plugin, if this build has it.
 *
 * Checked method by method rather than by asking whether the object exists, because the failure
 * this guards against is real and specific: a shell whose web assets are newer than its Swift.
 * `cap sync` copies the web build into the app, and nothing makes the two halves the same age --
 * an older app with today's bundle would offer the buttons and then call a function that is not
 * there. See docs/IOS.md, "Two commands, every time".
 */
function plugin(): NativeAuthPlugin | null {
  if (!isNativeApp()) return null
  const found = (globalThis as { Capacitor?: CapacitorWithPlugins }).Capacitor?.Plugins?.NativeAuth
  if (typeof found?.signInWithApple !== 'function') return null
  if (typeof found.signInWithBrowser !== 'function') return null
  return found as NativeAuthPlugin
}

/** Whether the shell can offer the provider buttons at all. False in a browser, by design. */
export function nativeSsoAvailable(): boolean {
  return plugin() !== null
}

/**
 * How a native sign-in ended.
 *
 * `reason` is one of the tags the web flow puts in `?signin=`, so `ssoProblem()` already turns
 * every one of them into a sentence in fifty-one languages. `cancelled` is in that vocabulary and
 * is what a dismissed sheet reports, which the dialog shows as nothing at all.
 */
export type NativeSignIn = { readonly ok: true } | { readonly ok: false; readonly reason: string }

const FAILED: NativeSignIn = { ok: false, reason: 'failed' }

async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>
}

/**
 * Keeps the token a sign-in came back with, or says the sign-in did not really happen.
 *
 * A shell holding no token is signed in by nothing -- there is no cookie to fall back on -- so a
 * 200 with no token in it has to be reported rather than believed, the same way `verifyCode`
 * treats the same shape.
 */
async function keep(response: Response): Promise<NativeSignIn> {
  if (!response.ok) {
    const body = await jsonOf(response)
    return { ok: false, reason: typeof body.error === 'string' ? body.error : 'failed' }
  }
  const body = await jsonOf(response)
  if (typeof body.token !== 'string' || body.token === '') return FAILED
  rememberToken(body.token)
  return { ok: true }
}

/** SHA-256 hex, which is what the server expects to find echoed inside Apple's token. */
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Sign in with Apple, natively.
 *
 * The nonce is the server's, hashed before Apple sees it: what travels is not what unlocks. A
 * client-chosen nonce would prove only that the client agrees with itself.
 */
export async function appleNatively(): Promise<NativeSignIn> {
  const native = plugin()
  if (native === null) return FAILED
  try {
    const issued = await jsonOf(await apiFetch('auth/native/nonce', { method: 'POST' }))
    if (typeof issued.nonce !== 'string' || issued.nonce === '') return FAILED

    const credential = await native.signInWithApple({ nonceHash: await sha256Hex(issued.nonce) })
    if (typeof credential.identityToken !== 'string' || credential.identityToken === '') {
      return FAILED
    }

    return await keep(
      await apiFetch('auth/native/apple', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identityToken: credential.identityToken, nonce: issued.nonce }),
      }),
    )
  } catch (failure: unknown) {
    // A dismissed sheet arrives here as a rejection, and it is the common case rather than a
    // fault: somebody looked at Apple's sheet and changed their mind.
    return { ok: false, reason: cancelled(failure) ? 'cancelled' : 'failed' }
  }
}

/**
 * Sign in with Google, in a browser outside the app.
 *
 * `?native=1` is what makes the server's callback hand back a code on our own URL scheme instead
 * of setting a cookie on a page nobody will see.
 */
export async function googleNatively(): Promise<NativeSignIn> {
  const native = plugin()
  if (native === null) return FAILED
  try {
    const ended = await native.signInWithBrowser({
      url: startUrlFor('google'),
      scheme: CALLBACK_SCHEME,
    })
    if (typeof ended.url !== 'string') return FAILED

    const returned = new URL(ended.url)
    const error = returned.searchParams.get('error')
    if (error !== null && error !== '') return { ok: false, reason: error }
    const code = returned.searchParams.get('code')
    if (code === null || code === '') return FAILED

    return await keep(
      await apiFetch('auth/native/exchange', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      }),
    )
  } catch (failure: unknown) {
    return { ok: false, reason: cancelled(failure) ? 'cancelled' : 'failed' }
  }
}

/** The scheme the session watches for, which must match `NATIVE_CALLBACK` on the server. */
const CALLBACK_SCHEME = 'blinkered'

/**
 * Where a browser session starts, as an absolute URL.
 *
 * Absolute because this one is handed to iOS rather than to the WebView: a root-relative path
 * would be resolved against `capacitor://localhost` by the very code that is trying to get out of
 * it. This is the one place `sso.ts`'s root-relative `startUrl` cannot be used, and the shape of
 * that mistake is the whole reason this module exists.
 */
function startUrlFor(provider: 'apple' | 'google'): string {
  // `NATIVE_API_ORIGIN` rather than a second constant, so a shell cannot be pointed at two hosts.
  // This is the one request the WebView does not make, because iOS makes it.
  return new URL(`/v1/auth/${provider}?native=1`, NATIVE_API_ORIGIN).toString()
}

/** Whether a rejection is somebody closing a sheet rather than something going wrong. */
function cancelled(failure: unknown): boolean {
  const message = failure instanceof Error ? failure.message : String(failure)
  // Both halves report it in their own words: `ASAuthorizationError.canceled` comes back as
  // "canceled", and `ASWebAuthenticationSessionError.canceledLogin` as "cancelled".
  return /cancel/i.test(message)
}
