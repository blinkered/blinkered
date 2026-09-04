import { randomBytes } from 'node:crypto'
import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
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
import type { AuthStore } from './types.js'
import { generateUsername } from './usernames.js'

/** The cookie the session travels in. Named once, because three places have to agree about it. */
export const SESSION_COOKIE = 'blinkered_session'

/** How long a browser session lasts. Long, because signing in again is the friction it removes. */
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

/** Tries before giving up on finding an unused generated name. Ten million names; two is plenty. */
const USERNAME_TRIES = 5

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

export interface AuthDeps {
  readonly store: AuthStore
  readonly mailer: Mailer
  /** Injected so a test can move it, and so expiry is decided once per request rather than twice. */
  readonly now?: () => Date
  /** False in development over plain HTTP, where a `Secure` cookie is never sent back. */
  readonly secureCookies?: boolean
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
    await deps.store.insertCode({
      id: newId(),
      email,
      codeHash: hashCode(code),
      expiresAt: codeExpiry(now),
    })
    await deps.mailer.send({ to: email, code, locale })
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

    const userId = (await deps.store.userIdForEmail(email)) ?? (await createAccount(deps, email))
    if (userId === null) return context.json({ error: 'no-username' }, 503)

    const { token, hash } = newSessionToken()
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS)
    await deps.store.createSession({ id: hash, userId, kind: 'cookie', expiresAt })

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

  return routes
}

/**
 * Who is asking, from the cookie they carried.
 *
 * Null covers every way of not being signed in — no cookie, an unknown one, an expired one, a
 * revoked one, a deleted account — because a caller can do nothing useful with the distinction
 * and telling them apart is how a 401 turns into a description of somebody else's session.
 */
export async function currentUser(
  deps: AuthDeps,
  context: { req: { header: (name: string) => string | undefined } },
): Promise<{ userId: string; username: string } | null> {
  const token = getCookie(context as never, SESSION_COOKIE)
  if (token === undefined || token === '') return null
  const clock = deps.now ?? ((): Date => new Date())
  return deps.store.findSession(hashSessionToken(token), clock())
}

/**
 * Makes an account, retrying past a name that is already taken.
 *
 * The retry is against the unique index rather than a lookup, because a check followed by an
 * insert is a race and the index is not. Ten million names make this loop run once.
 */
async function createAccount(deps: AuthDeps, email: string): Promise<string | null> {
  for (let attempt = 0; attempt < USERNAME_TRIES; attempt += 1) {
    const id = await deps.store.createUser({
      id: newId(),
      email,
      username: generateUsername(),
    })
    if (id !== null) return id
  }
  return null
}
