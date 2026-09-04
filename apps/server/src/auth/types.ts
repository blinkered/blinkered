import type { CodeRow } from './policy.js'

/**
 * Everything sign-in needs from the database, as one interface.
 *
 * `types.ts` rather than `store.ts` because it holds no runtime code at all, and the repository
 * already excludes that name from coverage for the reason `vitest.config.ts` gives: a percentage
 * over a file that compiles to nothing measures nothing. Conforming to the existing convention
 * beats adding an exclusion of its own.
 *
 * The routes are written against this rather than against Drizzle, for the reason the coverage
 * config already gives about `db.ts`: a mocked pool proves the mock was called. Here the fake is
 * a Map and the assertions are about behaviour — that a dead code is not retried, that a second
 * verification of the same code fails — which are facts about the flow rather than about SQL.
 * The Postgres implementation is thin enough to be checked by `pnpm test:integration`.
 */

export interface StoredCode extends CodeRow {
  readonly id: string
}

/**
 * A person, as every authenticated route wants them.
 *
 * Returned by `findSession` rather than fetched separately, because the session lookup already
 * joins `users` in order to check `deletedAt`, and asking twice for a row already in hand is how
 * `GET /v1/me` becomes two round trips for one sentence. It is also the reason `avatarSeed` is
 * here rather than on a route of its own: the picture is drawn wherever the name is shown.
 *
 * The three nullable fields are nullable in the schema for the same reason. A brand-new account
 * has said nothing about itself, and a country of `''` would be a country.
 */
export interface Profile {
  readonly userId: string
  readonly username: string
  readonly avatarSeed: string
  readonly country: string | null
  readonly uiLanguage: string | null
  readonly gameLanguage: string | null
  readonly bio: string | null
}

export interface AuthStore {
  /** How many codes this address has been sent since a moment, for the rate limit. */
  countCodesSince(email: string, since: Date): Promise<number>
  insertCode(row: { id: string; email: string; codeHash: string; expiresAt: Date }): Promise<void>
  /**
   * The newest unconsumed code for an address, or null.
   *
   * Newest rather than all of them: asking for a second code should make the first one useless,
   * and a flow where two codes are live at once is one where a stolen older code still works.
   */
  latestCode(email: string): Promise<StoredCode | null>
  /**
   * Removes a code that was never sent.
   *
   * The row is written before the mail goes, so a failed send would otherwise leave a live code
   * nobody has and a slot spent against the rate limit. Three of those in a quarter of an hour
   * lock an address out of a relay that has since been fixed.
   */
  deleteCode(id: string): Promise<void>
  /** Counts a wrong guess. Separate from consuming, because a wrong guess leaves it usable. */
  recordAttempt(id: string): Promise<void>
  /** Spends a code. After this it is dead whatever else is true of it. */
  consumeCode(id: string, at: Date): Promise<void>
  /** The account this address already belongs to, if any. */
  userIdForEmail(email: string): Promise<string | null>
  /**
   * Creates an account with this address and this name.
   *
   * Returns null when the username is taken, so the caller can generate another and try again
   * rather than the store deciding a name on its behalf. Uniqueness is the database's to enforce
   * — a check followed by an insert is a race, and the unique index is not.
   */
  createUser(input: { id: string; email: string; username: string }): Promise<string | null>
  /**
   * Who a session token belongs to, or null.
   *
   * Takes the hash rather than the token, because the token never reaches the database — see
   * `secrets.ts`. Expiry and revocation are the store's to check, so a caller cannot forget:
   * every route that asks this question would otherwise have to remember both.
   */
  findSession(id: string, now: Date): Promise<Profile | null>
  createSession(row: {
    id: string
    userId: string
    kind: 'cookie' | 'bearer'
    expiresAt: Date
  }): Promise<void>
  /**
   * Ends a session, by the hash the cookie hashes to.
   *
   * Revoked rather than deleted, and revoked rather than the client simply dropping the cookie.
   * Signing out has to kill the credential, not just stop presenting it, or a token copied off
   * a shared machine outlives the sign-out that was supposed to be the remedy. Idempotent: an
   * unknown or already-revoked id is a sign-out that has already happened.
   */
  revokeSession(id: string, at: Date): Promise<void>
}
