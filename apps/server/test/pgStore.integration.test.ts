import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { connect } from '../src/db.js'
import { runMigrations } from '../src/migrate.js'
import { freshDatabase, integrationConfig } from './integrationDb.js'
import { pgStore } from '../src/pgStore.js'
import { DATABASE_SCHEMA, authIdentities, gameDetail, reports, users } from '../src/schema.js'
import type { GameDetail } from '../src/account/types.js'
import type { Store } from '../src/types.js'

/*
 * The Postgres store, against a Postgres.
 *
 * This is the half of the codebase the unit suite deliberately does not cover: `vitest.config.ts`
 * excludes `pgStore.ts` because a mocked pool proves the mock was called. What is worth checking
 * is what only a real database can answer — that the unique index is what refuses a taken name
 * and that the store reports losing it as `null` rather than as a 500, that a revoked session
 * stops resolving, and that a game and its words are written together or not at all.
 */
const config = integrationConfig

let open: ReturnType<typeof connect> | undefined
let store: Store | undefined

beforeAll(async () => {
  await freshDatabase()
  await runMigrations(config)
  open = connect(config)
  store = pgStore(open.db)
}, 60_000)

afterAll(async () => {
  await open?.close()
})

function theStore(): Store {
  if (store === undefined) throw new Error('the database was never opened')
  return store
}

/** The connection itself, for the few assertions that are about a column rather than the store. */
function theDb(): NonNullable<typeof open>['db'] {
  if (open === undefined) throw new Error('the database was never opened')
  return open.db
}

let counter = 0
/** A signed-in account, made the way the sign-in route makes one. */
async function account(username?: string): Promise<{ userId: string; token: string }> {
  counter += 1
  const userId = `user-${String(counter)}-${String(Date.now())}`
  const created = await theStore().createUser({
    id: userId,
    username: username ?? `person-${String(counter)}-${String(Date.now())}`,
    identity: {
      provider: 'email',
      providerAccountId: `${userId}@example.com`,
      email: `${userId}@example.com`,
      emailVerified: true,
    },
  })
  expect(created).toBe(userId)
  const token = `session-${userId}`
  await theStore().createSession({
    id: token,
    userId,
    kind: 'cookie',
    expiresAt: new Date(Date.now() + 60_000),
  })
  return { userId, token }
}

describe('sessions', () => {
  it('resolves to the whole profile, so one query answers /v1/me', async () => {
    const { userId, token } = await account()
    const found = await theStore().findSession(token, new Date())
    expect(found).toMatchObject({ userId, avatarSeed: userId, bio: null, country: null })
  })

  it('stops resolving once revoked, which is what signing out has to mean', async () => {
    const { token } = await account()
    await theStore().revokeSession(token, new Date())
    expect(await theStore().findSession(token, new Date())).toBeNull()
  })

  it('keeps the moment it actually ended when revoked twice', async () => {
    const { token } = await account()
    const first = new Date(Date.now() - 10_000)
    await theStore().revokeSession(token, first)
    await theStore().revokeSession(token, new Date())
    const [row] = await (open as NonNullable<typeof open>).db.execute<{ revoked_at: Date }>(
      sql`select revoked_at from ${sql.identifier(DATABASE_SCHEMA)}.sessions where id = ${token}`,
    )
    expect(new Date(row?.revoked_at ?? 0).getTime()).toBe(first.getTime())
  })
})

describe('renaming', () => {
  it('writes both columns, so uniqueness keeps meaning something', async () => {
    const { userId } = await account()
    const updated = await theStore().updateProfile(userId, { username: 'Trout' })
    expect(updated?.username).toBe('Trout')
    // Uniqueness is on the normalized form, so the lower-cased one has to have moved with it.
    expect(await theStore().usernameTaken('trout')).toBe(true)
  })

  it('reports losing the unique index as null rather than as an exception', async () => {
    await account('kestrel-one')
    const second = await account()
    // A check followed by an update is a race; the index is not. The caller turns this into 409.
    expect(await theStore().updateProfile(second.userId, { username: 'Kestrel-One' })).toBeNull()
  })

  it('leaves the rest of the profile alone, which is what makes it a patch', async () => {
    const { userId } = await account()
    await theStore().updateProfile(userId, { bio: 'fly fishing', country: 'US' })
    const updated = await theStore().updateProfile(userId, { gameLanguage: 'fi' })
    expect(updated).toMatchObject({ bio: 'fly fishing', country: 'US', gameLanguage: 'fi' })
  })

  it('clears a field asked to be cleared', async () => {
    const { userId } = await account()
    await theStore().updateProfile(userId, { bio: 'here' })
    expect((await theStore().updateProfile(userId, { bio: null }))?.bio).toBeNull()
  })

  it('reads the profile back for a patch that changes nothing', async () => {
    // Drizzle refuses `set({})` outright, so the empty patch is a read rather than an error.
    const { userId } = await account()
    expect((await theStore().updateProfile(userId, {}))?.userId).toBe(userId)
  })

  it('is null for an account that is not there', async () => {
    expect(await theStore().updateProfile('nobody', { bio: 'hello' })).toBeNull()
    expect(await theStore().updateProfile('nobody', {})).toBeNull()
  })
})

