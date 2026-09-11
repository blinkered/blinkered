import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sql } from 'drizzle-orm'
import { connect } from '../src/db.js'
import { runMigrations } from '../src/migrate.js'
import { freshDatabase, integrationConfig } from './integrationDb.js'
import { pgStore } from '../src/pgStore.js'
import { DATABASE_SCHEMA } from '../src/schema.js'
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

let counter = 0
/** A signed-in account, made the way the sign-in route makes one. */
async function account(username?: string): Promise<{ userId: string; token: string }> {
  counter += 1
  const userId = `user-${String(counter)}-${String(Date.now())}`
  const created = await theStore().createUser({
    id: userId,
    email: `${userId}@example.com`,
    username: username ?? `person-${String(counter)}-${String(Date.now())}`,
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
    boards: ['A B C', 'A B D'],
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
    const found = await theStore().gameFor(userId, gameFor(userId, at, 20).id)
    // Numbers, nested arrays and the optional field all survive, which is the only thing a
    // fake could not have told us: jsonb canonicalizes, and this is what it does to our shape.
    expect(found?.detail).toEqual(detail)
    expect(found?.summary.score).toBe(20)
  })

  it('will not hand a game to anybody but its owner', async () => {
    const mine = await account()
    const theirs = await account()
    const at = new Date(Date.now() - 1000)
    await theStore().insertGame(gameFor(mine.userId, at, 5), detailFor('OTTER'))
    const id = gameFor(mine.userId, at, 5).id
    expect(await theStore().gameFor(mine.userId, id)).not.toBeNull()
    // Scoped in the query rather than filtered afterwards, because a filter a caller can forget
    // is a filter a caller will forget.
    expect(await theStore().gameFor(theirs.userId, id)).toBeNull()
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
    await theStore().insertGame(gameFor(userId, new Date(), 0), { boards: ['A B C'], words: [] })
    expect(await theStore().gamesOf(userId, 10)).toHaveLength(1)
  })

  it('shows nobody else theirs, and honours the limit', async () => {
    const mine = await account()
    const theirs = await account()
    for (let i = 0; i < 3; i += 1) {
      await theStore().insertGame(gameFor(mine.userId, new Date(Date.now() - i * 1000), i), {
        boards: ['A B C'],
        words: [],
      })
    }
    expect(await theStore().gamesOf(mine.userId, 2)).toHaveLength(2)
    expect(await theStore().gamesOf(theirs.userId, 10)).toEqual([])
  })

  it('leaves a hidden game out, including from the person who set it', async () => {
    const { userId } = await account()
    const at = new Date()
    await theStore().insertGame(gameFor(userId, at, 99), { boards: ['A B C'], words: [] })
    await (open as NonNullable<typeof open>).db.execute(
      sql`update ${sql.identifier(DATABASE_SCHEMA)}.games set hidden = true
          where id = ${gameFor(userId, at, 99).id}`,
    )
    // A score removed from a board that still sits at the top of a personal page has been removed
    // from nowhere the person who set it can see.
    expect(await theStore().gamesOf(userId, 10)).toEqual([])
  })
})
