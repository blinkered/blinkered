import type { GameDetail, GameRow, GameSummary, PublicProfile } from '../src/account/types.js'
import type { AdminGame, AdminReport, AdminUser, NewReport } from '../src/admin/types.js'
import type { NewIdentity, Profile, StoredCode } from '../src/auth/types.js'
import { normalizeUsername } from '../src/auth/usernames.js'
import type { Store } from '../src/types.js'
import type { LoginMail, Mailer } from '../src/auth/mail.js'

/**
 * A store made of Maps.
 *
 * The point of the port is that these tests assert facts about the flow — that a spent code
 * cannot be spent twice, that a wrong guess costs an attempt and a dead one does not, that a
 * rename loses to the unique index — rather than facts about SQL. The Postgres implementation is
 * checked by the integration suite.
 *
 * Shared by every route test rather than one per file, because there is one store: two fakes
 * would eventually disagree about something, and the first place that showed up would be a test
 * passing against a database that could not do it.
 */

export interface FakeUser extends Profile {
  email: string
  createdAt: Date
  deletedAt: Date | null
}

export interface FakeStore extends Store {
  codes: Map<string, StoredCode & { email: string }>
  users: Map<string, FakeUser>
  sessions: Map<string, { userId: string; expiresAt: Date; revokedAt: Date | null }>
  issued: { id: string; email: string; at: Date }[]
  takenUsernames: Set<string>
  games: { row: GameRow; detail: GameDetail }[]
  /** Which games are hidden, by id. A set rather than a column, because `GameRow` has none. */
  hidden: Set<string>
  reports: (NewReport & { createdAt: Date; resolvedAt: Date | null })[]
  /** Every way in that has been recorded, so a test can assert that linking linked. */
  identities: (NewIdentity & { userId: string })[]
}