describe('keeping games', () => {
  const gameFor = (userId: string, at: Date, score: number) => ({
    id: `game-${userId}-${String(at.getTime())}`,
    userId,
    seed: 42,
    source: 'web',
    imported: true,
    clientKey: null,
    difficulty: 'medium',
    language: 'en',
    canonical: true,
    n: 12,
    speedMultiplier: 1.4,
    holdTicks: 4,
    initialFlips: 168,
    wMin: 25,
    minWordLength: 4,
    wordCompleteMode: 'spend',
    flipEconomy: 'fibonacci',
    chargeFullRound: false,
    wildChance: 0.02,
    replaceChance: 0.5,
    score,
    wordsCount: 1,
    roundsPlayed: 6,
    engineVersion: '0.3.0',
    dictionaryVersion: 'abc123',
    startedAt: new Date(at.getTime() - 60_000),
    finishedAt: at,
  })

  const detailFor = (word: string): GameDetail => ({
    boards: [{ tiles: 'A B C' }, { tiles: 'A B D', wilds: [1] }],
    words: [{ word, tiles: 5, points: 20, round: 0, flips: 8, tick: 42, wilds: [1] }],
  })

  /*
   * The dedupe, against the real partial unique index.
   *
   * The fake store models this and cannot prove it: what is under test here is that
   * `onConflictDoNothing` with no inference target actually catches
   * `games_user_client_key_key`, that the document is not written a second time, and that two
   * nulls do not collide. Every one of those is a property of Postgres rather than of our code.
   */
  it('stores a game once per client key, and says which row holds it', async () => {
    const { userId } = await account()
    const at = new Date(Date.now() - 1000)
    const queued = { ...gameFor(userId, at, 20), clientKey: 'queued-1' }

    const first = await theStore().insertGame(queued, detailFor('HOUSE'))
    expect(first).toEqual({ id: queued.id, score: 20 })

    // The same game again, as a device retrying after a lost response. A different id and a
    // different score, so the answer cannot accidentally be right.
    const retried = { ...queued, id: `${queued.id}-again`, score: 999 }
    const second = await theStore().insertGame(retried, detailFor('RIVER'))

    // The original row, with the original score. Not the id just offered, and not 999.
    expect(second).toEqual({ id: queued.id, score: 20 })
    expect(await theStore().gamesOf(userId, 10)).toHaveLength(1)

    // And the document was not rewritten: the second attempt's word never reached the store.
    const found = await theStore().gameById(queued.id)
    expect(found?.detail?.words.map((word) => word.word)).toEqual(['HOUSE'])
  })

  it('lets one key belong to each of two people', async () => {
    const mine = await account()
    const theirs = await account()
    const at = new Date(Date.now() - 1000)
    // The key is generated on a device with no coordination, so two people can produce the same
    // one. The index is scoped to the user precisely so that one cannot block the other.
    await theStore().insertGame(
      { ...gameFor(mine.userId, at, 20), clientKey: 'same' },
      detailFor('HOUSE'),
    )
    await theStore().insertGame(
      { ...gameFor(theirs.userId, at, 30), clientKey: 'same' },
      detailFor('RIVER'),
    )
    expect(await theStore().gamesOf(mine.userId, 10)).toHaveLength(1)
    expect(await theStore().gamesOf(theirs.userId, 10)).toHaveLength(1)
  })

  it('keeps every keyless game, because two nulls never collide', async () => {
    const { userId } = await account()
    const older = new Date(Date.now() - 100_000)
    const newer = new Date(Date.now() - 1000)
    await theStore().insertGame(gameFor(userId, older, 12), detailFor('HOUSE'))
    await theStore().insertGame(gameFor(userId, newer, 20), detailFor('RIVER'))
    expect(await theStore().gamesOf(userId, 10)).toHaveLength(2)
  })

  it('writes a game and its document together, and lists it newest first', async () => {
    const { userId } = await account()
    const older = new Date(Date.now() - 100_000)
    const newer = new Date(Date.now() - 1000)
    await theStore().insertGame(gameFor(userId, older, 12), detailFor('HOUSE'))
    await theStore().insertGame(gameFor(userId, newer, 20), detailFor('RIVER'))

    const listed = await theStore().gamesOf(userId, 10)
    expect(listed.map((game) => game.score)).toEqual([20, 12])
    expect(listed[0]).toMatchObject({ canonical: true, language: 'en' })
    // Bookkeeping stays in the column and off the wire: a listing has no use for it, and a
    // field nothing renders is one somebody renders later.
    expect(listed[0]).not.toHaveProperty('imported')
    // And the document is not in the listing either. It is fetched whole, by id, or not at all.
    expect(listed[0]).not.toHaveProperty('detail')
  })

  it('round-trips the document through jsonb unchanged', async () => {
    const { userId } = await account()
    const at = new Date(Date.now() - 1000)
    const detail = detailFor('KESTREL')
    await theStore().insertGame(gameFor(userId, at, 20), detail)
    const found = await theStore().gameById(gameFor(userId, at, 20).id)
    // Numbers, nested arrays and the optional field all survive, which is the only thing a
    // fake could not have told us: jsonb canonicalizes, and this is what it does to our shape.
    expect(found?.detail).toEqual(detail)
    expect(found?.summary.score).toBe(20)
  })

  it('hands a game to anybody, with who played it attached', async () => {
    // Games are public. This used to be scoped to the owner and answer null to everybody else;
    // see the note on `gameById`.
    const mine = await account('otter-keeper')
    const at = new Date(Date.now() - 1000)
    await theStore().insertGame(gameFor(mine.userId, at, 5), detailFor('OTTER'))
    const found = await theStore().gameById(gameFor(mine.userId, at, 5).id)
    expect(found?.owner).toMatchObject({ username: 'otter-keeper', avatarSeed: mine.userId })
    // Never the address it signs in with, whatever else a profile grows.
    expect(found?.owner).not.toHaveProperty('email')
  })

  it('finds a profile by any casing of the name, and not a banned one', async () => {
    const { userId } = await account('Heron-Watcher')
    expect((await theStore().profileByUsername('heron-watcher'))?.userId).toBe(userId)
    await (open as NonNullable<typeof open>).db.execute(
      sql`update ${sql.identifier(DATABASE_SCHEMA)}.users set banned_at = now() where id = ${userId}`,
    )
    // Same answer as a name nobody has: telling them apart would report who used to be here.
    expect(await theStore().profileByUsername('heron-watcher')).toBeNull()
  })

  it('will not show a game whose owner is banned, nor an unclaimed one', async () => {
    const { userId } = await account()
    const at = new Date(Date.now() - 1000)
    await theStore().insertGame(gameFor(userId, at, 9), detailFor('WREN'))
    const id = gameFor(userId, at, 9).id
    expect(await theStore().gameById(id)).not.toBeNull()
    await (open as NonNullable<typeof open>).db.execute(
      sql`update ${sql.identifier(DATABASE_SCHEMA)}.users set banned_at = now() where id = ${userId}`,
    )
    expect(await theStore().gameById(id)).toBeNull()
  })

  it('cascades the document away with the game', async () => {
    const { userId } = await account()
    const at = new Date(Date.now() - 1000)
    await theStore().insertGame(gameFor(userId, at, 7), detailFor('SPARROW'))
    await (open as NonNullable<typeof open>).db.execute(
      sql`delete from ${sql.identifier(DATABASE_SCHEMA)}.games where id = ${gameFor(userId, at, 7).id}`,
    )
    const [row] = await (open as NonNullable<typeof open>).db.execute<{ n: number }>(
      sql`select count(*)::int as n from ${sql.identifier(DATABASE_SCHEMA)}.game_detail
          where game_id = ${gameFor(userId, at, 7).id}`,
    )
    expect(row?.n).toBe(0)
  })

  it('keeps a game that found nothing', async () => {
    const { userId } = await account()
    await theStore().insertGame(gameFor(userId, new Date(), 0), {
      boards: [{ tiles: 'A B C' }],
      words: [],
    })
    expect(await theStore().gamesOf(userId, 10)).toHaveLength(1)
  })

  it('shows nobody else theirs, and honours the limit', async () => {
    const mine = await account()
    const theirs = await account()
    for (let i = 0; i < 3; i += 1) {
      await theStore().insertGame(gameFor(mine.userId, new Date(Date.now() - i * 1000), i), {
        boards: [{ tiles: 'A B C' }],
        words: [],
      })
    }
    expect(await theStore().gamesOf(mine.userId, 2)).toHaveLength(2)
    expect(await theStore().gamesOf(theirs.userId, 10)).toEqual([])
  })

  it('leaves a hidden game out, including from the person who set it', async () => {
    const { userId } = await account()
    const at = new Date()
    await theStore().insertGame(gameFor(userId, at, 99), {
      boards: [{ tiles: 'A B C' }],
      words: [],
    })
    await (open as NonNullable<typeof open>).db.execute(
      sql`update ${sql.identifier(DATABASE_SCHEMA)}.games set hidden = true
          where id = ${gameFor(userId, at, 99).id}`,
    )
    // A score removed from a board that still sits at the top of a personal page has been removed
    // from nowhere the person who set it can see.
    expect(await theStore().gamesOf(userId, 10)).toEqual([])
  })
})

