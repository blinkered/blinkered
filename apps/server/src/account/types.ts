import type { Profile } from '../auth/types.js'

/**
 * Everything the account surface needs from the database, as one interface.
 *
 * Separate from `AuthStore` because the two answer different questions: that one is about
 * proving who somebody is, this one is about what they have. They are implemented by the same
 * Postgres and composed into one `Store`, and keeping them apart is what lets a test of the
 * profile routes hand over a fake with no login codes in it.
 *
 * `types.ts` for the reason `auth/types.ts` gives: the file holds no runtime code, and the
 * coverage config already excludes that name rather than needing an entry of its own.
 */

/**
 * A change to a profile, with absent meaning "leave it".
 *
 * Optional properties rather than `undefined` values, because `exactOptionalPropertyTypes` is on
 * and the distinction is the whole point of a PATCH: `{ bio: null }` clears a bio and `{}` does
 * not mention it. A route that could not express both would have no way to let somebody delete
 * the sentence they regret.
 */
export interface ProfilePatch {
  readonly username?: string
  readonly country?: string | null
  readonly uiLanguage?: string | null
  readonly gameLanguage?: string | null
  readonly bio?: string | null
}

/** A finished game, as `POST /v1/games/import` stores one. */
export interface GameRow {
  readonly id: string
  readonly userId: string
  readonly seed: number
  readonly source: string
  readonly imported: boolean
  readonly difficulty: string
  readonly language: string
  readonly canonical: boolean
  readonly n: number
  readonly speedMultiplier: number
  readonly holdTicks: number
  readonly initialFlips: number
  readonly wMin: number
  readonly minWordLength: number
  readonly wordCompleteMode: string
  readonly flipEconomy: string
  readonly chargeFullRound: boolean
  readonly wildChance: number
  readonly replaceChance: number
  readonly letters: readonly string[]
  readonly score: number
  readonly wordsCount: number
  readonly roundsPlayed: number
  readonly engineVersion: string
  readonly dictionaryVersion: string | null
  readonly startedAt: Date
  readonly finishedAt: Date
}

/** What a game found, one row each. `tiles` rather than characters, because that is what scores. */
export interface GameWordRow {
  readonly ordinal: number
  readonly word: string
  readonly tiles: number
  readonly points: number
}

/** A game as My Games lists one: enough to rank and to recognise, and nothing else. */
export interface GameSummary {
  readonly id: string
  readonly language: string
  readonly difficulty: string
  readonly canonical: boolean
  readonly imported: boolean
  readonly score: number
  readonly words: number
  readonly rounds: number
  readonly engineVersion: string
  readonly finishedAt: Date
}

export interface AccountStore {
  /**
   * Whether a normalized name already belongs to somebody.
   *
   * For the availability check while typing, and **not** for the rename itself. A check followed
   * by an update is a race, and the unique index is not: `updateProfile` returns null when it
   * loses. This one exists to tell somebody sooner, not to decide.
   */
  usernameTaken(normalized: string): Promise<boolean>
  /**
   * Applies a patch and hands back the profile as it now stands.
   *
   * Null when the username was taken, which is the index's answer rather than a lookup's. The
   * whole profile comes back rather than an acknowledgement, so the client renders what the
   * server stored instead of what it hoped it stored.
   */
  updateProfile(userId: string, patch: ProfilePatch): Promise<Profile | null>
  /** Writes a game and its words together, or neither. */
  insertGame(row: GameRow, words: readonly GameWordRow[]): Promise<void>
  /** Somebody's games, most recently finished first. */
  gamesOf(userId: string, limit: number): Promise<readonly GameSummary[]>
}
