import { randomBytes } from 'node:crypto'
import { and, count, desc, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm'
import type { ProfilePatch } from './account/types.js'
import { normalizeUsername } from './auth/usernames.js'
import type { Database } from './db.js'
import { authIdentities, gameWords, games, loginCodes, sessions, users } from './schema.js'
import type { Store } from './types.js'

/**
 * The `Store` against Postgres. Both halves of it, because there is one database.
 *
 * Thin on purpose. Every decision worth arguing about is in `policy.ts`, `profile.ts`,
 * `importing.ts` and the routes, all tested against a fake; what is left here is statements. It
 * sits with `db.ts` and `migrate.ts` outside the unit coverage gate for the reason
 * `vitest.config.ts` gives — a mocked pool proves the mock was called — and is exercised by
 * `pnpm test:integration` against a real database, which is the only place these mean anything.
 *
 * An email is an **auth identity** rather than a column on `users`, so that the address somebody
 * signs in with sits beside the Apple and Google identities rather than above them. A person who
 * signs in with a code today and adds Apple tomorrow gets a second row, not a second account.
 */
export function pgStore(db: Database): Store {
  return {
    countCodesSince: async (email, since) => {
      const [row] = await db
        .select({ n: count() })
        .from(loginCodes)
        .where(and(eq(loginCodes.email, email), gte(loginCodes.createdAt, since)))
      return row?.n ?? 0
    },

    insertCode: async (row) => {
      await db.insert(loginCodes).values(row)
    },

    latestCode: async (email) => {
      // Newest first, unconsumed only: asking for a second code makes the first useless, and a
      // flow with two live codes is one where a stolen older code still works.
      const [row] = await db
        .select()
        .from(loginCodes)
        .where(and(eq(loginCodes.email, email), isNull(loginCodes.consumedAt)))
        .orderBy(desc(loginCodes.createdAt))
        .limit(1)
      if (row === undefined) return null
      return {
        id: row.id,
        codeHash: row.codeHash,
        attempts: row.attempts,
        expiresAt: row.expiresAt,
        consumedAt: row.consumedAt,
      }
    },

    deleteCode: async (id) => {
      await db.delete(loginCodes).where(eq(loginCodes.id, id))
    },

    recordAttempt: async (id) => {
      // Incremented in the database rather than read-then-written, so two verifications racing
      // cannot both read three and both write four.
      await db
        .update(loginCodes)
        .set({ attempts: sql`${loginCodes.attempts} + 1` })
        .where(eq(loginCodes.id, id))
    },

    consumeCode: async (id, at) => {
      // Guarded on still being unconsumed, so two requests carrying the same correct code cannot
      // both spend it and both get a session.
      await db
        .update(loginCodes)
        .set({ consumedAt: at })
        .where(and(eq(loginCodes.id, id), isNull(loginCodes.consumedAt)))
    },

    userIdForEmail: async (email) => {
      const [row] = await db
        .select({ userId: authIdentities.userId })
        .from(authIdentities)
        .where(
          and(eq(authIdentities.provider, 'email'), eq(authIdentities.providerAccountId, email)),
        )
        .limit(1)
      return row?.userId ?? null
    },

    createUser: async ({ id, email, username }) => {
      // One transaction: an account with no way to sign in, or an identity pointing at nothing,
      // are both worse than no account.
      return db.transaction(async (tx) => {
        const inserted = await tx
          .insert(users)
          .values({
            id,
            username,
            usernameNormalized: normalizeUsername(username),
            avatarSeed: id,
          })
          // The unique index is the authority on whether a name is free. A check followed by an
          // insert is a race; this is not, and the caller generates another name and retries.
          .onConflictDoNothing({ target: users.usernameNormalized })
          .returning({ id: users.id })
        if (inserted[0] === undefined) return null

        await tx.insert(authIdentities).values({
          id: randomBytes(16).toString('base64url'),
          userId: id,
          provider: 'email',
          providerAccountId: email,
          email,
          // The whole point of the flow that got here: the address answered. Recording it means
          // Apple's "Hide My Email" relay addresses later carry the same fact in the same place.
          emailVerifiedAt: new Date(),
        })
        return id
      })
    },

    findSession: async (id, now) => {
      const [row] = await db
        .select(PROFILE)
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        // Expiry and revocation in the query rather than in the caller, and `deletedAt` with
        // them: a deleted account whose session is still live would otherwise keep working.
        .where(
          and(
            eq(sessions.id, id),
            isNull(sessions.revokedAt),
            gte(sessions.expiresAt, now),
            isNull(users.deletedAt),
          ),
        )
        .limit(1)
      return row ?? null
    },

    createSession: async (row) => {
      await db.insert(sessions).values(row)
    },

    revokeSession: async (id, at) => {
      // Guarded on being unrevoked, so signing out twice does not move the timestamp and lose
      // when the session actually ended.
      await db
        .update(sessions)
        .set({ revokedAt: at })
        .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)))
    },

    usernameTaken: async (normalized) => {
      // Deleted accounts are not filtered out, deliberately: the unique index does not exclude
      // them either, so filtering here would answer "free" about a name an update cannot have.
      const [row] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.usernameNormalized, normalized))
        .limit(1)
      return row !== undefined
    },

    updateProfile: async (userId, patch) => {
      const values = columnsOf(patch)
      const where = and(eq(users.id, userId), isNull(users.deletedAt))
      // An empty patch is a read. Drizzle refuses `set({})` outright, and a PATCH that mentions
      // no field is a client asking for the profile back rather than an error worth raising.
      if (Object.keys(values).length === 0) {
        const [row] = await db.select(PROFILE).from(users).where(where).limit(1)
        return row ?? null
      }
      try {
        const [row] = await db.update(users).set(values).where(where).returning(PROFILE)
        return row ?? null
      } catch (failure) {
        // The unique index is the authority on whether a name is free, so losing it is an
        // ordinary answer rather than a fault: the caller turns it into a 409.
        if (isUniqueViolation(failure)) return null
        throw failure
      }
    },

    insertGame: async (row, words) => {
      // One transaction: a game with no words, or words belonging to no game, are both worse
      // than a failed import that can be retried.
      await db.transaction(async (tx) => {
        await tx.insert(games).values({ ...row, status: 'over', letters: [...row.letters] })
        if (words.length > 0) {
          await tx.insert(gameWords).values(words.map((word) => ({ ...word, gameId: row.id })))
        }
      })
    },

    gamesOf: async (userId, limit) => {
      const rows = await db
        .select({
          id: games.id,
          language: games.language,
          difficulty: games.difficulty,
          canonical: games.canonical,
          imported: games.imported,
          score: games.score,
          words: games.wordsCount,
          rounds: games.roundsPlayed,
          engineVersion: games.engineVersion,
          finishedAt: games.finishedAt,
        })
        .from(games)
        // Unfinished games are not history yet, and a hidden one is hidden from its owner too:
        // a score removed from a board that still sits at the top of a personal page has been
        // removed from nowhere the person who set it can see.
        .where(and(eq(games.userId, userId), isNotNull(games.finishedAt), eq(games.hidden, false)))
        .orderBy(desc(games.finishedAt))
        .limit(limit)
      return rows.map((row) => ({ ...row, finishedAt: row.finishedAt as Date }))
    },
  }
}

