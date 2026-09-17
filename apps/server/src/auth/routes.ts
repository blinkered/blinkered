import { randomBytes } from 'node:crypto'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Mailer } from './mail.js'
import {
  codeExpiry,
  looksLikeEmail,
  normalizeEmail,
  tooManyCodes,
  verifyCode,
  windowStart,
} from './policy.js'
import {
  codeMatches,
  hashCode,
  hashSessionToken,
  looksLikeCode,
  newCode,
  newSessionToken,
} from './secrets.js'
import { OidcError, authorizeUrl } from './oidc.js'
import type { OidcClient, OidcIdentity, OidcProvider } from './oidc.js'
import type { AuthStore, NewIdentity, Profile, Provider } from './types.js'
import { generateUsername } from './usernames.js'

/** The cookie the session travels in. Named once, because three places have to agree about it. */
export const SESSION_COOKIE = 'blinkered_session'

/** How long a browser session lasts. Long, because signing in again is the friction it removes. */
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000
/**
 * How long a native session lasts, and why it is not thirty days.
 *
 * `schema.ts` has said since accounts arrived that the two kinds "expire differently"; this is
 * that sentence becoming a number. A browser tab is one of many places somebody is signed in and
 * thirty days is generous there. An installed app is the only place, it is on a device with a
 * passcode, and the product commitment is that a signed-in player **stays** signed in through
 * however long they are offline -- which is time that cannot be spent refreshing.
 *
 * Refreshed on use, so an active player never reaches it. Revocable through `revoked_at`, which
 * is what makes a long life acceptable rather than merely convenient: the remedy for a lost
 * phone is signing that session out, not waiting for it to lapse.
 */
const BEARER_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000

/**
 * Half of `BEARER_LIFETIME_MS`. Past this, a request extends the session.
 *
 * Refreshing on every request would be a write on every authenticated call for a value that
 * moves by seconds. Half the lifetime means at most one extension per six months of use, and an
 * app opened even once a year never lapses.
 */
const BEARER_REFRESH_AFTER_MS = BEARER_LIFETIME_MS / 2

/** Tries before giving up on finding an unused generated name. Ten million names; two is plenty. */
const USERNAME_TRIES = 5

/** How long somebody has to get through Apple's sheet. Generous for a person, short for a token. */
const HANDSHAKE_SECONDS = 10 * 60

/**
 * Where a native Google sign-in comes back to, and why it is a scheme rather than a URL.
 *
 * `ASWebAuthenticationSession` runs the handshake in a real browser outside the app -- which is
 * the whole point, because Google refuses an embedded WebView and app-bound domains refuses the
 * navigation -- and it ends when the browser is sent to a URL with this scheme. iOS hands that
 * URL to the app and closes the sheet. Nothing on the web ever sees it.
 */
const NATIVE_CALLBACK = 'blinkered://auth'

/**
 * A minute, for the code in that URL.
 *
 * It stands in for the session token, which has no business being in a URL at all: this is worth
 * one exchange inside a minute, where the token it is traded for is worth a year. The exchange is
 * an ordinary POST from the app over TLS, which is where a year-long credential belongs.
 */
const HANDOFF_SECONDS = 60

/**
 * A request body, or an empty one.
 *
 * Typed as unknown fields rather than as the shape the route wants, because the body is whatever
 * somebody posted. Declaring it as the wanted shape would make `body.email` a string as far as
 * the compiler is concerned, and it is a string only if the sender felt like sending one.
 */
async function bodyOf(request: { json: <T>() => Promise<T> }): Promise<Record<string, unknown>> {
  return request.json<Record<string, unknown>>().catch(() => ({}))
}

/** Row ids. Random rather than sequential, so nothing about the table is inferable from one. */
function newId(): string {
  return randomBytes(16).toString('base64url')
}

/**
 * What it takes to answer "who is this", and nothing more.
 *
 * Its own interface because the account routes need exactly this and none of the rest: they have
 * no use for a mailer, and a test of the profile screen should not have to invent one. `AuthDeps`
 * extends it rather than repeating it, so there is one definition of where a session comes from.
 */