export function fakeStore(): FakeStore {
  const codes = new Map<string, StoredCode & { email: string }>()
  const users = new Map<string, FakeUser>()
  const sessions = new Map<string, { userId: string; expiresAt: Date; revokedAt: Date | null }>()
  const issued: { id: string; email: string; at: Date }[] = []
  const takenUsernames = new Set<string>()
  const games: { row: GameRow; detail: GameDetail }[] = []
  const hidden = new Set<string>()
  const reports: (NewReport & { createdAt: Date; resolvedAt: Date | null })[] = []
  const identities: (NewIdentity & { userId: string })[] = []

  const profileOf = (user: FakeUser): Profile => ({
    userId: user.userId,
    username: user.username,
    avatarSeed: user.avatarSeed,
    country: user.country,
    uiLanguage: user.uiLanguage,
    gameLanguage: user.gameLanguage,
    bio: user.bio,
    isAdmin: user.isAdmin,
  })

  /**
   * An account as the panel sees it, assembled the way the Postgres store assembles it.
   *
   * Including the count of finished games and the identities, addresses and all, because the
   * point of the fake is that a route test exercises the same shape the real store returns.
   */
  const adminOf = (user: FakeUser): AdminUser => ({
    userId: user.userId,
    username: user.username,
    avatarSeed: user.avatarSeed,
    country: user.country,
    uiLanguage: user.uiLanguage,
    gameLanguage: user.gameLanguage,
    bio: user.bio,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt,
    games: games.filter((one) => one.row.userId === user.userId).length,
    identities: identities
      .filter((identity) => identity.userId === user.userId)
      .map((identity) => ({
        provider: identity.provider,
        email: identity.email,
        emailVerified: identity.emailVerified,
        createdAt: user.createdAt,
      })),
  })

  return {
    codes,
    users,
    sessions,
    issued,
    takenUsernames,
    games,
    hidden,
    reports,
    identities,

    countCodesSince: (email, since) =>
      Promise.resolve(issued.filter((i) => i.email === email && i.at >= since).length),
    insertCode: (row) => {
      codes.set(row.id, { ...row, attempts: 0, consumedAt: null })
      issued.push({ id: row.id, email: row.email, at: new Date() })
      return Promise.resolve()
    },
    latestCode: (email) => {
      const live = [...codes.values()].filter((c) => c.email === email && c.consumedAt === null)
      return Promise.resolve(live.at(-1) ?? null)
    },
    deleteCode: (id) => {
      codes.delete(id)
      const at = issued.findIndex((i) => i.id === id)
      if (at !== -1) issued.splice(at, 1)
      return Promise.resolve()
    },
    recordAttempt: (id) => {
      const row = codes.get(id)
      if (row !== undefined) codes.set(id, { ...row, attempts: row.attempts + 1 })
      return Promise.resolve()
    },
    consumeCode: (id, at) => {
      const row = codes.get(id)
      if (row !== undefined) codes.set(id, { ...row, consumedAt: at })
      return Promise.resolve()
    },
    userIdForIdentity: (provider, accountId) => {
      const found = identities.find(
        (i) => i.provider === provider && i.providerAccountId === accountId,
      )
      return Promise.resolve(found?.userId ?? null)
    },
    userIdForVerifiedEmail: (email) => {
      const found = identities.find((i) => i.email === email && i.emailVerified)
      return Promise.resolve(found?.userId ?? null)
    },
    linkIdentity: ({ userId, identity }) => {
      identities.push({ userId, ...identity })
      return Promise.resolve()
    },
    createUser: ({ id, username, identity }) => {
      if (takenUsernames.has(normalizeUsername(username))) return Promise.resolve(null)
      takenUsernames.add(normalizeUsername(username))
      identities.push({ userId: id, ...identity })
      users.set(id, {
        userId: id,
        email: identity.email ?? '',
        username,
        // The Postgres store seeds the avatar from the row id, and so does this: the picture has
        // to be the same one everywhere without anything being stored to make it so.
        avatarSeed: id,
        country: null,
        uiLanguage: null,
        gameLanguage: null,
        bio: null,
        // Never on sign-up, in the fake as in the schema. Nothing in the auth flow writes this
        // column, so the only way to become one is for another admin to say so.
        isAdmin: false,
        createdAt: new Date(),
        deletedAt: null,
      })
      return Promise.resolve(id)
    },
    findSession: (id, now) => {
      const row = sessions.get(id)
      if (row === undefined || row.revokedAt !== null || row.expiresAt <= now) {
        return Promise.resolve(null)
      }
      const user = users.get(row.userId)
      // A marked account cannot sign in. The Postgres store gets this from the join in
      // `findSession`; the fake has to say it out loud or a test of deletion would pass here
      // and fail against a database.
      if (user === undefined || user.deletedAt !== null) return Promise.resolve(null)
      return Promise.resolve(profileOf(user))
    },
    createSession: (row) => {
      sessions.set(row.id, { userId: row.userId, expiresAt: row.expiresAt, revokedAt: null })
      return Promise.resolve()
    },
    revokeSession: (id, at) => {
      const row = sessions.get(id)
      if (row !== undefined && row.revokedAt === null) sessions.set(id, { ...row, revokedAt: at })
      return Promise.resolve()
    },

    usernameTaken: (normalized) => Promise.resolve(takenUsernames.has(normalized)),
    updateProfile: (userId, patch) => {
      const user = users.get(userId)
      if (user === undefined) return Promise.resolve(null)
      if (patch.username !== undefined) {
        const wanted = normalizeUsername(patch.username)
        // The index's answer, not a lookup's — the same shape the Postgres store reports by
        // catching a unique violation.
        if (wanted !== normalizeUsername(user.username) && takenUsernames.has(wanted)) {
          return Promise.resolve(null)
        }
        takenUsernames.delete(normalizeUsername(user.username))
        takenUsernames.add(wanted)
      }
      const updated: FakeUser = { ...user, ...patch }
      users.set(userId, updated)
      return Promise.resolve(profileOf(updated))
    },
    insertGame: (row, detail) => {
      games.push({ row, detail })
      return Promise.resolve()
    },
    gamesOf: (userId, limit) => {
      const mine: GameSummary[] = games
        // Hidden is hidden from its owner too: a score removed from a board that still sits at
        // the top of a personal page has been removed from nowhere its setter can see.
        .filter((g) => g.row.userId === userId && !hidden.has(g.row.id))
        .map((g) => summaryOf(g.row))
        .sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime())
      return Promise.resolve(mine.slice(0, limit))
    },
    gameById: (gameId) => {
      const kept = games.find((one) => one.row.id === gameId)
      if (kept === undefined || hidden.has(gameId)) return Promise.resolve(null)
      // An unclaimed guest game has nobody to attribute it to and is nobody's to show.
      const owner = users.get(kept.row.userId)
      if (owner === undefined || owner.deletedAt !== null) return Promise.resolve(null)
      return Promise.resolve({
        summary: summaryOf(kept.row),
        detail: kept.detail,
        owner: publicOf(owner),
      })
    },
    insertReport: (row) => {
      // The same duplicate rule the Postgres store applies, said in one line rather than in a
      // five-clause `where`: one open report per person per subject per field.
      const already = reports.some(
        (report) =>
          report.resolvedAt === null &&
          report.reporterUserId === row.reporterUserId &&
          report.field === row.field &&
          report.subjectUserId === row.subjectUserId &&
          report.subjectGameId === row.subjectGameId,
      )
      if (already) return Promise.resolve(false)
      reports.push({ ...row, createdAt: new Date(), resolvedAt: null })
      return Promise.resolve(true)
    },

    findUsers: (text, limit) => {
      const wanted = text === null ? null : text.trim().toLowerCase()
      const found = [...users.values()]
        // A username or a sign-in address, which is the one search box the panel has. Deleted
        // accounts included: this is the surface that has to be able to restore one.
        .filter(
          (user) =>
            wanted === null ||
            wanted === '' ||
            user.username.toLowerCase().includes(wanted) ||
            identities.some(
              (identity) =>
                identity.userId === user.userId &&
                (identity.email ?? '').toLowerCase().includes(wanted),
            ),
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map(adminOf)
      return Promise.resolve(found)
    },

    adminUser: (userId) => {
      const user = users.get(userId)
      return Promise.resolve(user === undefined ? null : adminOf(user))
    },

    editUser: (userId, patch) => {
      const user = users.get(userId)
      if (user === undefined) return Promise.resolve({ ok: false, reason: 'no-user' as const })
      if (patch.username !== undefined) {
        const wanted = normalizeUsername(patch.username)
        // The index's answer, the same shape `updateProfile` reports above.
        if (wanted !== normalizeUsername(user.username) && takenUsernames.has(wanted)) {
          return Promise.resolve({ ok: false, reason: 'username-taken' as const })
        }
        takenUsernames.delete(normalizeUsername(user.username))
        takenUsernames.add(wanted)
      }
      // No `deletedAt` guard, as in the Postgres store: a marked account is still editable, which
      // is what lets an offensive name be fixed on an account on its way out.
      const updated: FakeUser = { ...user, ...patch }
      users.set(userId, updated)
      return Promise.resolve({ ok: true as const, user: adminOf(updated) })
    },

    markUserDeleted: (userId, at) => {
      const user = users.get(userId)
      if (user === undefined) return Promise.resolve(false)
      users.set(userId, { ...user, deletedAt: at })
      return Promise.resolve(true)
    },

    findGames: (filter) => {
      const found = games
        .filter((one) => users.has(one.row.userId))
        .filter(
          (one) =>
            (filter.language === undefined || one.row.language === filter.language) &&
            (filter.difficulty === undefined || one.row.difficulty === filter.difficulty) &&
            (filter.userId === undefined || one.row.userId === filter.userId) &&
            // Absent means both, which is the whole reason it is not a boolean with a default.
            (filter.hidden === undefined || hidden.has(one.row.id) === filter.hidden),
        )
        // The board's order, which is `compareResults` in @blinkered/engine: score down, then
        // rounds up, then the clock up. A listing sorted any other way would not be the board.
        .sort(
          (a, b) =>
            b.row.score - a.row.score ||
            a.row.roundsPlayed - b.row.roundsPlayed ||
            a.row.finishedAt.getTime() - b.row.finishedAt.getTime(),
        )
        .slice(0, filter.limit)
        .map((one): AdminGame => ({
          ...summaryOf(one.row),
          hidden: hidden.has(one.row.id),
          imported: one.row.imported,
          // Nothing is eligible in phase A, because the server issues no seeds. The column
          // exists and says so; see docs/ACCOUNTS.md.
          leaderboardEligible: false,
          owner: {
            userId: one.row.userId,
            username: users.get(one.row.userId)?.username ?? '',
          },
        }))
      return Promise.resolve(found)
    },

    setGameHidden: (gameId, wanted) => {
      if (!games.some((one) => one.row.id === gameId)) return Promise.resolve(false)
      if (wanted) hidden.add(gameId)
      else hidden.delete(gameId)
      return Promise.resolve(true)
    },

    findReports: (openOnly, limit) => {
      const found = reports
        .filter((report) => !openOnly || report.resolvedAt === null)
        // Unresolved first, oldest first inside that, which is the order to work in.
        .sort(
          (a, b) =>
            Number(a.resolvedAt !== null) - Number(b.resolvedAt !== null) ||
            a.createdAt.getTime() - b.createdAt.getTime(),
        )
        .slice(0, limit)
        .map((report): AdminReport => {
          const reporter = users.get(report.reporterUserId)
          const subject =
            report.subjectUserId === null ? undefined : users.get(report.subjectUserId)
          const game = games.find((one) => one.row.id === report.subjectGameId)
          return {
            id: report.id,
            field: report.field,
            reason: report.reason,
            createdAt: report.createdAt,
            resolvedAt: report.resolvedAt,
            // Nullable because the columns are: a report outlives the account that filed it.
            reporter:
              reporter === undefined
                ? null
                : { userId: reporter.userId, username: reporter.username },
            subjectUser:
              subject === undefined ? null : { userId: subject.userId, username: subject.username },
            subjectGame: game === undefined ? null : { id: game.row.id, score: game.row.score },
          }
        })
      return Promise.resolve(found)
    },

    setReportResolved: (id, at) => {
      const at_ = reports.findIndex((report) => report.id === id)
      if (at_ === -1) return Promise.resolve(false)
      const report = reports[at_] as (typeof reports)[number]
      reports[at_] = { ...report, resolvedAt: at }
      return Promise.resolve(true)
    },

    profileByUsername: (normalized) => {
      // A deleted account is not a profile, and gives the same answer as a name nobody has.
      const found = [...users.values()].find(
        (user) => normalizeUsername(user.username) === normalized && user.deletedAt === null,
      )
      return Promise.resolve(found === undefined ? null : publicOf(found))
    },
  }
}

