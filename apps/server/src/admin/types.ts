import type { GameSummary, ProfilePatch } from '../account/types.js'

/**
 * Everything the admin panel needs from the database, as one interface.
 *
 * A third port beside `AuthStore` and `AccountStore`, for the reason those two are separate from
 * each other: they answer different questions, and keeping them apart is what lets a test hand
 * over only the half it needs. This one answers "what is there, and what can be done about it",
 * which is a question the other two deliberately refuse -- `AccountStore` is scoped to the person
 * asking, and every method here reads across everybody.
 *
 * That difference is the whole reason it is not simply more methods on `AccountStore`. A port
 * whose methods are all owner-scoped is a port a route cannot accidentally misuse; adding one
 * unscoped method to it would end that property quietly.
 *
 * `types.ts` for the reason the other two give: the file holds no runtime code, and the coverage
 * config already excludes that name rather than needing an entry of its own.
 */

/**
 * One way somebody signs in, as the panel shows it.
 *
 * **The address is here, and this is the only place in the API that returns one.** A profile has
 * never carried it and `PublicProfile` exists to keep it that way, so this is a deliberate
 * exception rather than an oversight: moderation means answering "who is this account", and a
 * panel that cannot see the address cannot answer it. It is behind `is_admin` and nothing else
 * reads this type.
 */
export interface AdminIdentity {
  /** `google`, `apple`, or `email`. */
  readonly provider: string
  readonly email: string | null
  /** Whether the provider said it checked. A claim and a fact are different things; see AUTH. */
  readonly emailVerified: boolean
  readonly createdAt: Date
}

/**
 * A person, as somebody moderating them sees them.
 *
 * Deliberately not `Profile` and deliberately not `PublicProfile`. It is a superset of both, and
 * making it a third type rather than widening either of those is what stops the extra fields
 * leaking: `GET /v1/me` returns a `Profile` and a public page returns a `PublicProfile`, and
 * neither of them can accidentally start returning an address because they do not have one.
 */
export interface AdminUser {
  readonly userId: string
  readonly username: string
  readonly avatarSeed: string
  readonly country: string | null
  readonly uiLanguage: string | null
  readonly gameLanguage: string | null
  readonly bio: string | null
  readonly isAdmin: boolean
  readonly createdAt: Date
  /** Set means marked for deletion, not yet reaped. See the note on the column in `schema.ts`. */
  readonly deletedAt: Date | null
  /** How many finished games they have, hidden ones included. The panel is the one place that
   * should be able to see a count that disagrees with the person's own page. */
  readonly games: number
  readonly identities: readonly AdminIdentity[]
}

/**
 * A game, as the curation screen shows one.
 *
 * `GameSummary` plus the three columns a listing elsewhere is right not to carry: whether it is
 * hidden, whether it came in from a browser, and whether it is rankable at all. Those three are
 * why a game is or is not on a board, which is the only question this screen exists to answer.
 */
export interface AdminGame extends GameSummary {
  readonly hidden: boolean
  readonly imported: boolean
  readonly leaderboardEligible: boolean
  readonly owner: { readonly userId: string; readonly username: string }
}

/** Which games a listing wants. Everything absent means "do not filter on it". */
export interface GameFilter {
  readonly language?: string
  readonly difficulty?: string
  /** Absent shows both. The hidden ones have to be reachable or nothing can be un-hidden. */
  readonly hidden?: boolean
  readonly userId?: string
  readonly limit: number
}

/**
 * Somebody objecting to something, with both ends resolved.
 *
 * The reporter and the subject are nullable because the columns are: `reporter_user_id` is
 * `on delete set null`, so a report outlives the account that filed it, and that is on purpose --
 * the objection is still worth reading after its author leaves.
 */
export interface AdminReport {
  readonly id: string
  /** Which part is objected to: `username`, `bio`, or `score`. */
  readonly field: string
  readonly reason: string | null
  readonly createdAt: Date
  readonly resolvedAt: Date | null
  readonly reporter: { readonly userId: string; readonly username: string } | null
  readonly subjectUser: { readonly userId: string; readonly username: string } | null
  readonly subjectGame: { readonly id: string; readonly score: number } | null
}