describe('identities', () => {
  /*
   * The Apple half of `auth_identities`, against real SQL.
   *
   * These are here rather than in the unit suite because the facts being checked belong to the
   * database: that the unique index on `(provider, provider_account_id)` is the thing deciding
   * whether a `sub` is already spoken for, and that two providers can name the same person
   * without colliding. A Map-backed fake agrees with any answer you write into it.
   */
  const APPLE_SUB = '001234.abcdef.5678'

  it('finds an account by provider and id, and not by the other provider', async () => {
    const { userId } = await account()
    await theStore().linkIdentity({
      id: `apple-${userId}`,
      userId,
      identity: {
        provider: 'apple',
        providerAccountId: APPLE_SUB,
        email: 'player@example.com',
        emailVerified: true,
      },
    })
    expect(await theStore().userIdForIdentity('apple', APPLE_SUB)).toBe(userId)
    // The same string under the other provider is a different identity, not the same one.
    expect(await theStore().userIdForIdentity('email', APPLE_SUB)).toBeNull()
  })

  it('lets one account hold both an email and an Apple identity, which is what linking is', async () => {
    const { userId } = await account()
    const email = await theStore().userIdForIdentity('email', `${userId}@example.com`)
    await theStore().linkIdentity({
      id: `apple-both-${userId}`,
      userId,
      identity: {
        provider: 'apple',
        providerAccountId: `sub-${userId}`,
        email: `${userId}@example.com`,
        emailVerified: true,
      },
    })
    expect(email).toBe(userId)
    expect(await theStore().userIdForIdentity('apple', `sub-${userId}`)).toBe(userId)
  })

  it('refuses to hand one Apple sub to two accounts', async () => {
    // The unique index is the authority. Without it a race in the callback could attach the same
    // person to two accounts, and the second one would be silently unreachable afterwards.
    const first = await account()
    const second = await account()
    const identity = {
      provider: 'apple' as const,
      providerAccountId: `contested-${first.userId}`,
      email: null,
      emailVerified: false,
    }
    await theStore().linkIdentity({ id: `a-${first.userId}`, userId: first.userId, identity })
    await expect(
      theStore().linkIdentity({ id: `b-${second.userId}`, userId: second.userId, identity }),
    ).rejects.toThrow()
  })

  it('finds an account by a verified address whatever provider vouched for it', async () => {
    const { userId } = await account()
    const shared = `shared-${userId}@example.com`
    await theStore().linkIdentity({
      id: `apple-shared-${userId}`,
      userId,
      identity: {
        provider: 'apple',
        providerAccountId: `shared-sub-${userId}`,
        email: shared,
        emailVerified: true,
      },
    })
    // Apple vouched for it and there is no email identity holding it at all. A code sign-in at
    // this address has to find this account rather than start another one.
    expect(await theStore().userIdForIdentity('email', shared)).toBeNull()
    expect(await theStore().userIdForVerifiedEmail(shared)).toBe(userId)
  })

  it('ignores an address nobody verified', async () => {
    const { userId } = await account()
    const claimed = `claimed-${userId}@example.com`
    await theStore().linkIdentity({
      id: `apple-claimed-${userId}`,
      userId,
      identity: {
        provider: 'apple',
        providerAccountId: `claimed-sub-${userId}`,
        email: claimed,
        emailVerified: false,
      },
    })
    expect(await theStore().userIdForVerifiedEmail(claimed)).toBeNull()
  })

  it('prefers the oldest account when two hold the same verified address', async () => {
    // Possible where one was made before this rule existed. The account somebody has been using
    // is the older one, so that is the one a later sign-in should arrive at.
    const first = await account()
    const second = await account()
    const shared = `contested-${first.userId}@example.com`
    for (const [at, who] of [first, second].entries()) {
      await theStore().linkIdentity({
        id: `dup-${who.userId}`,
        userId: who.userId,
        identity: {
          provider: 'apple',
          providerAccountId: `dup-sub-${String(at)}-${who.userId}`,
          email: shared,
          emailVerified: true,
        },
      })
    }
    expect(await theStore().userIdForVerifiedEmail(shared)).toBe(first.userId)
  })

  it('records an unverified address without a verification timestamp', async () => {
    const { userId } = await account()
    await theStore().linkIdentity({
      id: `unverified-${userId}`,
      userId,
      identity: {
        provider: 'apple',
        providerAccountId: `unverified-sub-${userId}`,
        email: 'maybe@example.com',
        emailVerified: false,
      },
    })
    const [row] = await theDb()
      .select({ verifiedAt: authIdentities.emailVerifiedAt, email: authIdentities.email })
      .from(authIdentities)
      .where(eq(authIdentities.id, `unverified-${userId}`))
    expect(row?.email).toBe('maybe@example.com')
    // Null rather than now(). "We were told an address" and "we know it answered" are different
    // facts, and the linking rule turns on the second one.
    expect(row?.verifiedAt).toBeNull()
  })
})

