import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * The two secrets sign-in deals in, and they are hashed differently on purpose.
 *
 * A **login code** is six digits. That is a million possibilities, which a laptop enumerates in
 * no time at all, so the only thing standing between a leaked `login_codes` table and every
 * account in it is how expensive one guess is. Hence scrypt: a million guesses against a scrypt
 * hash costs days rather than seconds, and the code has expired long before that.
 *
 * A **session token** is 256 bits of randomness. Nothing enumerates that, whatever the hash
 * costs, so a slow KDF there would buy nothing and would be paid on every single request that
 * carries a cookie. Hence SHA-256.
 *
 * Both are hashed rather than stored. A leaked table should not be a leaked login, which is what
 * `sessions.id` already says it is for.
 */

/** Six digits. Short enough to read off a phone and type, which is the whole reason for it. */
const CODE_DIGITS = 6

/**
 * scrypt's cost. 2^15 is a few tens of milliseconds here, which nobody notices once per sign-in
 * and which multiplies by a million for somebody working through the keyspace.
 */
const SCRYPT_COST = 32_768
const SCRYPT_BLOCK = 8
const SCRYPT_KEY_BYTES = 32
const SALT_BYTES = 16
/**
 * scrypt needs `128 * N * r` bytes, which at these parameters is exactly 32MiB — and exactly
 * Node's default ceiling, which the check rejects rather than allows. Raised deliberately rather
 * than solved by halving the cost, since the cost is the entire defence for a six-digit secret.
 */
const SCRYPT_MEMORY = 64 * 1024 * 1024

/**
 * A fresh login code, uniformly distributed.
 *
 * `randomInt` rather than `randomBytes` reduced into range: taking a byte modulo ten makes the
 * low digits likelier than the high ones, which is the classic way to quietly lose entropy in
 * exactly the place it is load-bearing.
 */
export function newCode(): string {
  return String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, '0')
}

/** What a code looks like, checked before anything expensive happens to it. */
export function looksLikeCode(value: string): boolean {
  return new RegExp(`^\\d{${String(CODE_DIGITS)}}$`).test(value)
}

/** Hashes a login code for storage: `<salt hex>:<derived hex>`, self-describing and one column. */
export function hashCode(code: string): string {
  const salt = randomBytes(SALT_BYTES)
  const derived = scryptSync(code, salt, SCRYPT_KEY_BYTES, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK,
    maxmem: SCRYPT_MEMORY,
  })
  return `${salt.toString('hex')}:${derived.toString('hex')}`
}

/**
 * Whether a code matches what was stored, in constant time.
 *
 * A malformed stored value answers no rather than throwing. The caller is a login route and the
 * honest response to a row it cannot read is a failed sign-in, not a 500 that tells whoever is
 * poking at it that they found something.
 */
export function codeMatches(code: string, stored: string): boolean {
  const [salt, expected] = stored.split(':')
  if (salt === undefined || expected === undefined) return false
  // No try/catch, because nothing here throws and a catch that cannot fire is a lie about the
  // code rather than a safety net. `Buffer.from(x, 'hex')` never throws — it drops whatever is
  // not hex and hands back what is left, possibly nothing — and the scrypt parameters are
  // constants. Garbage in the column therefore derives a key that simply does not match, and
  // the length check below turns that into `false` on the one path there is.
  const derived = scryptSync(code, Buffer.from(salt, 'hex'), SCRYPT_KEY_BYTES, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK,
    maxmem: SCRYPT_MEMORY,
  })
  const wanted = Buffer.from(expected, 'hex')
  // `timingSafeEqual` throws on a length mismatch, which would itself be a timing signal.
  return wanted.length === derived.length && timingSafeEqual(wanted, derived)
}

/**
 * A session token, and the hash the database stores for it.
 *
 * Returned together and only here, so there is no arrangement in which a caller stores the token
 * by mistake. The token goes to the client once and is never readable again.
 */
export function newSessionToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashSessionToken(token) }
}

/** SHA-256, for the reason at the top of this file. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