export interface SessionDeps {
  readonly store: Pick<AuthStore, 'findSession' | 'touchBearerSession'>
  /** Injected so a test can move it, and so expiry is decided once per request rather than twice. */
  readonly now?: () => Date
}

export interface AuthDeps extends SessionDeps {
  readonly store: AuthStore
  readonly mailer: Mailer
  /** False in development over plain HTTP, where a `Secure` cookie is never sent back. */
  readonly secureCookies?: boolean
  /**
   * The third-party providers this deployment has credentials for, which on a laptop is none.
   * A provider that is absent here is not mounted and answers 501, exactly as both did before
   * either was built.
   */
  readonly oidc?: readonly { readonly provider: OidcProvider; readonly client: OidcClient }[]
  /**
   * Apple, for a token the native app got from the operating system rather than from a redirect.
   *
   * A client rather than a provider entry, because nothing about the authorize half applies: the
   * app never visits an authorize URL and there is no code to exchange. What is left is checking
   * a signed token, and the only thing that differs from the web is the audience -- see
   * `appleNativeProvider`. Absent on a deployment with no Apple key, exactly as `oidc` is, and
   * the route answers 501 rather than 404 for the same reason.
   */
  readonly appleNative?: OidcClient
}

/**
 * Signing in with a six-digit code.
 *
 * Two routes and one rule running through both: **the answer never depends on whether the
 * address has an account.** Requesting a code says the same thing for a stranger as for a member,
 * and a failed verification says the same thing for a wrong code as for an address that was never
 * sent one. Anything else turns sign-in into a membership oracle, which is worth more to somebody
 * enumerating a leak than the accounts themselves.
 */
