import type { ReportWriter } from '../admin/types.js'
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
  /** The client's own id for this game, or null. What makes a queued upload safe to retry. */
  readonly clientKey: string | null
  /** Whether the clock ever stopped: paused by hand, or the app going away. Not rankable. */
  readonly paused: boolean
  /** Whether this game can be ranked. Canonical, scored, and never paused; see the import route. */
  readonly leaderboardEligible: boolean
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
  readonly hideChance: number
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
export const DETAIL_VERSION = 2

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

/** The board as one round had it. */
export interface BoardAtRound {
  /** Tile faces in tile order, joined by a space, which no face ever contains. */
  readonly tiles: string
  /**
   * Slots that were showing as a wild, by position. Absent for none, which is most rounds.
   *
   * Separate from `tiles` rather than written into it, because a wild is a mask and the letter is
   * still underneath: `Tile.wild` is a boolean beside `Tile.letter`, and flattening the two here
   * would lose the letter the board went back to next round.
   */
  readonly wilds?: readonly number[]
}

/**
 * Everything about a game that nothing queries.
 *
 * `boards` is one entry per round. Not only the first, because from 0.3.0 a letter can be
 * replaced at any deal and a wild can mask one for a round, so "which board" is really "which of
 * the several boards this game had".
 *
 * What is deliberately **not** here is an event log. Reconstructing every intermediate state
 * means full replay, which docs/ACCOUNTS.md rejected and which this does not need: the board each
 * round had plus the round each word was found in answers the question at a fraction of the cost.
 */
export interface GameDetail {
  readonly boards: readonly BoardAtRound[]
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
  /**
   * Real seconds per tick, which is what turns a word's `tick` into a time somebody can read.
   *
   * On the summary rather than in the document because it is a scalar on `games` that the
   * detail screen needs in order to render the document at all, and a screen that had to fetch
   * two things to show one game would be fetching twice for eight bytes.
   */
  readonly speedMultiplier: number
  readonly score: number
  readonly words: number
  readonly rounds: number
  readonly engineVersion: string
  readonly finishedAt: Date
}

/**
 * A person as a stranger sees them.
 *
 * Deliberately not `Profile`, which is what *you* see of yourself. The two differ by one field
 * today and the point of the separate type is that they go on differing: `Profile` is where
 * anything private lands as the account grows, and a public route that returned it would leak
 * whatever was added next. Nothing here has ever been private -- a username, a picture, a
 * country and a bio are what a profile page is for.
 *
 * `userId` is here because `avatarSeed` is the id, so withholding one while returning the other
 * would be a gesture rather than a boundary. Ids are random rather than sequential, so it
 * publishes nothing about how many accounts there are or what order they arrived in.
 */
export interface PublicProfile {
  readonly userId: string
  readonly username: string
  readonly avatarSeed: string
  readonly country: string | null
  readonly bio: string | null
}

/**
 * One row of a board: a player, their best game on it, and where it ranks.
 *
 * `rank` is computed by the store rather than by position in the array, because the two differ
 * the moment anything filters afterwards, and a medal hung on an array index is a medal that
 * moves when somebody is banned.
 */
export interface LeaderboardRow {
  readonly rank: number
  readonly gameId: string
  readonly username: string
  readonly avatarSeed: string
  readonly country: string | null
  readonly score: number
  readonly rounds: number
  readonly finishedAt: Date
}

/**
 * Everything a signed-in person does, and `ReportWriter` is one of those things.
 *
 * Filing a report is an account action, so it sits here; reading the queue is moderation, so it
 * sits on `AdminStore`. The ports follow the surfaces rather than the tables, which is what stops
 * the moderation queue's reader being in reach of the report button.
 */
export interface AccountStore extends ReportWriter {
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
  /**
   * Writes a game and its detail together, or neither, and says what is now stored.
   *
   * Returns the id and score of the row that holds this game, which is **not** always the row
   * just written. A game carrying a `clientKey` this person has already used is one the device
   * is retrying after a lost response, so the existing row is returned and nothing is inserted.
   * That is what makes the upload queue safe to drain more than once.
   *
   * The score comes back rather than being assumed, because the caller's copy is the score it
   * computed for *this* attempt: for a duplicate the stored one is authoritative, and handing
   * back the fresh number would let a client show a total the database does not hold.
   */
  insertGame(row: GameRow, detail: GameDetail): Promise<{ id: string; score: number }>
  /** Somebody's games, most recently finished first. */
  gamesOf(userId: string, limit: number): Promise<readonly GameSummary[]>
  /**
   * One board: the top `limit` players for a language, a difficulty and an engine version.
   *
   * **One row per player, their best game**, which docs/ACCOUNTS.md settled and which is not a
   * detail: without it one strong player owns the top ten and the board stops being a
   * leaderboard and starts being a profile.
   *
   * Ordered the way `compareResults` in @blinkered/engine orders: score descending, then rounds
   * ascending, then the timestamp ascending so whoever got there first wins a tie. Any other
   * order produces a board that disagrees with the ranking the client computes from the same
   * rows.
   *
   * Banned accounts are absent, for the same reason their profiles 404.
   */
  leaderboard(board: {
    language: string
    difficulty: string
    engineVersion: string
    limit: number
  }): Promise<readonly LeaderboardRow[]>
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
  /**
   * One game and who played it, for anybody at all.
   *
   * Not scoped to an owner. Games are public, so this is the only reader of a detail document
   * and the account screen goes through it too -- one route rather than a public one and a
   * private one that could drift about what a game is.
   *
   * Null for a game that is not there, one that never finished, one an owner has not claimed,
   * a `hidden` one, and one belonging to a banned account. Those are all "no such game" to a
   * stranger, and the distinctions are exactly what a 404 exists to withhold.
   */
  gameById(gameId: string): Promise<{
    summary: GameSummary
    detail: GameDetail | null
    owner: PublicProfile
  } | null>
  /** Somebody else's profile, by the name in the URL. Null for unknown and for banned. */
  profileByUsername(normalized: string): Promise<PublicProfile | null>
  /**
   * The address a code can be sent to, for somebody who is already signed in.
   *
   * Verified only, newest first. Used by the deletion flow and nothing else: it is the one
   * question the session cannot answer on its own, because `Profile` has never carried an
   * address and should not start.
   *
   * Null where the account has no verified address at all, which the schema allows -- a provider
   * is under no obligation to give us one. The route has to say something other than nothing in
   * that case.
   */
  verifiedEmailFor(userId: string): Promise<string | null>
  /**
   * Erases an account: the row, and everything the foreign keys carry with it.
   *
   * Identities, sessions, games and their detail documents go by `on delete cascade`. Reports do
   * **not** -- all three of their links are `set null`, so the objection outlives the people in
   * it. On the reporter side that is what stops evidence being waited out; on the subject side it
   * keeps our own counts honest and leaves nothing about the person, so it is no defence against
   * them returning. See the note on the table in `schema.ts`.
   *
   * What the cascades cannot do is erase the person from `reason`, which is prose one player
   * wrote about another. That is nulled here, for reports where this account was the subject,
   * inside the same transaction and **before** the delete -- afterwards the link is already null
   * and there is nothing left to match on.
   *
   * False when there was no such account, so the route can answer honestly rather than claiming
   * to have deleted something twice.
   */
  deleteAccount(userId: string): Promise<boolean>
}
