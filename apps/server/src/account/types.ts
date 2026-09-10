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
  readonly score: number
  readonly wordsCount: number
  readonly roundsPlayed: number
  readonly engineVersion: string
  readonly dictionaryVersion: string | null
  readonly startedAt: Date
  readonly finishedAt: Date
}

/**
 * The shape `game_detail.detail` is in, and the number in `game_detail.version`.
 *
 * Bumped whenever a field is added, removed or reinterpreted. The discipline the schema comment
 * states: a migration rewrites old documents, so there is exactly one reader.
 */
export const DETAIL_VERSION = 1

/** A word, with everything the engine already knew about it when it was found. */
export interface DetailWord {
  readonly word: string
  /** Tiles rather than characters, because that is what scores. Croatian LJ is one. */
  readonly tiles: number
  readonly points: number
  /** Which round it was found in, counting from zero. What "which words on which board" needs. */
  readonly round: number
  /** Flips it paid back. Under `fibonacci` this is the whole economy of the game. */
  readonly flips: number
  /** Ticks since the game began, which is what gives a game its pacing. */
  readonly tick: number
  /**
   * Which of its letters came from a wild, by index.
   *
   * Absent rather than empty for an ordinary word. Most words have no wilds, and an empty JSON
   * array costs bytes in every one of them to say nothing.
   */
  readonly wilds?: readonly number[]
}

/**
 * Everything about a game that nothing queries.
 *
 * `boards` is the board as it stood at the start of each round, tiles joined by a space, in tile
 * order. One per round rather than only the first, because from 0.3.0 a letter can be replaced at
 * any deal and under `spend` a completed word takes its letters off, so "which board" is really
 * "which of the several boards this game had". A space is safe as the separator: a tile face is a
 * letter or a digraph and never contains one.
 *
 * What is deliberately **not** here is an event log. Reconstructing every intermediate state
 * means full replay, which docs/ACCOUNTS.md rejected and which this does not need: the board at
 * each round boundary plus the round each word was found in answers the question at a fraction of
 * the cost.
 */
export interface GameDetail {
  readonly boards: readonly string[]
  readonly words: readonly DetailWord[]
}

/**
 * A game as My Games lists one: enough to rank and to recognise, and nothing else.
 *
 * `imported` is deliberately not here, though the column is. Where a game came from is
 * bookkeeping: it explains to us why a row is not on a board, and it says nothing to the person
 * whose row it is, who knows only that they played it. Sending it anyway would leave a field on
 * the wire that nothing renders, which is how it ends up rendered again.
 */
export interface GameSummary {
  readonly id: string
  readonly language: string
  readonly difficulty: string
  readonly canonical: boolean
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
  /** Writes a game and its detail together, or neither. */
  insertGame(row: GameRow, detail: GameDetail): Promise<void>
  /** Somebody's games, most recently finished first. */
  gamesOf(userId: string, limit: number): Promise<readonly GameSummary[]>
  /**
   * One game in full, or null.
   *
   * Scoped by owner rather than filtered afterwards, so there is no arrangement in which a
   * caller forgets: a game id is guessable in principle and this is the only route that returns
   * somebody's words.
   *
   * Null also covers a game whose detail was pruned by a retention policy that does not exist
   * yet. When it does, the summary row outlives the document by design, and a reader that
   * treated a missing document as a missing game would make the history shorter than it is.
   */
  gameFor(
    userId: string,
    gameId: string,
  ): Promise<{ summary: GameSummary; detail: GameDetail | null } | null>
}