export function authRoutes(deps: AuthDeps): Hono {
  const clock = deps.now ?? ((): Date => new Date())
  const routes = new Hono()

  /*
   * Ask for a code.
   *
   * Always 202, whatever happened. A rate-limited address, an address with no account, and an
   * address that was just sent one are indistinguishable from here, and that is the point.
   */
  routes.post('/code', async (context) => {
    const body = await bodyOf(context.req)
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const locale = typeof body.locale === 'string' ? body.locale : 'en'
    // A malformed address is the one thing worth saying out loud: nobody is enumerating with it,
    // and a person who typed their address wrong deserves to be told rather than left waiting.
    if (!looksLikeEmail(email)) return context.json({ error: 'bad-email' }, 400)

    const now = clock()
    const issued = await deps.store.countCodesSince(email, windowStart(now))
    if (tooManyCodes(issued)) return context.body(null, 202)

    const code = newCode()
    const id = newId()
    await deps.store.insertCode({ id, email, codeHash: hashCode(code), expiresAt: codeExpiry(now) })
    try {
      await deps.mailer.send({ to: email, code, locale })
    } catch (failure) {
      // Undo the row. It is written first so that a code can never be in somebody's inbox
      // without being in the table, and the cost of that order is this: a send that fails would
      // otherwise leave a live code nobody has, and spend a slot against the rate limit. Three
      // of those in a quarter of an hour lock an address out of a relay that has since been
      // fixed, which is exactly what happened the day Google started refusing our EHLO.
      await deps.store.deleteCode(id)
      throw failure
    }
    return context.body(null, 202)
  })

  /*
   * Spend a code, and come back signed in.
   *
   * The account is created here when there is not one, with a generated username, so what comes
   * back is always a session rather than sometimes a session and sometimes a half-finished
   * sign-up the client has to know how to continue.
   */
  routes.post('/code/verify', async (context) => {
    const body = await bodyOf(context.req)
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    if (!looksLikeEmail(email) || !looksLikeCode(code)) {
      return context.json({ error: 'bad-code' }, 400)
    }

    const now = clock()
    const stored = await deps.store.latestCode(email)
    // No code for this address answers exactly as a wrong code does. Saying "never asked" here
    // would make this endpoint report whether an address has been used.
    if (stored === null) return context.json({ error: 'bad-code' }, 401)

    const verdict = verifyCode(stored, code, now, codeMatches)
    if (verdict !== 'ok') {
      // A wrong guess still costs an attempt; a dead code is left alone, since counting past the
      // limit changes nothing and writes on every request somebody cares to send.
      if (verdict === 'wrong') await deps.store.recordAttempt(stored.id)
      return context.json({ error: 'bad-code' }, 401)
    }

    // Spent before the account work, so a failure after this point cannot leave a live code
    // behind. A person who has to ask for another one is a much smaller problem than a code that
    // survives being used.
    await deps.store.consumeCode(stored.id, now)

    const identity: NewIdentity = {
      provider: 'email',
      providerAccountId: email,
      email,
      // The whole point of the flow that got here: the address answered.
      emailVerified: true,
    }
    // Any provider that has verified this address, not just a previous code sign-in. Somebody
    // who arrived through Apple first and types the same address here is the same person, and
    // the order they pressed the buttons in should not decide whether they get one account.
    const userId =
      (await deps.store.userIdForVerifiedEmail(email)) ?? (await createAccount(deps, identity))
    if (userId === null) return context.json({ error: 'no-username' }, 503)

    const { token, hash } = newSessionToken()

    /*
     * A token in the body for the native shell, a cookie for a browser.
     *
     * The app cannot use a cookie at all: it is served from `capacitor://localhost`, so a
     * `SameSite=Lax` cookie scoped to `playblinkered.com` is cross-site and never sent, and
     * WKWebView's third-party cookie policy is against it regardless. `schema.ts` has always had
     * a `kind` column saying `cookie` on the web and `bearer` in the native shell; this is the
     * first thing to write `bearer` into it.
     *
     * The client asks, rather than the server sniffing a user agent. A browser that asked for a
     * token would get one and be no worse off -- it is the same credential -- and a header-based
     * guess would be one more thing to be wrong about at the only moment that matters.
     *
     * The token is returned **once** and never again. It is stored hashed, so there is nothing to
     * re-read: a client that loses it signs in again.
     */
    const wantsToken = body.native === true
    const expiresAt = new Date(
      now.getTime() + (wantsToken ? BEARER_LIFETIME_MS : SESSION_LIFETIME_MS),
    )
    await deps.store.createSession({
      id: hash,
      userId,
      kind: wantsToken ? 'bearer' : 'cookie',
      expiresAt,
    })

    if (wantsToken) return context.json({ userId, token, expiresAt: expiresAt.toISOString() })

    setCookie(context, SESSION_COOKIE, token, {
      httpOnly: true,
      // Development serves plain HTTP behind Caddy, and a Secure cookie there is a cookie the
      // browser accepts and never sends back, which looks exactly like a broken session.
      secure: deps.secureCookies !== false,
      sameSite: 'Lax',
      path: '/',
      expires: expiresAt,
    })
    return context.json({ userId })
  })

  /*
   * Sign out, by killing the credential rather than by forgetting it.
   *
   * Dropping the cookie client-side would look identical from the browser and would leave the
   * token working for thirty days, which matters exactly where signing out matters: a shared
   * machine, or a session somebody has reason to think was copied.
   *
   * 204 whatever was presented. No cookie, an unknown one, and one already revoked are all
   * "you are signed out now", and the cookie is cleared in every case so a browser holding a
   * token the server has never heard of stops sending it.
   */
  routes.post('/signout', async (context) => {
    const token = getCookie(context, SESSION_COOKIE)
    if (token !== undefined && token !== '') {
      await deps.store.revokeSession(hashSessionToken(token), clock())
    }
    deleteCookie(context, SESSION_COOKIE, { path: '/', secure: deps.secureCookies !== false })
    return context.body(null, 204)
  })

  /*
   * ---------- the native app's three routes ----------
   *
   * The shell cannot do what a browser does. Its origin is `capacitor://localhost`, so a cookie
   * scoped to playblinkered.com is cross-site and never sent; app-bound domains stops it
   * navigating to a provider at all; and Google refuses OAuth inside an embedded WebView on
   * principle. So the app does the handshake **outside** itself and brings back something these
   * routes will trade for a bearer token.
   *
   * Apple and Google arrive by different doors, which is not a symmetry worth forcing:
   *
   * - **Apple** is `ASAuthorizationAppleIDProvider`, a system sheet with no browser in it at
   *   all. It hands the app a signed identity token, which the app posts here. There is no code,
   *   no exchange and no client secret on this path -- only the check that the token is real,
   *   which is the same check the web callback ends with.
   * - **Google** is `ASWebAuthenticationSession`, a real Safari outside the app. It runs the
   *   ordinary web flow, so the existing routes do all of it; what changes is the last step,
   *   where the callback hands back a one-minute code instead of setting a cookie.
   */

  /*
   * A nonce, before the app asks Apple for anything.
   *
   * This is what makes a captured identity token useless. Apple echoes the nonce inside the
   * token it signs, and these routes will only accept a nonce this server issued and has not
   * already spent -- so a token lifted off the wire, which is otherwise valid for ten minutes,
   * cannot be presented a second time.
   *
   * Issued rather than chosen by the app. A client-chosen nonce proves only that the client is
   * consistent with itself, which is not a property anybody needs.
   *
   * The row is keyed on a hash of the nonce, and on a *different* hash from the one the app puts
   * in front of Apple. Both are derived from the same secret, and separating them means the value
   * travelling inside the token is not also the key to the row that authorises it.
   */
  routes.post('/native/nonce', async (context) => {
    const now = clock()
    const { token: nonce } = await issueHandshake(deps, {
      kind: 'nonce',
      seconds: HANDSHAKE_SECONDS,
      now,
    })
    return context.json({ nonce })
  })

  /*
   * A native Apple credential, traded for a session.
   *
   * Every failure is a 401 with a short tag, and the tags are the provider's own reasons from
   * `OidcError` -- the same vocabulary the web callback puts in `?signin=`, so the dialog already
   * knows how to say them.
   */
  routes.post('/native/apple', async (context) => {
    const verifier = deps.appleNative
    // 501, not 404: the route exists and the deployment has no Apple key. See the stubs below.
    if (verifier === undefined) return context.json({ error: 'not-implemented' }, 501)

    const body = await bodyOf(context.req)
    const identityToken = typeof body.identityToken === 'string' ? body.identityToken : ''
    const nonce = typeof body.nonce === 'string' ? body.nonce : ''
    if (identityToken === '' || nonce === '') return context.json({ error: 'bad-request' }, 400)

    const now = clock()
    // Spent first, so a token that fails verification still costs the nonce. A nonce that
    // survived a failed attempt would be a nonce somebody can grind against.
    const spent = await deps.store.consumeHandshake(handshakeId('nonce', nonce), 'nonce', now)
    if (spent === null) return context.json({ error: 'expired' }, 401)

    const identity = await verifier
      .verify(identityToken, appleNonceClaim(nonce), now)
      .catch((failure: unknown) => {
        // As in the web callback: a provider's refusal is an answer, and anything else -- a dead
        // network, a database down -- keeps going up rather than being reported as a bad token.
        if (failure instanceof OidcError) return failure
        throw failure
      })
    if (identity instanceof OidcError) return context.json({ error: identity.reason }, 401)

    const userId = await accountFor(deps, 'apple', identity)
    if (userId === null) return context.json({ error: 'no-username' }, 503)
    return context.json(await bearerSession(deps, userId, now))
  })

  /*
   * The code from a native Google callback, traded for a session.
   *
   * Nothing is verified here beyond the code itself, and nothing needs to be: the identity was
   * checked in the callback that minted it, against the same signed token the web flow checks.
   * This route only proves that whoever is asking is holding the one-minute secret that callback
   * handed to the app.
   */
  routes.post('/native/exchange', async (context) => {
    const body = await bodyOf(context.req)
    const code = typeof body.code === 'string' ? body.code : ''
    if (code === '') return context.json({ error: 'bad-request' }, 400)

    const now = clock()
    const spent = await deps.store.consumeHandshake(handshakeId('handoff', code), 'handoff', now)
    // Unknown, expired, already spent, or -- impossible through the store, but the type allows
    // it -- a row with no account on it. One answer for all of them, and no hint which.
    if (spent?.userId === undefined || spent.userId === null) {
      return context.json({ error: 'expired' }, 401)
    }
    return context.json(await bearerSession(deps, spent.userId, now))
  })

  /*
   * Sign in with Apple and Sign in with Google.
   *
   * One implementation, because they are one protocol. The differences that reach this far are
   * two, and both come from `response_mode`:
   *
   * **Apple's callback is a POST.** Asking Apple for any scope at all requires
   * `response_mode=form_post`, so appleid.apple.com submits a form to us rather than redirecting
   * the browser back with a query string. Google does the ordinary thing.
   *
   * **Which means the cookies differ.** A `Lax` cookie is sent on a cross-site *navigation* and
   * not on a cross-site *POST*, so Apple's state cookie has to be `SameSite=None` or it is
   * simply absent when the callback arrives -- and the failure reads as a forged state, which
   * sends you debugging state generation rather than cookie attributes. Google's callback is a
   * navigation, so it keeps `Lax`, which is the stricter setting and the one to prefer wherever
   * the flow allows it.
   */
  const mounted = new Set<string>()
  for (const entry of deps.oidc ?? []) {
    mounted.add(entry.provider.name)
    mountProvider(routes, deps, entry, clock)
  }

  /*
   * What is still a stub, and why it is a stub rather than absent.
   *
   * 501 rather than 404, because the difference is the whole point: the client's path is real --
   * a button, a redirect, a failure it can show -- and only the provider is missing. A 404 would
   * be indistinguishable from a routing mistake, which is the bug this is most likely to be
   * confused with. A provider joins this list whenever the deployment has no credentials for it,
   * which is the ordinary state of a laptop.
   */
  for (const provider of ['apple', 'google'] as const) {
    if (mounted.has(provider)) continue
    routes.get(`/${provider}`, (context) =>
      context.json({ error: 'not-implemented', provider }, 501),
    )
  }

  return routes
}

