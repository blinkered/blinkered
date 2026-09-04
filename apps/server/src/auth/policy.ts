/**
 * The rules a login code is subject to, separated from the database that stores one.
 *
 * All of it is arithmetic over a row and a clock, so all of it is testable without a Postgres,
 * and the route that uses it does not get to invent its own idea of expired.
 */

/** How long a code is good for. Long enough to find the mail, short enough to be worth stealing. */
export const CODE_LIFETIME_MS = 10 * 60 * 1000

/**
 * Guesses before a code is dead.
 *
 * Six digits and five guesses is one chance in two hundred thousand, which is the number that
 * matters rather than the million: an attacker gets five, not one.
 */
export const MAX_ATTEMPTS = 5

/**
 * How many codes one address can ask for in a window, and how long the window is.
 *
 * The limit is per address rather than per IP, and that is not laziness. Caddy on the dev host
 * declares trusted proxies only for the Cloudflare-proxied production block, so `X-Forwarded-For`
 * arriving there is not believed and cannot carry a rate limit — see the note in
 * `values-dev.yaml`. An address is a thing we can count reliably in both environments.
 */
export const MAX_CODES_PER_WINDOW = 3
export const CODE_WINDOW_MS = 15 * 60 * 1000

/** The stored shape this file reasons about. A subset of the row, so a test needs no schema. */
export interface CodeRow {
  readonly codeHash: string
  readonly attempts: number
  readonly expiresAt: Date
  readonly consumedAt: Date | null
}

export type CodeVerdict =
  /** The code matched and has not been used, expired, or exhausted. */
  | 'ok'
  /** Wrong code, and there are guesses left. */
  | 'wrong'
  /** Right or wrong, this code is finished: expired, already used, or out of guesses. */
  | 'dead'

/**
 * Whether a submitted code opens this row.
 *
 * `dead` is returned for expiry, reuse and exhaustion alike, and the route says the same thing to
 * the client for all three. Distinguishing them is a gift to somebody working through codes: "out
 * of attempts" confirms the address is real and that they were close enough to matter.
 *
 * The order is deliberate. Everything that can be decided from the row alone is decided first, so
 * a dead row never reaches the scrypt call — which is the expensive one, and therefore the one an
 * attacker would like to make us run repeatedly.
 */
export function verifyCode(
  row: CodeRow,
  code: string,
  now: Date,
  matches: (code: string, stored: string) => boolean,
): CodeVerdict {
  if (row.consumedAt !== null) return 'dead'
  if (row.attempts >= MAX_ATTEMPTS) return 'dead'
  if (now.getTime() >= row.expiresAt.getTime()) return 'dead'
  if (!matches(code, row.codeHash)) {
    // The attempt that reaches the limit kills the code, so the caller does not have to
    // remember to check again on the next request.
    return row.attempts + 1 >= MAX_ATTEMPTS ? 'dead' : 'wrong'
  }
  return 'ok'
}

/** When a code issued now stops working. */
export function codeExpiry(now: Date): Date {
  return new Date(now.getTime() + CODE_LIFETIME_MS)
}

/** The oldest issue time still inside the rate-limiting window. */
export function windowStart(now: Date): Date {
  return new Date(now.getTime() - CODE_WINDOW_MS)
}

/**
 * Whether this address has asked for too many codes.
 *
 * Counted over issued codes rather than over failed ones, because the cost being controlled is
 * the mail: an address that can be made to receive unlimited codes is an address somebody else
 * can use us to harass.
 */
export function tooManyCodes(issuedInWindow: number): boolean {
  return issuedInWindow >= MAX_CODES_PER_WINDOW
}

/**
 * Normalizes an address for storage and comparison.
 *
 * Lower-cased and trimmed, and nothing cleverer. Stripping dots or `+tags` the way Gmail treats
 * them would be deciding that two addresses a person considers different are the same account,
 * which is a policy about somebody else's mail provider that we have no business holding.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Whether a string is worth trying to send mail to.
 *
 * Deliberately loose. The authority on whether an address exists is the mail that either arrives
 * or does not, and a strict regex here rejects valid addresses that a mail server would have
 * accepted — new TLDs, plus-addressing, apostrophes in names. This catches typing nothing, typing
 * a username, and typing a sentence.
 */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email) && email.length <= 254
}
