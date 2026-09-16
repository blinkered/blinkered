import { randomBytes } from 'node:crypto'
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { DETAIL_VERSION } from './account/types.js'
import type { GameDetail, ProfilePatch } from './account/types.js'
import type { AdminGame, AdminPatch, AdminReport, AdminUser } from './admin/types.js'
import { normalizeUsername } from './auth/usernames.js'
import type { Database } from './db.js'
import {
  authIdentities,
  gameDetail,
  games,
  loginCodes,
  reports,
  sessions,
  users,
} from './schema.js'
import type { NewIdentity } from './auth/types.js'
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
/**
 * One `auth_identities` row, from the identity the caller has in hand.
 *
 * Shared by `createUser` and `linkIdentity` so the two cannot disagree about what a verified
 * address looks like. `emailVerifiedAt` is a timestamp rather than a boolean because "when" is
 * the question asked later -- an address verified two years ago and one verified in this request
 * are different facts, and a boolean throws that away.
 */
function identityRow(
  id: string,
  userId: string,
  identity: NewIdentity,
): typeof authIdentities.$inferInsert {
  return {
    id,
    userId,
    provider: identity.provider,
    providerAccountId: identity.providerAccountId,
    email: identity.email,
    emailVerifiedAt: identity.emailVerified ? new Date() : null,
  }
}

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

    userIdForIdentity: async (provider, accountId) => {
      const [row] = await db
        .select({ userId: authIdentities.userId })
        .from(authIdentities)
        .where(
          and(
            eq(authIdentities.provider, provider),
            eq(authIdentities.providerAccountId, accountId),
          ),
        )
        .limit(1)
      return row?.userId ?? null
    },

    userIdForVerifiedEmail: async (email) => {
      const [row] = await db
        .select({ userId: authIdentities.userId })
        .from(authIdentities)
        .where(and(eq(authIdentities.email, email), isNotNull(authIdentities.emailVerifiedAt)))
        .orderBy(authIdentities.createdAt)
        .limit(1)
      return row?.userId ?? null
    },

    linkIdentity: async ({ id, userId, identity }) => {
      await db.insert(authIdentities).values(identityRow(id, userId, identity))
    },

    createUser: async ({ id, username, identity }) => {
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

        await tx
          .insert(authIdentities)
          .values(identityRow(randomBytes(16).toString('base64url'), id, identity))
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

    insertGame: async (row, detail) => {
      // One transaction: a game with no detail, or a document belonging to no game, are both
      // worse than a failed import that can be retried.
      //
      // The version is stamped here rather than by the caller, so there is one place that decides
      // what shape was written and no arrangement in which a route forgets to say.
      await db.transaction(async (tx) => {
        await tx.insert(games).values({ ...row, status: 'over' })
        await tx.insert(gameDetail).values({
          gameId: row.id,
          version: DETAIL_VERSION,
          detail,
        })
      })
    },

    gamesOf: async (userId, limit) => {
      const rows = await db
        .select({
          id: games.id,
          language: games.language,
          difficulty: games.difficulty,
          canonical: games.canonical,
          speedMultiplier: games.speedMultiplier,
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

    /*
     * Filing a report, unless this person already has an open one about the same thing.
     *
     * Checked rather than enforced by a partial unique index over four nullable columns, and the
     * race that leaves is deliberate: losing it costs the queue a duplicate row, and getting an
     * index over `(reporter, subject_user, subject_game, field) where resolved_at is null` right
     * across three nullable subjects costs more than that for the same outcome.
     */
    insertReport: async (row) => {
      const already = await db
        .select({ id: reports.id })
        .from(reports)
        .where(
          and(
            eq(reports.reporterUserId, row.reporterUserId),
            eq(reports.field, row.field),
            isNull(reports.resolvedAt),
            row.subjectGameId === null
              ? isNull(reports.subjectGameId)
              : eq(reports.subjectGameId, row.subjectGameId),
            row.subjectUserId === null
              ? isNull(reports.subjectUserId)
              : eq(reports.subjectUserId, row.subjectUserId),
          ),
        )
        .limit(1)
      if (already[0] !== undefined) return false
      await db.insert(reports).values(row)
      return true
    },

    /*
     * Accounts, by a search over names and sign-in addresses at once.
     *
     * `exists` on the identities rather than a join, because a join on a table with one row per
     * provider returns the same person once per way they sign in, and the caller would have to
     * collapse them. A subquery answers the question the search is actually asking -- does this
     * account have an address like that -- and returns each account once.
     *
     * Deleted accounts are included. This is the surface that has to be able to see one in order
     * to restore it, and it is the only surface where that is true: `profileByUsername` and
     * `gameById` both exclude them, and should.
     */
    findUsers: async (text, limit) => {
      const matching = text === null || text.trim() === '' ? null : `%${text.trim()}%`
      const found = await db
        .select(ADMIN_USER)
        .from(users)
        .where(
          matching === null
            ? undefined
            : or(
                ilike(users.username, matching),
                exists(
                  db
                    .select({ one: sql`1` })
                    .from(authIdentities)
                    .where(
                      and(
                        eq(authIdentities.userId, users.id),
                        ilike(authIdentities.email, matching),
                      ),
                    ),
                ),
              ),
        )
        // Newest first, so an empty search opens on the accounts most likely to be the reason
        // somebody came here.
        .orderBy(desc(users.createdAt))
        .limit(limit)
      return dressUsers(db, found)
    },

    adminUser: async (userId) => {
      const found = await db.select(ADMIN_USER).from(users).where(eq(users.id, userId)).limit(1)
      const dressed = await dressUsers(db, found)
      return dressed[0] ?? null
    },

    /*
     * Applying an admin's patch.
     *
     * No `isNull(users.deletedAt)` guard, unlike `updateProfile`, and that is the one deliberate
     * difference: a marked account is still editable here, which is what lets an offensive name
     * be fixed on an account that is on its way out. The row is still there until it is reaped,
     * and until then it is still a name on a game somebody can open.
     */
    editUser: async (userId, patch) => {
      const values = adminColumnsOf(patch)
      if (Object.keys(values).length === 0) {
        // An empty patch is a read, as it is on `updateProfile`: Drizzle refuses `set({})`, and a
        // PATCH mentioning no field is a client asking for the row back.
        const [row] = await db.select(ADMIN_USER).from(users).where(eq(users.id, userId)).limit(1)
        if (row === undefined) return { ok: false, reason: 'no-user' }
        return { ok: true, user: (await dressUsers(db, [row]))[0] as AdminUser }
      }
      try {
        const written = await db
          .update(users)
          .set(values)
          .where(eq(users.id, userId))
          .returning(ADMIN_USER)
        const row = written[0]
        if (row === undefined) return { ok: false, reason: 'no-user' }
        return { ok: true, user: (await dressUsers(db, [row]))[0] as AdminUser }
      } catch (failure) {
        // The unique index is the authority on whether a name is free, here as everywhere else.
        if (isUniqueViolation(failure)) return { ok: false, reason: 'username-taken' }
        throw failure
      }
    },

    markUserDeleted: async (userId, at) => {
      const written = await db
        .update(users)
        .set({ deletedAt: at })
        .where(eq(users.id, userId))
        .returning({ id: users.id })
      return written[0] !== undefined
    },

    /*
     * Games across everybody, in the order a board has them.
     *
     * Score descending, then rounds ascending, then the timestamp ascending -- which is
     * `compareResults` in @blinkered/engine and is the order `games_leaderboard_idx` is built
     * for. Deliberately the board's order rather than "newest first": the screen exists to look
     * at what is at the top of a board and decide whether it belongs there, and a listing sorted
     * differently from the board would not be showing the board.
     *
     * An inner join on `users`, so an unclaimed guest game cannot appear. There is nobody to
     * moderate about one.
     */
    findGames: async (filter) => {
      const rows = await db
        .select({
          id: games.id,
          language: games.language,
          difficulty: games.difficulty,
          canonical: games.canonical,
          speedMultiplier: games.speedMultiplier,
          score: games.score,
          words: games.wordsCount,
          rounds: games.roundsPlayed,
          engineVersion: games.engineVersion,
          finishedAt: games.finishedAt,
          hidden: games.hidden,
          imported: games.imported,
          leaderboardEligible: games.leaderboardEligible,
          ownerId: users.id,
          username: users.username,
        })
        .from(games)
        .innerJoin(users, eq(users.id, games.userId))
        .where(
          and(
            isNotNull(games.finishedAt),
            filter.language === undefined ? undefined : eq(games.language, filter.language),
            filter.difficulty === undefined ? undefined : eq(games.difficulty, filter.difficulty),
            // Absent means both. A hidden game that could not be found again could never be
            // un-hidden, so this is the one listing that shows them.
            filter.hidden === undefined ? undefined : eq(games.hidden, filter.hidden),
            filter.userId === undefined ? undefined : eq(games.userId, filter.userId),
          ),
        )
        .orderBy(desc(games.score), asc(games.roundsPlayed), asc(games.finishedAt))
        .limit(filter.limit)
      return rows.map(({ ownerId, username, ...game }): AdminGame => ({
        ...game,
        finishedAt: game.finishedAt as Date,
        owner: { userId: ownerId, username },
      }))
    },

    setGameHidden: async (gameId, hidden) => {
      const written = await db
        .update(games)
        .set({ hidden })
        .where(eq(games.id, gameId))
        .returning({ id: games.id })
      return written[0] !== undefined
    },

    /*
     * The queue, with both ends resolved to something readable.
     *
     * Three left joins and two of them to `users`, which is what `alias` is for: the reporter and
     * the subject are both people and a single join cannot be both. Left rather than inner, every
     * one of them, because the columns are nullable on purpose -- `reporter_user_id` is
     * `on delete set null`, so a report outlives the account that filed it, and the objection is
     * still worth reading after its author leaves.
     *
     * Unresolved first and oldest first inside that. `nulls first` is written out because
     * Postgres puts nulls last under `asc`, and an unresolved report is exactly a null.
     */
    findReports: async (openOnly, limit) => {
      const reporter = alias(users, 'reporter')
      const subject = alias(users, 'subject')
      const rows = await db
        .select({
          id: reports.id,
          field: reports.field,
          reason: reports.reason,
          createdAt: reports.createdAt,
          resolvedAt: reports.resolvedAt,
          reporterId: reporter.id,
          reporterName: reporter.username,
          subjectId: subject.id,
          subjectName: subject.username,
          gameId: games.id,
          gameScore: games.score,
        })
        .from(reports)
        .leftJoin(reporter, eq(reporter.id, reports.reporterUserId))
        .leftJoin(subject, eq(subject.id, reports.subjectUserId))
        .leftJoin(games, eq(games.id, reports.subjectGameId))
        .where(openOnly ? isNull(reports.resolvedAt) : undefined)
        .orderBy(sql`${reports.resolvedAt} asc nulls first`, asc(reports.createdAt))
        .limit(limit)
      return rows.map((row): AdminReport => ({
        id: row.id,
        field: row.field,
        reason: row.reason,
        createdAt: row.createdAt,
        resolvedAt: row.resolvedAt,
        reporter:
          row.reporterId === null || row.reporterName === null
            ? null
            : { userId: row.reporterId, username: row.reporterName },
        subjectUser:
          row.subjectId === null || row.subjectName === null
            ? null
            : { userId: row.subjectId, username: row.subjectName },
        subjectGame:
          row.gameId === null || row.gameScore === null
            ? null
            : { id: row.gameId, score: row.gameScore },
      }))
    },

    setReportResolved: async (id, at) => {
      const written = await db
        .update(reports)
        .set({ resolvedAt: at })
        .where(eq(reports.id, id))
        .returning({ id: reports.id })
      return written[0] !== undefined
    },

    profileByUsername: async (normalized) => {
      const [row] = await db
        .select(PUBLIC_PROFILE)
        .from(users)
        // A deleted account is not a profile. Same answer as a name nobody has, deliberately:
        // telling the two apart would make this endpoint report who used to be here.
        .where(and(eq(users.usernameNormalized, normalized), isNull(users.deletedAt)))
        .limit(1)
      return row ?? null
    },

    gameById: async (gameId) => {
      // An inner join on `users`, so a game with no owner cannot come back: an unclaimed guest
      // game has nobody to attribute it to and is nobody's to show.
      const [row] = await db
        .select({
          id: games.id,
          language: games.language,
          difficulty: games.difficulty,
          canonical: games.canonical,
          speedMultiplier: games.speedMultiplier,
          score: games.score,
          words: games.wordsCount,
          rounds: games.roundsPlayed,
          engineVersion: games.engineVersion,
          finishedAt: games.finishedAt,
          version: gameDetail.version,
          detail: gameDetail.detail,
          ownerId: users.id,
          username: users.username,
          avatarSeed: users.avatarSeed,
          country: users.country,
          bio: users.bio,
        })
        .from(games)
        .innerJoin(users, eq(users.id, games.userId))
        .leftJoin(gameDetail, eq(gameDetail.gameId, games.id))
        .where(
          and(
            eq(games.id, gameId),
            isNotNull(games.finishedAt),
            eq(games.hidden, false),
            isNull(users.deletedAt),
          ),
        )
        .limit(1)
      if (row === undefined) return null

      const { version, detail, ownerId, username, avatarSeed, country, bio, ...summary } = row
      return {
        summary: { ...summary, finishedAt: summary.finishedAt as Date },
        detail: detail !== null && version === DETAIL_VERSION ? (detail as GameDetail) : null,
        owner: { userId: ownerId, username, avatarSeed, country, bio },
      }
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
/**
 * The profile a stranger gets. Named beside `PROFILE` so the difference is visible in one place
 * rather than discovered when a private field turns up on a public page.
 */
const PUBLIC_PROFILE = {
  userId: users.id,
  username: users.username,
  avatarSeed: users.avatarSeed,
  country: users.country,
  bio: users.bio,
} as const

const PROFILE = {
  userId: users.id,
  username: users.username,
  avatarSeed: users.avatarSeed,
  country: users.country,
  uiLanguage: users.uiLanguage,
  gameLanguage: users.gameLanguage,
  bio: users.bio,
  isAdmin: users.isAdmin,
} as const

/**
 * An account, as the panel wants it, minus the two things that need another query.
 *
 * Named beside `PROFILE` and `PUBLIC_PROFILE` so the three are visible together: this is the one
 * that carries `is_admin` and `deleted_at`, and the reason the others do not is that they go to a
 * browser belonging to somebody who is not moderating. `dressUsers` adds the identities and the
 * game count.
 */
const ADMIN_USER = {
  userId: users.id,
  username: users.username,
  avatarSeed: users.avatarSeed,
  country: users.country,
  uiLanguage: users.uiLanguage,
  gameLanguage: users.gameLanguage,
  bio: users.bio,
  isAdmin: users.isAdmin,
  createdAt: users.createdAt,
  deletedAt: users.deletedAt,
} as const

/**
 * Adds the identities and the game count to accounts already selected.
 *
 * Two extra queries for the whole page rather than two per row, which is the only reason this is
 * a function instead of a join: `auth_identities` has one row per provider and `games` has one
 * per game, so joining either would multiply the accounts and joining both would multiply them
 * by each other.
 *
 * Shared by `findUsers`, `adminUser` and `editUser` so the three cannot disagree about what an
 * account looks like -- the same reason `PROFILE` is a constant.
 */
async function dressUsers(
  db: Database,
  rows: readonly BareAdminUser[],
): Promise<readonly AdminUser[]> {
  if (rows.length === 0) return []
  const ids = rows.map((row) => row.userId)

  const identities = await db
    .select({
      userId: authIdentities.userId,
      provider: authIdentities.provider,
      email: authIdentities.email,
      emailVerifiedAt: authIdentities.emailVerifiedAt,
      createdAt: authIdentities.createdAt,
    })
    .from(authIdentities)
    .where(inArray(authIdentities.userId, ids))
    .orderBy(asc(authIdentities.createdAt))

  // Finished games only, hidden ones included. The panel is the one place that should see a
  // count disagreeing with what the person's own page shows them.
  const counts = await db
    .select({ userId: games.userId, n: count() })
    .from(games)
    .where(and(inArray(games.userId, ids), isNotNull(games.finishedAt)))
    .groupBy(games.userId)

  const played = new Map(counts.map((row) => [row.userId, row.n]))
  return rows.map((row) => ({
    ...row,
    games: played.get(row.userId) ?? 0,
    identities: identities
      .filter((identity) => identity.userId === row.userId)
      .map(({ provider, email, emailVerifiedAt, createdAt }) => ({
        provider,
        email,
        // A timestamp in the column, a boolean on the wire. "When" is a question worth being able
        // to ask of the database and not one this screen asks.
        emailVerified: emailVerifiedAt !== null,
        createdAt,
      })),
  }))
}

/** What `ADMIN_USER` selects, which is an `AdminUser` without the two assembled fields. */
type BareAdminUser = Omit<AdminUser, 'games' | 'identities'>

/**
 * An admin patch as columns.
 *
 * `columnsOf` for everything an owner could also change, so there is one definition of what
 * renaming somebody writes -- it is two columns, and a name changed without its normalized twin
 * has quietly stopped being unique. Then the one field an owner has no business setting.
 */
function adminColumnsOf(patch: AdminPatch): Record<string, unknown> {
  const values = columnsOf(patch)
  if (patch.isAdmin !== undefined) values.isAdmin = patch.isAdmin
  return values
}

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