/**
 * Who is asking, from the cookie they carried.
 *
 * Null covers every way of not being signed in — no cookie, an unknown one, an expired one, a
 * revoked one, a deleted account — because a caller can do nothing useful with the distinction
 * and telling them apart is how a 401 turns into a description of somebody else's session.
 */
/**
 * The token this request is presenting, from either place a client can put one.
 *
 * The cookie is the browser, and it is tried first because it is the overwhelming majority of
 * traffic. `Authorization: Bearer` is the native shell, which cannot use a cookie at all: the app
 * is served from `capacitor://localhost`, so a `SameSite=Lax` cookie for `playblinkered.com` is
 * cross-site and never sent, and WKWebView's third-party cookie policy is against it besides.
 *
 * One header, parsed strictly. A scheme that is not `Bearer` and an empty token both read as no
 * credential rather than as a bad one, because the caller's next move is identical either way.
 */
function presentedToken(context: {
  req: { header: (name: string) => string | undefined }
}): string | null {
  const cookie = getCookie(context as never, SESSION_COOKIE)
  if (cookie !== undefined && cookie !== '') return cookie
  const header = context.req.header('authorization')
  if (header === undefined) return null
  const [scheme, value] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer') return null
  return value === undefined || value === '' ? null : value
}

export async function currentUser(
  deps: SessionDeps,
  context: { req: { header: (name: string) => string | undefined } },
): Promise<Profile | null> {
  const token = presentedToken(context)
  if (token === null) return null
  const clock = deps.now ?? ((): Date => new Date())
  const now = clock()
  const id = hashSessionToken(token)
  const found = await deps.store.findSession(id, now)
  if (found === null) return null
  /*
   * Extend a native session that is past halfway, so an app in regular use never lapses.
   *
   * One conditional statement rather than a read and a decision here: the store updates only a
   * `bearer` row whose expiry is already inside the refresh window, so this is a no-op for every
   * cookie session and for every bearer session touched in the last six months. A cookie session
   * must not be extended by use at all -- thirty days from sign-in is the rule there, and
   * sliding it would quietly make every browser session permanent.
   *
   * Not awaited, and not fatal: this is bookkeeping on the way to answering a request that is
   * already authorised. A failed write costs the session six months of remaining life, which is
   * a far better outcome than costing this request its answer.
   */
  void deps.store.touchBearerSession(id, {
    ifExpiringBefore: new Date(now.getTime() + BEARER_REFRESH_AFTER_MS),
    until: new Date(now.getTime() + BEARER_LIFETIME_MS),
  })
  return found
}

