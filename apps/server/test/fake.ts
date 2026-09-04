import type { GameRow, GameSummary, GameWordRow } from '../src/account/types.js'
import type { Profile, StoredCode } from '../src/auth/types.js'
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
  games: { row: GameRow; words: readonly GameWordRow[] }[]
}

export function fakeStore(): FakeStore {
  const codes = new Map<string, StoredCode & { email: string }>()
  const users = new Map<string, FakeUser>()
  const sessions = new Map<string, { userId: string; expiresAt: Date; revokedAt: Date | null }>()
  const issued: { id: string; email: string; at: Date }[] = []
  const takenUsernames = new Set<string>()
  const games: { row: GameRow; words: readonly GameWordRow[] }[] = []

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
    userIdForEmail: (email) => {
      const found = [...users.values()].find((u) => u.email === email)
      return Promise.resolve(found?.userId ?? null)
    },
    createUser: ({ id, email, username }) => {
      if (takenUsernames.has(normalizeUsername(username))) return Promise.resolve(null)
      takenUsernames.add(normalizeUsername(username))
      users.set(id, {
        userId: id,
        email,
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
    insertGame: (row, words) => {
      games.push({ row, words })
      return Promise.resolve()
    },
    gamesOf: (userId, limit) => {
      const mine: GameSummary[] = games
        .filter((g) => g.row.userId === userId)
        .map((g) => ({
          id: g.row.id,
          language: g.row.language,
          difficulty: g.row.difficulty,
          canonical: g.row.canonical,
          imported: g.row.imported,
          score: g.row.score,
          words: g.row.wordsCount,
          rounds: g.row.roundsPlayed,
          engineVersion: g.row.engineVersion,
          finishedAt: g.row.finishedAt,
        }))
        .sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime())
      return Promise.resolve(mine.slice(0, limit))
    },
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