/**
 * A change an admin is making to somebody's account.
 *
 * `ProfilePatch` and one more field, rather than a type of its own, so that a name an admin types
 * goes through exactly the checks a name its owner types does. An admin renaming somebody past
 * the rules would be creating the moderation problem the rules exist to prevent.
 */
export interface AdminPatch extends ProfilePatch {
  readonly isAdmin?: boolean
}

/** What an edit did. Named, because "null" would have to mean two different failures. */
export type EditResult =
  | { readonly ok: true; readonly user: AdminUser }
  | { readonly ok: false; readonly reason: 'no-user' | 'username-taken' }

/** A report as somebody files one, with both ends already resolved to ids by the route. */
export interface NewReport {
  readonly id: string
  readonly reporterUserId: string
  readonly subjectUserId: string | null
  readonly subjectGameId: string | null
  readonly field: string
  readonly reason: string | null
}

export interface AdminStore {
  /**
   * Accounts, by a search that matches a username or a sign-in address.
   *
   * One box rather than two, because the question is always "find me this person" and the
   * searcher has whichever handle they happen to have been given. Deleted accounts are included:
   * this is the surface that has to be able to see and restore one.
   */
  findUsers(text: string | null, limit: number): Promise<readonly AdminUser[]>
  /** One account in full, or null. */
  adminUser(userId: string): Promise<AdminUser | null>
  /**
   * Applies a patch, including the admin flag.
   *
   * Refusing to change the flag on the caller's own account is the **route's** rule rather than
   * this one's, because it is a fact about the request rather than about the data: the store has
   * no idea who is asking. See `routes.ts`.
   */
  editUser(userId: string, patch: AdminPatch): Promise<EditResult>
  /**
   * Marks an account deleted, or unmarks it.
   *
   * One method for both directions, because they are one column and a pair of methods would be
   * two places to get the guard wrong. False when there is no such account.
   *
   * Marked rather than reaped, which is what the column is for: a cascade fired from an HTTP
   * handler has no way back if it was a mistake, and this is the handler that can be aimed at
   * anybody. The reaper does not exist yet and is the thing App Store 5.1.1(v) will need.
   */
  markUserDeleted(userId: string, at: Date | null): Promise<boolean>
  /** Games across everybody, newest first, for curating what is on a board. */
  findGames(filter: GameFilter): Promise<readonly AdminGame[]>
  /**
   * Hides a game, or brings it back.
   *
   * The whole anti-cheat apparatus, as docs/ACCOUNTS.md has it: the defence against an invented
   * score is a person looking at it and a column. Reversible, which a delete is not, and that is
   * the reason it is a column rather than a delete.
   */
  setGameHidden(gameId: string, hidden: boolean): Promise<boolean>
  /** The queue. Unresolved first and oldest first within that, which is the order to work in. */
  findReports(openOnly: boolean, limit: number): Promise<readonly AdminReport[]>
  /** Marks a report dealt with, or reopens it. False when there is no such report. */
  setReportResolved(id: string, at: Date | null): Promise<boolean>
}

/**
 * Filing one, which is the player's half and so does not live on `AdminStore`.
 *
 * On `AccountStore` instead, beside the other things a signed-in person does. The table is read
 * by one surface and written by another, and the ports follow the surfaces rather than the table:
 * a port per table would put the moderation queue's reader in reach of the report button.
 */
export interface ReportWriter {
  /**
   * Writes a report unless this person already has an open one about the same thing.
   *
   * False for a duplicate. Checked rather than enforced by an index, and the race that leaves is
   * deliberate: two rows in a moderation queue cost somebody a second click, and a partial unique
   * index over four nullable columns costs more than that to get right for the same outcome.
   */
  insertReport(row: NewReport): Promise<boolean>
}