/**
 * Makes an account, retrying past a name that is already taken.
 *
 * The retry is against the unique index rather than a lookup, because a check followed by an
 * insert is a race and the index is not. Ten million names make this loop run once.
 */

/**
 * The two routes one provider needs.
 *
 * Written once for both, with the shape of the callback taken from the provider rather than
 * branched on its name: a provider that wants a form post gets a POST callback and a
 * `SameSite=None` state cookie, and one that does not gets a GET and `Lax`. Adding a third
 * provider is a descriptor, not another copy of this.
 */
function mountProvider(
  routes: Hono,
  deps: AuthDeps,
  entry: { provider: OidcProvider; client: OidcClient },
  clock: () => Date,
): void {
  const { provider, client } = entry
  const name = provider.name
  const base = `/${name}`
  const formPost = provider.authorizeExtras?.response_mode === 'form_post'
  const stateCookie = `blinkered_${name}_state`
  const nonceCookie = `blinkered_${name}_nonce`
  /**
   * Whether this handshake was started by the app rather than by a browser.
   *
   * A cookie rather than a query parameter on the callback, because the callback's parameters are
   * the provider's and we do not get to add to them. It is set at the start, read at the end, and
   * scoped to the same path as the other two, so nothing else on the site ever sees it.
   */
  const nativeCookie = `blinkered_${name}_native`
  // Scoped to the path that reads them, so they are not sent with every request to the site.
  const attributes = {
    httpOnly: true,
    // `SameSite=None` requires `Secure`, and both providers refuse plain HTTP anyway, so there
    // is no arrangement in which this flow runs without TLS. Not a configuration question the
    // way the session cookie's is.
    secure: true,
    sameSite: formPost ? ('None' as const) : ('Lax' as const),
    path: `/v1/auth${base}`,
    // Minutes, not months. This is a handshake in progress, not a session.
    maxAge: HANDSHAKE_SECONDS,
  }

  routes.get(base, (context) => {
    const state = newId()
    const nonce = newId()
    // `?native=1` is the app saying it will be waiting on a custom scheme rather than on a page.
    if (context.req.query('native') === '1') setCookie(context, nativeCookie, '1', attributes)
    /*
     * Two values, two jobs. `state` comes back in the callback and is compared against a cookie,
     * which is what stops somebody feeding us a callback we never started. `nonce` is carried
     * inside the `id_token` the provider signs, which is what stops a token minted for a
     * different session being replayed into this one. Either alone leaves a hole the other covers.
     */
    setCookie(context, stateCookie, state, attributes)
    setCookie(context, nonceCookie, nonce, attributes)
    return context.redirect(authorizeUrl(provider, { state, nonce }), 302)
  })

  const callback = async (context: Context, sent: Record<string, unknown>): Promise<Response> => {
    const forget = (): void => {
      deleteCookie(context, stateCookie, { path: `/v1/auth${base}`, secure: true })
      deleteCookie(context, nonceCookie, { path: `/v1/auth${base}`, secure: true })
      deleteCookie(context, nativeCookie, { path: `/v1/auth${base}`, secure: true })
    }
    /*
     * Read before anything can fail, because it decides where a failure goes.
     *
     * A native flow that redirected to `/?signin=cancelled` would load the game *inside*
     * `ASWebAuthenticationSession` -- a sheet showing a playable board, with the app behind it
     * still waiting for a callback that is never coming. The scheme is what closes the sheet, so
     * both endings have to use it.
     */
    const native = getCookie(context, nativeCookie) === '1'
    /*
     * Every failure ends in a redirect rather than a status code, because the thing on the other
     * end of this request is a browser that just followed a provider: a 400 with a JSON body is
     * a blank page with some punctuation on it. The app reads `?signin=` and says something.
     */
    const failed = (reason: string): Response => {
      forget()
      return context.redirect(
        native ? `${NATIVE_CALLBACK}?error=${reason}` : `/?signin=${reason}`,
        302,
      )
    }

    const state = getCookie(context, stateCookie)
    const nonce = getCookie(context, nonceCookie)
    // Both providers report a refusal this way: Apple as `user_cancelled_authorize`, Google as
    // `access_denied`. Somebody changing their mind is not a fault and should not look like one.
    if (typeof sent.error === 'string') return failed('cancelled')
    if (state === undefined || nonce === undefined) return failed('expired')
    if (sent.state !== state) return failed('bad-state')
    // Empty counts as absent. `typeof '' === 'string'` is the reason this is spelled out: an
    // empty code would otherwise reach the exchange and come back as a provider error, reported
    // as their fault when it was a malformed callback.
    if (typeof sent.code !== 'string' || sent.code === '') return failed('bad-state')

    const now = clock()
    const identity = await client
      .exchange(sent.code, now)
      .then((token) => client.verify(token, nonce, now))
      .catch((failure: unknown) => {
        // Anything that is not the provider's fault -- a dead network, a database that is down --
        // keeps going up. Catching it into `?signin=try-again` would hide an outage behind a
        // message telling the player it is their problem.
        if (failure instanceof OidcError) return failure
        throw failure
      })
    if (identity instanceof OidcError) return failed(identity.reason)

    const userId = await accountFor(deps, name, identity)
    if (userId === null) return failed('no-username')

    /*
     * The app gets a code; a browser gets a cookie.
     *
     * The code is the whole of the native difference, and it exists so that the session token is
     * not the thing in the URL: iOS hands this URL to the app, but a URL is a URL -- it can be
     * logged, and it outlives the request. A minute-long single-use secret traded over TLS for a
     * year-long token is the same handshake with a much smaller thing left lying around.
     */
    if (native) {
      const { token: code } = await issueHandshake(deps, {
        kind: 'handoff',
        seconds: HANDOFF_SECONDS,
        now,
        userId,
      })
      forget()
      return context.redirect(`${NATIVE_CALLBACK}?code=${encodeURIComponent(code)}`, 302)
    }

    const { token, hash } = newSessionToken()
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS)
    await deps.store.createSession({ id: hash, userId, kind: 'cookie', expiresAt })
    setCookie(context, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: deps.secureCookies !== false,
      sameSite: 'Lax',
      path: '/',
      expires: expiresAt,
    })
    forget()
    return context.redirect('/?signin=ok', 302)
  }

  if (formPost) {
    routes.post(`${base}/callback`, async (context) =>
      callback(context, await context.req.parseBody().catch(() => ({}))),
    )
  } else {
    routes.get(`${base}/callback`, (context) => callback(context, context.req.query()))
  }
}

