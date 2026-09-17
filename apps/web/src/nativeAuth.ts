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

/**
 * The bridge Capacitor injects, and the one call on it this needs.
 *
 * **Not `Capacitor.Plugins.NativeAuth`**, which is what the first version of this used and is why
 * the buttons did not appear on a phone at all. That map is built by `@capacitor/core`'s
 * `registerPlugin`, in JavaScript --- and `apps/web` deliberately has no dependency on Capacitor,
 * so in this app it is never populated. `isPluginAvailable` reads the same empty map, so it is no
 * use either. The injected bridge is what exists without the package, and `nativePromise` is the
 * call its own internals use (`CapacitorHttp`, `Console`).
 */
interface CapacitorBridge {
  readonly nativePromise?: NativeCall
}

type NativeCall = (
  plugin: string,
  method: string,
  options: Record<string, unknown>,
) => Promise<unknown>

function bridge(): NativeCall | null {
  if (!isNativeApp()) return null
  const found = (globalThis as { Capacitor?: CapacitorBridge }).Capacitor?.nativePromise
  return typeof found === 'function' ? found : null
}

/**
 * One call into the plugin, with the answer as an object.
 *
 * A missing plugin or a missing method is a rejection from the bridge rather than something
 * checkable in advance, for the same reason as above: the only registry of what exists is the one
 * `@capacitor/core` builds. So a shell older than its web assets gives a failed sign-in with a
 * message instead of a hidden button, which in a TestFlight or App Store build cannot happen --
 * both halves ship together -- and in development means "rebuild the app".
 */
async function ask(
  method: string,
  options: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const call = bridge()
  if (call === null) throw new Error('no native bridge')
  const answer = await call('NativeAuth', method, options)
  return typeof answer === 'object' && answer !== null ? (answer as Record<string, unknown>) : {}
}

/** Whether the shell can offer the provider buttons at all. False in a browser, by design. */
export function nativeSsoAvailable(): boolean {
  return bridge() !== null
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
  if (bridge() === null) return FAILED
  try {
    const issued = await jsonOf(await apiFetch('auth/native/nonce', { method: 'POST' }))
    if (typeof issued.nonce !== 'string' || issued.nonce === '') return FAILED

    const credential = await ask('signInWithApple', { nonceHash: await sha256Hex(issued.nonce) })
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
  if (bridge() === null) return FAILED
  try {
    const ended = await ask('signInWithBrowser', {
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
