import type { GameDetail, GameRow, GameSummary, PublicProfile } from '../src/account/types.js'
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
}

export interface FakeStore extends Store {
  codes: Map<string, StoredCode & { email: string }>
  users: Map<string, FakeUser>
  sessions: Map<string, { userId: string; expiresAt: Date; revokedAt: Date | null }>
  issued: { id: string; email: string; at: Date }[]
  takenUsernames: Set<string>
  games: { row: GameRow; detail: GameDetail }[]
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
  const identities: (NewIdentity & { userId: string })[] = []

  const profileOf = (user: FakeUser): Profile => ({
    userId: user.userId,
    username: user.username,
    avatarSeed: user.avatarSeed,
    country: user.country,
    uiLanguage: user.uiLanguage,
    gameLanguage: user.gameLanguage,
    bio: user.bio,
  })

  return {
    codes,
    users,
    sessions,
    issued,
    takenUsernames,
    games,
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
      })
      return Promise.resolve(id)
    },
    findSession: (id, now) => {
      const row = sessions.get(id)
      if (row === undefined || row.revokedAt !== null || row.expiresAt <= now) {
        return Promise.resolve(null)
      }
      const user = users.get(row.userId)
      return Promise.resolve(user === undefined ? null : profileOf(user))
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
        .filter((g) => g.row.userId === userId)
        .map((g) => summaryOf(g.row))
        .sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime())
      return Promise.resolve(mine.slice(0, limit))
    },
    gameById: (gameId) => {
      const kept = games.find((one) => one.row.id === gameId)
      if (kept === undefined) return Promise.resolve(null)
      // An unclaimed guest game has nobody to attribute it to and is nobody's to show.
      const owner = users.get(kept.row.userId)
      if (owner === undefined) return Promise.resolve(null)
      return Promise.resolve({
        summary: summaryOf(kept.row),
        detail: kept.detail,
        owner: publicOf(owner),
      })
    },
    profileByUsername: (normalized) => {
      const found = [...users.values()].find(
        (user) => normalizeUsername(user.username) === normalized,
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