/**
 * A handshake secret, its row, and the only copy of it.
 *
 * The secret is returned to the caller and the hash is what is stored, which is the same bargain
 * `sessions` and `login_codes` make: the table is not a list of live credentials.
 */
async function issueHandshake(
  deps: AuthDeps,
  what: { kind: 'nonce' | 'handoff'; seconds: number; now: Date; userId?: string },
): Promise<{ token: string }> {
  const { token } = newSessionToken()
  await deps.store.createHandshake({
    id: handshakeId(what.kind, token),
    kind: what.kind,
    ...(what.userId === undefined ? {} : { userId: what.userId }),
    expiresAt: new Date(what.now.getTime() + what.seconds * 1000),
  })
  return { token }
}

/**
 * Which row a secret belongs to, with the kind mixed in.
 *
 * Domain separation, and it earns its keep in one specific place: the value the app shows Apple
 * is another hash of the same nonce, and that value travels inside a token other software gets to
 * see. Deriving the row id differently means seeing it is not the same as holding it.
 */
function handshakeId(kind: 'nonce' | 'handoff', secret: string): string {
  return hashSessionToken(`${kind}:${secret}`)
}

/**
 * What the app puts in front of Apple, and therefore what comes back inside the token.
 *
 * Apple echoes the request's nonce into the identity token verbatim, and the convention is to
 * send a hash rather than the value itself, so that the thing on the wire is not the thing that
 * unlocks anything. `crypto.subtle` in the WebView computes exactly this, which is why this is
 * SHA-256 hex rather than anything cleverer.
 */
