import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { connect } from '../src/db.js'
import { runMigrations } from '../src/migrate.js'
import { freshDatabase, integrationConfig } from './integrationDb.js'
import { pgStore } from '../src/pgStore.js'
import { DATABASE_SCHEMA, authIdentities } from '../src/schema.js'
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

  it('finds a profile by any casing of the name, and not a deleted one', async () => {
    const { userId } = await account('Heron-Watcher')
    expect((await theStore().profileByUsername('heron-watcher'))?.userId).toBe(userId)
    await (open as NonNullable<typeof open>).db.execute(
      sql`update ${sql.identifier(DATABASE_SCHEMA)}.users set deleted_at = now() where id = ${userId}`,
    )
    // Same answer as a name nobody has: telling them apart would report who used to be here.
    expect(await theStore().profileByUsername('heron-watcher')).toBeNull()
  })

  it('will not show a game whose owner is deleted, nor an unclaimed one', async () => {
    const { userId } = await account()
    const at = new Date(Date.now() - 1000)
    await theStore().insertGame(gameFor(userId, at, 9), detailFor('WREN'))
    const id = gameFor(userId, at, 9).id
    expect(await theStore().gameById(id)).not.toBeNull()
    await (open as NonNullable<typeof open>).db.execute(
      sql`update ${sql.identifier(DATABASE_SCHEMA)}.users set deleted_at = now() where id = ${userId}`,
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
