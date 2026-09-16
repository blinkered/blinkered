import type { GameToKeep } from './account.js'

/**
 * Finished games waiting to reach the server.
 *
 * `scores.ts` has always kept every finished game on the device, and that is not this: that store
 * is the guest leaderboard and the personal history, and it is keyed by nothing. This one is a
 * work queue. A game enters it when it is finished by somebody signed in, and leaves it when the
 * server confirms it is stored.
 *
 * Before this, the upload was one attempt at the moment the game ended, and `App.tsx` said as
 * much: "Nothing is shown if this fails. The game is in `localStorage` either way." Which was
 * true, and left the game on the device forever, because nothing ever tried again.
 *
 * **Every entry carries a key the server dedupes on.** A retry whose response was lost is
 * indistinguishable from a second attempt, so without one the choice is between a duplicate row
 * and a guess from the timestamp. See `games.client_key`.
 *
 * **And every entry carries the account it belongs to.** One device can be signed in as two
 * people over its life, and a queue drained without checking would post the first person's games
 * to the second person's account. Filtering on the owner is what prevents that; clearing the
 * queue on sign-out would also prevent it, and would throw away games that are nobody's to
 * throw away.
 */

const KEY = 'blinkered.pending-games.v1'

/**
 * How many games may wait at once.
 *
 * Smaller than `scores.ts`'s 500, because these hold the whole submission -- every board and
 * every word -- rather than a summary, and `localStorage` is a few megabytes in total. Somebody
 * would have to finish two hundred games without ever regaining a connection to reach it, and at
 * that point dropping the oldest is the only option that keeps the store readable.
 */
const KEEP = 200

export interface PendingGame {
  /** The idempotency key. Generated here, sent as `clientKey`, never interpreted by the server. */
  readonly key: string
  /** Whose game it is. Checked before upload, so a queue cannot cross accounts. */
  readonly userId: string
  readonly game: GameToKeep
  /** When it was queued, so the oldest can be dropped if the queue ever fills. */
  readonly at: number
}

/**
 * A key for one game: sixteen random bytes, hex.
 *
 * `getRandomValues` rather than `randomUUID`, which is the same randomness in a nicer wrapper but
 * is only defined in a secure context. The site is HTTPS and the shell's `capacitor://localhost`
 * counts as one too, so `randomUUID` would in fact work -- but it would work for a reason worth
 * checking, and this version has no such reason to be wrong about.
 */
export function newKey(): string {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Adds a game to the queue and hands back the entry, whose key the caller needs. */
export function enqueue(userId: string, game: GameToKeep): PendingGame {
  const entry: PendingGame = { key: newKey(), userId, game, at: Date.now() }
  const all = [...queued(), entry]
  // Oldest first, so what gets dropped when the queue is full is the game least likely to still
  // matter to anybody.
  write(all.length <= KEEP ? all : all.slice(all.length - KEEP))
  return entry
}

/** Everything still waiting, oldest first. Empty when the store is unreadable. */
export function queued(): readonly PendingGame[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isPending)
  } catch {
    // A corrupt or unavailable store means nothing to upload, not a broken game.
    return []
  }
}

/** What this account has waiting. The only thing a drain is allowed to send. */
export function queuedFor(userId: string): readonly PendingGame[] {
  return queued().filter((entry) => entry.userId === userId)
}

/**
 * Drops one entry, by key.
 *
 * Called when the server has confirmed the game is stored, and also when it has refused it for
 * good: a game the server calls `bad-game` will be refused identically forever, and leaving it at
 * the head of the queue would block every game behind it. See `drainGames`.
 */
export function settle(key: string): void {
  write(queued().filter((entry) => entry.key !== key))
}

function write(all: readonly PendingGame[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Private browsing, blocked storage, or a quota reached. The game is still in `scores.ts`
    // and still on screen; what is lost is the upload, which is the thing this file is about,
    // so there is nothing better to do here than carry on.
  }
}

/**
 * Whether a parsed blob is a queue entry.
 *
 * The key, the owner and the timestamp are checked because this code reads them. `game` is
 * checked only for being an object, deliberately: the server parses and refuses the submission
 * itself, with better messages than anything here could give, and restating that shape would be a
 * second definition of what a game is. A blob that is not a game comes back `bad-game` and is
 * dropped.
 */
function isPending(value: unknown): value is PendingGame {
  if (typeof value !== 'object' || value === null) return false
  const said = value as Record<string, unknown>
  return (
    typeof said.key === 'string' &&
    said.key.length > 0 &&
    typeof said.userId === 'string' &&
    said.userId.length > 0 &&
    typeof said.at === 'number' &&
    typeof said.game === 'object' &&
    said.game !== null
  )
}