function appleNonceClaim(nonce: string): string {
  return hashSessionToken(nonce)
}

/**
 * A bearer session for an account, and the body that carries it back.
 *
 * The same year and the same `kind` as the code flow's `native: true` branch, in one place, so
 * that three ways into the app cannot drift into three different session lifetimes.
 */
async function bearerSession(
  deps: AuthDeps,
  userId: string,
  now: Date,
): Promise<{ userId: string; token: string; expiresAt: string }> {
  const { token, hash } = newSessionToken()
  const expiresAt = new Date(now.getTime() + BEARER_LIFETIME_MS)
  await deps.store.createSession({ id: hash, userId, kind: 'bearer', expiresAt })
  return { userId, token, expiresAt: expiresAt.toISOString() }
}

/**
 * Which account a provider sign-in belongs to, creating or linking as needed.
 *
 * Three questions in order, and the order is the design:
 *
 * 1. **Have we seen this `sub` before?** That is the identity, so this is the common path and
 *    nothing else needs asking.
 * 2. **Does a verified address match an account that already exists?** Then it is the same
 *    person arriving by a second door, and they get the account they already had rather than an
 *    empty one with their history stranded in the first.
 * 3. Otherwise, a new account.
 *
 * Step 2 carries the only security decision in this file. Linking on an *unverified* address
 * means anyone who can assert an address can walk into the account that owns it, without ever
 * touching the inbox; `emailVerified` is Apple's statement that it checked, and it is read from
 * the signed token rather than from anything the browser sent. Relay addresses are excluded as
 * well, not because they are untrustworthy but because they are not a mailbox anybody typed: a
 * relay can be switched off, and matching on one would be matching on a forwarding rule.
 *
 * The consequence worth knowing: somebody who uses Hide My Email and later signs in with a code
 * at their real address gets two accounts, and nothing here can prevent that, because we are
 * never told the real address. The remedy is an explicit link in settings, which is not built.
 */
async function accountFor(
  deps: AuthDeps,
  provider: Provider,
  identity: OidcIdentity,
): Promise<string | null> {
  const existing = await deps.store.userIdForIdentity(provider, identity.sub)
  if (existing !== null) return existing

  const record: NewIdentity = {
    provider,
    providerAccountId: identity.sub,
    email: identity.email,
    emailVerified: identity.emailVerified,
  }

  if (identity.email !== null && identity.emailVerified && !identity.isPrivateRelay) {
    const linked = await deps.store.userIdForVerifiedEmail(identity.email)
    if (linked !== null) {
      await deps.store.linkIdentity({ id: newId(), userId: linked, identity: record })
      return linked
    }
  }

  return createAccount(deps, record)
}

async function createAccount(deps: AuthDeps, identity: NewIdentity): Promise<string | null> {
  for (let attempt = 0; attempt < USERNAME_TRIES; attempt += 1) {
    const id = await deps.store.createUser({
      id: newId(),
      username: generateUsername(),
      identity,
    })
    if (id !== null) return id
  }
  return null
}