/*
 * Moderation, against a Postgres.
 *
 * Everything here is a fact a fake could not have told us. The search is `ilike` plus an `exists`
 * subquery, and a join in its place would return one account per way it signs in. The taken-name
 * refusal arrives as a driver error wrapped by Drizzle, which is the bug `isUniqueViolation` was
 * written for. `nulls first` is in the query because Postgres sorts nulls last under `asc`. And
 * `on delete set null` on a reporter is the database's behaviour, not ours.
 */
describe('moderating', () => {
  const gameFor = (
    userId: string,
    at: Date,
    over: { score: number; rounds?: number; language?: string },
  ) => ({
    id: `mod-game-${userId}-${String(at.getTime())}`,
    userId,
    seed: 42,
    source: 'web',
    imported: false,
    clientKey: null,
    difficulty: 'medium',
    language: over.language ?? 'en',
    canonical: true,
    n: 12,
    speedMultiplier: 1.4,
    holdTicks: 4,
    initialFlips: 168,
    wMin: 25,
    minWordLength: 4,
    wordCompleteMode: 'spend',
    flipEconomy: 'fibonacci',
    chargeFullRound: false,
    wildChance: 0.02,
    replaceChance: 0.5,
    score: over.score,
    wordsCount: 1,
    roundsPlayed: over.rounds ?? 6,
    engineVersion: '0.3.0',
    dictionaryVersion: 'abc123',
    startedAt: new Date(at.getTime() - 60_000),
    finishedAt: at,
  })

  const oneWord: GameDetail = {
    boards: [{ tiles: 'A B C' }],
    words: [{ word: 'OTTER', tiles: 5, points: 20, round: 0, flips: 8, tick: 42 }],
  }

  describe('finding an account', () => {
    it('matches a username without caring about case', async () => {
      const { userId } = await account(`Trout-${String(Date.now())}`)
      const found = await theStore().findUsers('trout-', 50)
      expect(found.map((user) => user.userId)).toContain(userId)
    })

    it('matches a sign-in address, which is the only place the API returns one', async () => {
      const { userId } = await account()
      const found = await theStore().findUsers(`${userId}@example.com`, 50)
      expect(found).toHaveLength(1)
      expect(found[0]?.identities.map((identity) => identity.email)).toEqual([
        `${userId}@example.com`,
      ])
      expect(found[0]?.identities[0]?.emailVerified).toBe(true)
    })

    it('returns an account once however many ways it signs in', async () => {
      // The reason the search is an `exists` subquery rather than a join: `auth_identities` has
      // one row per provider, so a join would hand back this person twice and the caller would
      // have to know to collapse them.
      const { userId } = await account()
      await theStore().linkIdentity({
        id: `second-${userId}`,
        userId,
        identity: {
          provider: 'apple',
          providerAccountId: `sub-${userId}`,
          email: `${userId}@example.com`,
          emailVerified: true,
        },
      })
      const found = await theStore().findUsers(`${userId}@example.com`, 50)
      expect(found).toHaveLength(1)
      expect(found[0]?.identities).toHaveLength(2)
    })

    it('counts games without multiplying the identities by them', async () => {
      // The other half of the same trap. Joining `games` as well would have given this account
      // one row per game per identity.
      const { userId } = await account()
      await theStore().linkIdentity({
        id: `also-${userId}`,
        userId,
        identity: {
          provider: 'google',
          providerAccountId: `g-${userId}`,
          email: `${userId}@example.com`,
          emailVerified: true,
        },
      })
      for (const ago of [1000, 2000]) {
        const at = new Date(Date.now() - ago)
        await theStore().insertGame(gameFor(userId, at, { score: 10 }), oneWord)
      }
      const found = await theStore().adminUser(userId)
      expect(found?.games).toBe(2)
      expect(found?.identities).toHaveLength(2)
    })

    it('finds nobody without pretending otherwise', async () => {
      expect(await theStore().findUsers('nobody-at-all-here', 50)).toEqual([])
      expect(await theStore().adminUser('no-such-user')).toBeNull()
    })

    it('treats an empty search as no search', async () => {
      await account()
      expect((await theStore().findUsers('   ', 50)).length).toBeGreaterThan(0)
      expect((await theStore().findUsers(null, 50)).length).toBeGreaterThan(0)
    })
  })

  describe('editing an account', () => {
    it('writes the normalized name with the name, or uniqueness quietly stops holding', async () => {
      const { userId } = await account()
      const result = await theStore().editUser(userId, { username: 'Angler' })
      expect(result.ok && result.user.username).toBe('Angler')
      // Which is to say the index moved with it: the lookup is on the normalized column.
      expect(await theStore().profileByUsername('angler')).toMatchObject({ userId })
    })

    it('reports a taken name as an answer rather than as a 500', async () => {
      // The bug this pins: Drizzle wraps the driver's error, so reading `failure.code` off the
      // error in hand finds `undefined` and the rename comes back as a 500. `isUniqueViolation`
      // walks the `cause` chain. No fake could have produced the wrapper.
      const first = await account()
      const second = await account()
      await theStore().editUser(first.userId, { username: 'Contested' })
      const result = await theStore().editUser(second.userId, { username: 'CONTESTED' })
      expect(result).toEqual({ ok: false, reason: 'username-taken' })
    })

    it('says so when there is no such account, on a write and on a read', async () => {
      expect(await theStore().editUser('no-such-user', { bio: 'hi' })).toEqual({
        ok: false,
        reason: 'no-user',
      })
      // An empty patch is a read, and it has to give the same answer.
      expect(await theStore().editUser('no-such-user', {})).toEqual({
        ok: false,
        reason: 'no-user',
      })
    })

    it('reads the account back when the patch mentions nothing', async () => {
      const { userId } = await account()
      const result = await theStore().editUser(userId, {})
      expect(result.ok && result.user.userId).toBe(userId)
    })

    it('grants and removes the flag, and grants it to nobody by default', async () => {
      const { userId } = await account()
      expect((await theStore().adminUser(userId))?.isAdmin).toBe(false)
      expect((await theStore().editUser(userId, { isAdmin: true })).ok).toBe(true)
      expect((await theStore().adminUser(userId))?.isAdmin).toBe(true)
      // And the session sees it, which is what `GET /v1/me` hands the browser.
      const session = `admin-session-${userId}`
      await theStore().createSession({
        id: session,
        userId,
        kind: 'cookie',
        expiresAt: new Date(Date.now() + 60_000),
      })
      expect((await theStore().findSession(session, new Date()))?.isAdmin).toBe(true)

      await theStore().editUser(userId, { isAdmin: false })
      expect((await theStore().findSession(session, new Date()))?.isAdmin).toBe(false)
    })
  })

  describe('banning an account', () => {
    it('ends every session and takes the profile out of view', async () => {
      const { userId, token } = await account(`going-${String(Date.now())}`)
      const at = new Date()
      await theStore().insertGame(gameFor(userId, at, { score: 10 }), oneWord)
      const gameId = gameFor(userId, at, { score: 10 }).id

      expect(await theStore().setBanned(userId, new Date())).toBe(true)
      // `findSession` joins `users` and checks the column, so this is a consequence rather than
      // a second step -- and it is the reason one column is the whole of a ban.
      expect(await theStore().findSession(token, new Date())).toBeNull()
      expect(await theStore().profileByUsername(`going-${String(at.getTime())}`)).toBeNull()
      // A game belonging to a banned account is no such game, the same answer as one that never
      // existed. The inner join and the `isNull(users.bannedAt)` both say so.
      expect(await theStore().gameById(gameId)).toBeNull()
      // Still there for the panel, which is the one surface that has to see it.
      expect((await theStore().adminUser(userId))?.bannedAt).toBeInstanceOf(Date)
    })

    it('lifts a ban', async () => {
      const { userId, token } = await account()
      await theStore().setBanned(userId, new Date())
      expect(await theStore().setBanned(userId, null)).toBe(true)
      expect(await theStore().findSession(token, new Date())).toMatchObject({ userId })
    })

    it('still edits a banned account, so a bad name can be fixed rather than only hidden', async () => {
      // The one deliberate difference from `updateProfile`, which guards on `bannedAt`: the row
      // stays for good, so the name does too, and it should be fixable.
      const { userId } = await account()
      await theStore().setBanned(userId, new Date())
      const renamed = await theStore().editUser(userId, { username: `Banned${String(Date.now())}` })
      expect(renamed.ok).toBe(true)
      // And `updateProfile` still refuses, which is the pair of behaviours worth pinning together.
      expect(await theStore().updateProfile(userId, { bio: 'hello' })).toBeNull()
    })

    it('says so when there is no such account', async () => {
      expect(await theStore().setBanned('no-such-user', new Date())).toBe(false)
    })
  })

  describe('curating a board', () => {
    it('lists games in the order a board has them', async () => {
      // Score down, rounds up, clock up -- `compareResults` in @blinkered/engine, and the column
      // order `games_leaderboard_idx` is built for. A listing sorted any other way would not be
      // showing the board it exists to judge.
      const { userId } = await account()
      const base = Date.now()
      const rows = [
        { at: new Date(base - 3000), score: 40, rounds: 9 },
        { at: new Date(base - 2000), score: 40, rounds: 6 },
        { at: new Date(base - 1000), score: 90, rounds: 6 },
      ]
      for (const row of rows) {
        await theStore().insertGame(
          gameFor(userId, row.at, { score: row.score, rounds: row.rounds }),
          oneWord,
        )
      }
      const listed = await theStore().findGames({ userId, limit: 50 })
      expect(listed.map((game) => [game.score, game.rounds])).toEqual([
        [90, 6],
        [40, 6],
        [40, 9],
      ])
      expect(listed[0]?.owner.userId).toBe(userId)
      expect(listed[0]).toMatchObject({ hidden: false, leaderboardEligible: false })
    })

    it('filters on language and difficulty', async () => {
      const { userId } = await account()
      const base = Date.now()
      await theStore().insertGame(
        gameFor(userId, new Date(base - 5000), { score: 10, language: 'fi' }),
        oneWord,
      )
      await theStore().insertGame(
        gameFor(userId, new Date(base - 4000), { score: 10, language: 'en' }),
        oneWord,
      )
      expect(await theStore().findGames({ userId, language: 'fi', limit: 50 })).toHaveLength(1)
      expect(await theStore().findGames({ userId, difficulty: 'insane', limit: 50 })).toEqual([])
      expect(await theStore().findGames({ userId, difficulty: 'medium', limit: 50 })).toHaveLength(
        2,
      )
    })

    it('hides a game from everywhere a player can see, and brings it back', async () => {
      const { userId } = await account()
      const at = new Date()
      await theStore().insertGame(gameFor(userId, at, { score: 99 }), oneWord)
      const gameId = gameFor(userId, at, { score: 99 }).id

      expect(await theStore().setGameHidden(gameId, true)).toBe(true)
      // Gone from the permalink and from its owner's own page. A score removed from a board that
      // still sits at the top of a personal page has been removed from nowhere its setter looks.
      expect(await theStore().gameById(gameId)).toBeNull()
      expect((await theStore().gamesOf(userId, 50)).map((game) => game.id)).not.toContain(gameId)
      // And still findable here, or nothing could ever be un-hidden.
      expect(await theStore().findGames({ userId, hidden: true, limit: 50 })).toHaveLength(1)
      expect(await theStore().findGames({ userId, hidden: false, limit: 50 })).toEqual([])
      expect(await theStore().findGames({ userId, limit: 50 })).toHaveLength(1)

      await theStore().setGameHidden(gameId, false)
      expect(await theStore().gameById(gameId)).not.toBeNull()
    })

    it('says so when there is no such game', async () => {
      expect(await theStore().setGameHidden('no-such-game', true)).toBe(false)
    })
  })

  describe('the reports queue', () => {
    it('writes one, reads both ends, and refuses a second about the same thing', async () => {
      const reporter = await account()
      const subject = await account()
      const row = {
        id: `report-${reporter.userId}`,
        reporterUserId: reporter.userId,
        subjectUserId: subject.userId,
        subjectGameId: null,
        field: 'bio',
        reason: 'buying followers',
      }
      expect(await theStore().insertReport(row)).toBe(true)
      // One open report per person per subject per field. The duplicate check has to compare a
      // null subject with `is null` rather than `=`, which is the branch a fake cannot check.
      expect(await theStore().insertReport({ ...row, id: `${row.id}-again` })).toBe(false)

      const open = await theStore().findReports(true, 50)
      const mine = open.find((report) => report.id === row.id)
      expect(mine).toMatchObject({
        field: 'bio',
        reason: 'buying followers',
        resolvedAt: null,
        reporter: { userId: reporter.userId },
        subjectUser: { userId: subject.userId },
        subjectGame: null,
      })
    })

    it('carries the game and its score when the objection is to one', async () => {
      const reporter = await account()
      const subject = await account()
      const at = new Date()
      await theStore().insertGame(gameFor(subject.userId, at, { score: 77 }), oneWord)
      const gameId = gameFor(subject.userId, at, { score: 77 }).id
      const id = `report-score-${subject.userId}`
      expect(
        await theStore().insertReport({
          id,
          reporterUserId: reporter.userId,
          subjectUserId: subject.userId,
          subjectGameId: gameId,
          field: 'score',
          reason: null,
        }),
      ).toBe(true)
      const found = (await theStore().findReports(true, 200)).find((report) => report.id === id)
      expect(found?.subjectGame).toEqual({ id: gameId, score: 77 })
    })

    it('resolves one, reopens it, and keeps the open ones first', async () => {
      const reporter = await account()
      const subject = await account()
      const id = `report-order-${subject.userId}`
      await theStore().insertReport({
        id,
        reporterUserId: reporter.userId,
        subjectUserId: subject.userId,
        subjectGameId: null,
        field: 'username',
        reason: null,
      })
      const at = new Date()
      expect(await theStore().setReportResolved(id, at)).toBe(true)
      expect((await theStore().findReports(true, 200)).map((r) => r.id)).not.toContain(id)

      const all = await theStore().findReports(false, 200)
      expect(all.find((report) => report.id === id)?.resolvedAt).toBeInstanceOf(Date)
      // `nulls first` is written out because Postgres puts nulls last under `asc`, and an
      // unresolved report is exactly a null. Without it the queue opens on finished work.
      const resolvedFirst = all.findIndex((report) => report.resolvedAt !== null)
      const openLast = all.map((report) => report.resolvedAt === null).lastIndexOf(true)
      expect(openLast).toBeLessThan(resolvedFirst)

      expect(await theStore().setReportResolved(id, null)).toBe(true)
      expect((await theStore().findReports(true, 200)).map((r) => r.id)).toContain(id)
    })

    it('outlives the account that filed it', async () => {
      // `reporter_user_id` is `on delete set null`, so the objection survives its author. Which
      // is why every join in `findReports` is a left join, and why `reporter` is nullable.
      const reporter = await account()
      const subject = await account()
      const id = `report-orphan-${subject.userId}`
      await theStore().insertReport({
        id,
        reporterUserId: reporter.userId,
        subjectUserId: subject.userId,
        subjectGameId: null,
        field: 'bio',
        reason: 'still worth reading',
      })
      // A real delete rather than the mark, because this is the database's rule being checked.
      await theDb().delete(users).where(eq(users.id, reporter.userId))
      const found = (await theStore().findReports(true, 200)).find((report) => report.id === id)
      expect(found?.reporter).toBeNull()
      expect(found?.reason).toBe('still worth reading')
    })

    it('says so when there is no such report', async () => {
      expect(await theStore().setReportResolved('no-such-report', new Date())).toBe(false)
    })
  })
})

