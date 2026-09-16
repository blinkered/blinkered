import type { Account } from './account.js'

/**
 * The last account the server described, kept on this device.
 *
 * This exists because of one conflation. `GET /v1/me` answering is how the app learns who it is
 * talking to, and until now every way of that question failing came back as the same `null`:
 * signed out, refused, API not deployed, and no network at all. On the website that was a fair
 * trade, because a browser with no network has no app either. In the native shell the bundle is
 * already on the device, so "no network" is an ordinary state a player sits in for a whole game,
 * and rendering it as *signed out* is wrong in a way they would report as a bug: the session is
 * still there, the cookie or token is still valid, and the app has simply forgotten them.
 *
 * So the cache is not a performance trick. It is the difference between "you are signed out" and
 * "I could not ask", and only the server is allowed to say the first one.
 *
 * **Nothing here is authoritative.** It is read only when the server could not be reached, and a
 * definite answer always overwrites it. See `whoAmI` in `account.ts`, which is the only thing
 * that should be writing to it.
 */

const KEY = 'blinkered.account.v1'

/**
 * No expiry, deliberately.
 *
 * A session's lifetime is the server's business and it already enforces it: the credential stops
 * working, `GET /v1/me` answers 401, and `forget()` runs on that answer. An expiry here would be
 * a second, worse copy of that rule, and it would be wrong in the one direction that matters --
 * signing somebody out while they are offline, which is exactly the thing this file exists to
 * stop. Staleness is instead bounded by the next request that gets through.
 *
 * The one visible consequence: a profile edited on another device shows this device's older copy
 * until it can ask. That is a stale name for a few seconds against a spurious sign-out, and it is
 * not a close call.
 */
export function remember(account: Account): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(account))
  } catch {
    // Private browsing and blocked storage are both fine. Losing the cache costs the offline
    // player their name on screen; it does not cost them the game or the session.
  }
}

/** The last known account, or null if there has never been one or the store cannot be read. */
export function cached(): Account | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as unknown
    return isAccount(parsed) ? parsed : null
  } catch {
    // A corrupt or unavailable store means no cached identity, not a broken game.
    return null
  }
}

/**
 * Drops it, on a definite signed-out and on signing out.
 *
 * Not on a failure to reach the server, which is the whole point.
 */
export function forget(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* Nothing to do; see `remember`. */
  }
}

/**
 * Whether a parsed blob is an account.
 *
 * Checked field by field rather than trusted, because this store outlives the code that wrote
 * it: a shape from an older release, or a blob somebody pasted in by hand, has to read as "no
 * cached identity" rather than reach the renderer as a half-account. The nullable fields are
 * checked as nullable, so a missing one is a rejection rather than an `undefined` that reaches
 * a screen expecting `null`.
 */
function isAccount(value: unknown): value is Account {
  if (typeof value !== 'object' || value === null) return false
  const said = value as Record<string, unknown>
  return (
    typeof said.userId === 'string' &&
    typeof said.username === 'string' &&
    typeof said.avatarSeed === 'string' &&
    typeof said.isAdmin === 'boolean' &&
    nullableString(said.country) &&
    nullableString(said.uiLanguage) &&
    nullableString(said.gameLanguage) &&
    nullableString(said.bio)
  )
}

function nullableString(value: unknown): boolean {
  return value === null || typeof value === 'string'
}
