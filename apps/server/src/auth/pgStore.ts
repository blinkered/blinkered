import { randomBytes } from 'node:crypto'
import { and, count, desc, eq, gte, isNull, sql } from 'drizzle-orm'
import type { Database } from '../db.js'
import { authIdentities, loginCodes, sessions, users } from '../schema.js'
import type { AuthStore } from './types.js'
import { normalizeUsername } from './usernames.js'

/**
 * `AuthStore` against Postgres.
 *
 * Thin on purpose. Every decision worth arguing about is in `policy.ts` and `routes.ts`, tested
 * against a fake; what is left here is eight statements. It sits with `db.ts` and `migrate.ts`
 * outside the unit coverage gate for the reason `vitest.config.ts` gives — a mocked pool proves
 * the mock was called — and is exercised by `pnpm test:integration` against a real database,
 * which is the only place these mean anything.
 *
 * An email is an **auth identity** rather than a column on `users`, so that the address somebody
 * signs in with sits beside the Apple and Google identities rather than above them. A person who
 * signs in with a code today and adds Apple tomorrow gets a second row, not a second account.
 */
export function pgAuthStore(db: Database): AuthStore {
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
        .select({ userId: users.id, username: users.username })
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
  }
}