/**
 * The profile, as one selection.
 *
 * Named once because three queries return it and they have to agree: a `findSession` that
 * answered with fewer fields than `updateProfile` would make the interface change shape
 * depending on which route the client had just called.
 */
const PROFILE = {
  userId: users.id,
  username: users.username,
  avatarSeed: users.avatarSeed,
  country: users.country,
  uiLanguage: users.uiLanguage,
  gameLanguage: users.gameLanguage,
  bio: users.bio,
} as const

/**
 * A patch as columns, with absent still meaning absent.
 *
 * `username` writes two columns, because uniqueness is enforced on the normalized one and a name
 * changed without its normalized twin is a name that has quietly stopped being unique.
 */
function columnsOf(patch: ProfilePatch): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  if (patch.username !== undefined) {
    values.username = patch.username
    values.usernameNormalized = normalizeUsername(patch.username)
  }
  if (patch.country !== undefined) values.country = patch.country
  if (patch.uiLanguage !== undefined) values.uiLanguage = patch.uiLanguage
  if (patch.gameLanguage !== undefined) values.gameLanguage = patch.gameLanguage
  if (patch.bio !== undefined) values.bio = patch.bio
  return values
}

/**
 * Postgres for "you lost a unique index". `23505` is in the standard and postgres.js passes it.
 *
 * Walked down the `cause` chain rather than read off the error in hand, because Drizzle wraps
 * what the driver threw in an `Error` of its own carrying the SQL and the parameters. Reading
 * `failure.code` alone finds `undefined` on that wrapper, and the rename that lost a race came
 * back as a 500 instead of a 409 — which is what the integration suite exists to catch, since no
 * fake would have made the wrapper.
 */
function isUniqueViolation(failure: unknown): boolean {
  for (let at = failure; at !== undefined && at !== null; at = (at as { cause?: unknown }).cause) {
    if (typeof at !== 'object') return false
    if ((at as { code?: unknown }).code === '23505') return true
  }
  return false
}
