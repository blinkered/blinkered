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

/** The ways in. */
export type Provider = 'email' | 'apple' | 'google'

/**
 * One way of signing in, as it is about to be written down.
 *
 * `email` is nullable because Apple's relay users can revoke forwarding, and because a provider
 * is under no obligation to tell us an address at all. `providerAccountId` is the identity;
 * `email` is a contact detail that happens to be useful for linking.
 */
export interface NewIdentity {
  readonly provider: Provider
  readonly providerAccountId: string
  readonly email: string | null
  /** Whether the provider says it checked. Never assume it: see `linkIdentity`. */
  readonly emailVerified: boolean
}

/**
 * A person, as every authenticated route wants them.
 *
 * Returned by `findSession` rather than fetched separately, because the session lookup already
 * joins `users` in order to check `bannedAt`, and asking twice for a row already in hand is how
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
  /**
   * Whether this person can moderate.
   *
   * Here rather than on a route of its own, for the same reason `avatarSeed` is: the session
   * lookup already has the row, and the client needs it the moment it knows who anybody is --
   * an admin item in the menu that appeared a round trip after the menu did would flicker.
   *
   * It is not on `PublicProfile` and must not be. Who moderates is nobody else's business, and
   * a public field saying so would be a list of the accounts worth attacking.
   *
   * The client uses it to decide what to *show*. Every admin route checks the column itself, so
   * a client that lies about this gets a menu item and 403s.
   */
  readonly isAdmin: boolean
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
  /**
   * The account a provider identity already belongs to, if any.
   *
   * Provider-generic rather than one method per provider, because the question is the same one
   * every time and `auth_identities` already has the unique index that answers it. For `email`
   * the account id is the address; for `apple` it is the `sub`, which is the only durable handle
   * Apple gives out -- a person who hides their address can drop the relay, so the address is
   * not an identity and must never be treated as one.
   */
  userIdForIdentity(provider: Provider, accountId: string): Promise<string | null>
  /**
   * The account holding this address, under **any** provider, where the provider checked it.
   *
   * Separate from `userIdForIdentity` because an address is not an identity: two providers can
   * both vouch for one mailbox, and the person behind it is the same person either way. This is
   * what makes sign-in order stop mattering. Without it, code-then-Apple links and
   * Apple-then-code does not, which is one account or two depending on which button somebody
   * happened to press first.
   *
   * Verified only. An address a provider merely passed along is a claim, not a fact, and linking
   * on a claim hands the account to whoever made it.
   *
   * Oldest first when there is more than one, so the account somebody has been using is the one
   * that wins rather than whichever row the planner reached first.
   */
  userIdForVerifiedEmail(email: string): Promise<string | null>
  /**
   * Attaches another way of signing in to an account that exists.
   *
   * This is the whole of account linking. It is called when somebody who already signed up with
   * a code arrives through Apple carrying the same **verified** address: same person, same
   * account, one more door. The verification is the load-bearing part and it is checked by the
   * caller, not here -- linking on an unverified claim means anybody who can assert an address
   * can walk into the account that owns it.
   */
  linkIdentity(input: { id: string; userId: string; identity: NewIdentity }): Promise<void>
  /**
   * Creates an account with this address and this name.
   *
   * Returns null when the username is taken, so the caller can generate another and try again
   * rather than the store deciding a name on its behalf. Uniqueness is the database's to enforce
   * — a check followed by an insert is a race, and the unique index is not.
   */
  createUser(input: { id: string; username: string; identity: NewIdentity }): Promise<string | null>
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
   * Slides a native session's expiry forward, if it is close enough to matter.
   *
   * Scoped to `kind = 'bearer'` inside the statement rather than by the caller, because the
   * distinction is the point: a cookie session is thirty days from sign-in and sliding it on use
   * would quietly make every browser session permanent. A bearer session is a year, refreshed on
   * use, so that an installed app never signs somebody out for having been offline.
   *
   * Conditional on the expiry so that an authenticated request does not write a row it does not
   * need to: at most one update per `ifExpiringBefore` window. Resolves either way; nothing
   * depends on whether a row was touched.
   */
  touchBearerSession(id: string, when: { ifExpiringBefore: Date; until: Date }): Promise<void>
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
