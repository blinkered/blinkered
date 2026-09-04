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
  createSession(row: {
    id: string
    userId: string
    kind: 'cookie' | 'bearer'
    expiresAt: Date
  }): Promise<void>
}
