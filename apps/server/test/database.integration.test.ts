import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sql } from 'drizzle-orm'
import { databaseConfig } from '../src/config.js'
import { client, connect } from '../src/db.js'
import { runMigrations } from '../src/migrate.js'
import { DATABASE_SCHEMA, games, users } from '../src/schema.js'
import type { DatabaseConfig } from '../src/config.js'

/*
 * Against a real Postgres, because the things worth checking here are the things a fake would
 * agree with us about: that the migration lands in the schema we think, that the foreign keys
 * cascade, and that the leaderboard index is ordered the way the engine ranks.
 *
 * Kept out of `pnpm test` and run by `pnpm test:integration`, because the CI matrix includes a
 * macOS runner and GitHub's macOS runners have no Docker. A suite that passes locally and fails
 * on the first push is a trap this repo has already been caught by once.
 */
const config: DatabaseConfig = databaseConfig({
  BLINKERED_DB_HOST: process.env.BLINKERED_DB_HOST ?? 'localhost',
  BLINKERED_DB_PORT: process.env.BLINKERED_DB_PORT ?? '55432',
  BLINKERED_DB_TLS: process.env.BLINKERED_DB_TLS ?? 'false',
  BLINKERED_DB_USER: process.env.BLINKERED_DB_USER ?? 'blinkered',
  BLINKERED_DB_PASSWORD: process.env.BLINKERED_DB_PASSWORD ?? 'testpass',
  BLINKERED_DB_NAME: process.env.BLINKERED_DB_NAME ?? 'blinkered',
  BLINKERED_DB_SCHEMA: process.env.BLINKERED_DB_SCHEMA ?? DATABASE_SCHEMA,
})

let db: ReturnType<typeof connect> | undefined

beforeAll(async () => {
  const bare = client({ ...config, schema: 'public' })
  await bare.unsafe(`drop schema if exists "${DATABASE_SCHEMA}" cascade`)
  await bare.end({ timeout: 5 })
  await runMigrations(config)
  db = connect(config)
}, 60_000)

afterAll(async () => {
  // Tolerant of never having opened, so that a failure in `beforeAll` is reported as itself
  // rather than as a `TypeError` from the teardown standing in front of it.
  await db?.close()
})

/** The connection, once `beforeAll` has made one. Fails loudly rather than as a `TypeError`. */
function database(): NonNullable<typeof db>['db'] {
  if (db === undefined) throw new Error('the database was never opened')
  return db.db
}

describe('the migration', () => {
  it('puts every table in our schema and nothing in public', async () => {
    const rows = await database().execute<{ table_name: string }>(sql`
      select table_name from information_schema.tables
      where table_schema = ${DATABASE_SCHEMA} order by table_name`)
    expect(rows.map((row) => row.table_name)).toEqual([
      '__drizzle_migrations',
      'auth_identities',
      'game_words',
      'games',
      'login_codes',
      'reports',
      'sessions',
      'users',
    ])

    // Including drizzle's own bookkeeping, which lands in `public` unless told otherwise and is
    // exactly the kind of stray table a shared managed database does not want.
    const stray = await database().execute<{ table_name: string }>(sql`
      select table_name from information_schema.tables where table_schema = 'public'`)
    expect(stray).toHaveLength(0)
  })

  it('runs again without doing anything', async () => {
    await expect(runMigrations(config)).resolves.toBeUndefined()
  })

  it('refuses a schema the migrations were not generated for, before connecting', async () => {
    // The failure this prevents is quiet: tables created in one schema, a pool looking in
    // another, and an application that connects perfectly and sees nothing.
    await expect(runMigrations({ ...config, schema: 'somewhere_else' })).rejects.toThrow(
      /generated for blinkered/,
    )
  })
})

describe('the schema', () => {
  it('orders the leaderboard index the way the engine ranks', async () => {
    // `compareResults` is score descending, then rounds ascending, then the timestamp ascending.
    // An index that differs produces a board that disagrees with the client's own ranking of the
    // same rows, which is the sort of bug nobody reports because it just looks wrong.
    // `NULLS LAST` is drizzle spelling out what DESC would otherwise reverse. It makes no
    // difference on a NOT NULL column, and it is in the assertion because it is in the index.
    const [row] = await database().execute<{ indexdef: string }>(sql`
      select indexdef from pg_indexes
      where schemaname = ${DATABASE_SCHEMA} and indexname = 'games_leaderboard_idx'`)
    expect(row?.indexdef).toMatch(
      /\(language, difficulty, engine_version, score DESC NULLS LAST, rounds_played, finished_at\)/,
    )
    // Partial, because the ineligible rows are most of them and none are ever on a board.
    expect(row?.indexdef).toMatch(/WHERE \(leaderboard_eligible AND \(NOT hidden\)\)/)
  })

  it('lets a game belong to nobody, so a guest can be dealt one', async () => {
    // What makes "keep this score" at the end of a guest's game better than a promise: the row
    // already exists and is claimed at sign-up, rather than being taken on trust afterwards.
    const id = `game-${String(Date.now())}`
    await database()
      .insert(games)
      .values({
        id,
        userId: null,
        seed: 42,
        status: 'over',
        source: 'web',
        difficulty: 'medium',
        language: 'en',
        canonical: true,
        n: 12,
        speedMultiplier: 1.5,
        holdTicks: 4,
        initialFlips: 144,
        wMin: 25,
        minWordLength: 3,
        wordCompleteMode: 'spend',
        flipEconomy: 'fibonacci',
        chargeFullRound: false,
        wildChance: 0.02,
        replaceChance: 0.25,
        letters: ['A', 'B', 'C'],
        engineVersion: '0.3.0',
      })
    const [stored] = await database()
      .select()
      .from(games)
      .where(sql`id = ${id}`)
    expect(stored?.userId).toBeNull()
    // float8 round-trips as the identical double, which is what lets `isCanonical` compare a
    // stored ruleset against a preset with `===`.
    expect(stored?.wildChance).toBe(0.02)
    expect(stored?.speedMultiplier).toBe(1.5)
  })

  it('takes a deleted account off the board with it', async () => {
    // A leaderboard is a list of people, and somebody who left is not on it. Enforced here
    // rather than remembered in a handler, because deletion is the path nobody exercises.
    const userId = `user-${String(Date.now())}`
    await database()
      .insert(users)
      .values({
        id: userId,
        username: 'Tester',
        usernameNormalized: `tester-${String(Date.now())}`,
        avatarSeed: 'seed',
      })
    await database()
      .insert(games)
      .values({
        id: `owned-${String(Date.now())}`,
        userId,
        seed: 1,
        status: 'over',
        source: 'web',
        difficulty: 'easy',
        language: 'en',
        canonical: true,
        n: 12,
        speedMultiplier: 1.8,
        holdTicks: 5,
        initialFlips: 168,
        wMin: 25,
        minWordLength: 3,
        wordCompleteMode: 'spend',
        flipEconomy: 'fibonacci',
        chargeFullRound: false,
        wildChance: 0.02,
        replaceChance: 0,
        letters: ['A'],
        engineVersion: '0.3.0',
      })

    await database()
      .delete(users)
      .where(sql`id = ${userId}`)
    const left = await database()
      .select()
      .from(games)
      .where(sql`user_id = ${userId}`)
    expect(left).toHaveLength(0)
  })
})