/*
 * Erasing an account, against a Postgres.
 *
 * Every claim here is one the foreign keys make rather than the code: what a cascade takes, what
 * `set null` spares, and the ordering that makes the reason-scrub work at all. A fake can be
 * written to agree with any of it, which is exactly why this is here.
 */
describe('deleting an account', () => {
  const gameFor = (userId: string, at: Date) => ({
    id: `del-game-${userId}-${String(at.getTime())}`,
    userId,
    seed: 11,
    source: 'web',
    imported: false,
    clientKey: null,
    difficulty: 'medium',
    language: 'en',
    canonical: true,
    n: 12,
    speedMultiplier: 1.4,
    holdTicks: 4,
    initialFlips: 168,
    wMin: 25,
    minWordLength: 4,
    wordCompleteMode: 'spend',
    flipEconomy: 'fibonacci',
    chargeFullRound: false,
    wildChance: 0.02,
    replaceChance: 0.5,
    score: 20,
    wordsCount: 1,
    roundsPlayed: 3,
    engineVersion: '0.3.0',
    dictionaryVersion: 'abc123',
    startedAt: new Date(at.getTime() - 60_000),
    finishedAt: at,
  })

  const oneWord: GameDetail = {
    boards: [{ tiles: 'A B C' }],
    words: [{ word: 'OTTER', tiles: 5, points: 20, round: 0, flips: 8, tick: 42 }],
  }

  it('finds the address a code can be sent to, and only a verified one', async () => {
    const { userId } = await account()
    expect(await theStore().verifiedEmailFor(userId)).toBe(`${userId}@example.com`)

    const bare = await account()
    await theDb().delete(authIdentities).where(eq(authIdentities.userId, bare.userId))
    await theStore().linkIdentity({
      id: `unverified-only-${bare.userId}`,
      userId: bare.userId,
      identity: {
        provider: 'apple',
        providerAccountId: `sub-unverified-${bare.userId}`,
        email: 'relay@privaterelay.appleid.com',
        emailVerified: false,
      },
    })
    // An address a provider merely passed along is a claim. A deletion code sent to a claim is a
    // code sent to whoever made it.
    expect(await theStore().verifiedEmailFor(bare.userId)).toBeNull()
  })

  it('takes the identities, the sessions, the games and their documents', async () => {
    const { userId, token } = await account()
    const at = new Date()
    await theStore().insertGame(gameFor(userId, at), oneWord)
    const gameId = gameFor(userId, at).id

    expect(await theStore().deleteAccount(userId)).toBe(true)

    // Gone rather than hidden, which is what App Store 5.1.1(v) asks for.
    expect(await theStore().findSession(token, new Date())).toBeNull()
    expect(await theStore().adminUser(userId)).toBeNull()
    expect(await theStore().gameById(gameId)).toBeNull()
    expect(await theStore().gamesOf(userId, 50)).toEqual([])
    // And the detail document went with the game, by the cascade on `game_detail.game_id`.
    const orphans = await theDb()
      .select({ gameId: gameDetail.gameId })
      .from(gameDetail)
      .where(eq(gameDetail.gameId, gameId))
    expect(orphans).toEqual([])
  })

  it('says so when there is no such account', async () => {
    expect(await theStore().deleteAccount('no-such-user')).toBe(false)
  })

  it('keeps a report about the deleted account, without the person or the prose', async () => {
    const reporter = await account()
    const subject = await account()
    const id = `del-report-${subject.userId}`
    await theStore().insertReport({
      id,
      reporterUserId: reporter.userId,
      subjectUserId: subject.userId,
      subjectGameId: null,
      field: 'bio',
      reason: `${subject.userId} is posting a slur spelled with Cyrillic characters`,
    })

    expect(await theStore().deleteAccount(subject.userId)).toBe(true)

    const [row] = await theDb()
      .select({
        subjectUserId: reports.subjectUserId,
        reporterUserId: reports.reporterUserId,
        reason: reports.reason,
        field: reports.field,
      })
      .from(reports)
      .where(eq(reports.id, id))
    // `set null` rather than `cascade`: the row survives, so our own count of how much
    // moderating happened does not shrink when somebody leaves.
    expect(row).toBeDefined()
    expect(row?.subjectUserId).toBeNull()
    expect(row?.field).toBe('bio')
    // The reporter is untouched, so their record of filing real reports stands.
    expect(row?.reporterUserId).toBe(reporter.userId)
    /*
     * And the prose is gone, which no foreign key could have done.
     *
     * This is the assertion that justifies the transaction's ordering: the scrub runs before the
     * delete, because afterwards `subject_user_id` is already null and an update would match
     * nothing and look like it had worked.
     */
    expect(row?.reason).toBeNull()
  })

  it('keeps a report the deleted account filed, prose and all', async () => {
    // The objection is about somebody who is still here, so it is still worth reading.
    const reporter = await account()
    const subject = await account()
    const id = `del-filed-${reporter.userId}`
    await theStore().insertReport({
      id,
      reporterUserId: reporter.userId,
      subjectUserId: subject.userId,
      subjectGameId: null,
      field: 'username',
      reason: 'the name is an advert',
    })

    expect(await theStore().deleteAccount(reporter.userId)).toBe(true)

    const [row] = await theDb()
      .select({
        reporterUserId: reports.reporterUserId,
        subjectUserId: reports.subjectUserId,
        reason: reports.reason,
      })
      .from(reports)
      .where(eq(reports.id, id))
    expect(row?.reporterUserId).toBeNull()
    expect(row?.subjectUserId).toBe(subject.userId)
    expect(row?.reason).toBe('the name is an advert')
  })

  it('nulls the game link rather than taking the report with the game', async () => {
    const reporter = await account()
    const subject = await account()
    const at = new Date()
    await theStore().insertGame(gameFor(subject.userId, at), oneWord)
    const gameId = gameFor(subject.userId, at).id
    const id = `del-score-${subject.userId}`
    await theStore().insertReport({
      id,
      reporterUserId: reporter.userId,
      subjectUserId: subject.userId,
      subjectGameId: gameId,
      field: 'score',
      reason: 'impossible in three rounds',
    })

    expect(await theStore().deleteAccount(subject.userId)).toBe(true)

    const [row] = await theDb()
      .select({ subjectGameId: reports.subjectGameId, reason: reports.reason })
      .from(reports)
      .where(eq(reports.id, id))
    // The game went by cascade and the report did not go with it, which is the `set null` on
    // `subject_game_id` -- it was `cascade` until the migration that named this behaviour.
    expect(row).toBeDefined()
    expect(row?.subjectGameId).toBeNull()
    // Scrubbed here too: the report route records the game's owner, so a score report is a
    // report about a person as well.
    expect(row?.reason).toBeNull()
  })

  it('frees the name and the address, which is the ban-evasion hole and is not ours to close', async () => {
    const username = `Leaving${String(Date.now())}`
    const { userId } = await account(username)
    await theStore().deleteAccount(userId)
    // Nothing recognises them on the way back in. docs/ACCOUNTS.md says so rather than leaving
    // it to be discovered.
    expect(await theStore().usernameTaken(username.toLowerCase())).toBe(false)
    expect(await theStore().userIdForVerifiedEmail(`${userId}@example.com`)).toBeNull()
  })
})