/** A person as a stranger sees them: never the email, never anything `Profile` gains later. */
function publicOf(user: FakeUser): PublicProfile {
  return {
    userId: user.userId,
    username: user.username,
    avatarSeed: user.avatarSeed,
    country: user.country,
    bio: user.bio,
  }
}

/** One game as a listing shows it. Named once, because two methods have to agree about it. */
function summaryOf(row: GameRow): GameSummary {
  return {
    id: row.id,
    language: row.language,
    difficulty: row.difficulty,
    canonical: row.canonical,
    speedMultiplier: row.speedMultiplier,
    score: row.score,
    words: row.wordsCount,
    rounds: row.roundsPlayed,
    engineVersion: row.engineVersion,
    finishedAt: row.finishedAt,
  }
}

export function capturingMailer(): Mailer & { sent: LoginMail[] } {
  const sent: LoginMail[] = []
  return {
    sent,
    send: (mail) => {
      sent.push(mail)
      return Promise.resolve()
    },
  }
}

/**
 * Grants the admin flag directly.
 *
 * A function rather than a line inside a test, because it is a statement about the design: the
 * auth flow never writes `is_admin` and the panel refuses to write it on the caller's own row, so
 * somewhere there has to be a hand on a database. In a test the hand is this, and in a deployment
 * it is a `psql`.
 */
export function makeAdmin(store: FakeStore, userId: string, isAdmin = true): void {
  const user = store.users.get(userId)
  if (user === undefined) throw new Error(`no such fake user: ${userId}`)
  store.users.set(userId, { ...user, isAdmin })
}
