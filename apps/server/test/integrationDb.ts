import { databaseConfig } from '../src/config.js'
import { client } from '../src/db.js'
import { DATABASE_SCHEMA } from '../src/schema.js'
import type { DatabaseConfig } from '../src/config.js'

/**
 * Where the integration suites connect, and it is deliberately not where the development stack
 * does.
 *
 * These suites drop `DATABASE_SCHEMA` and rebuild it from the migrations, which is the whole
 * point of them: the thing worth checking is that the committed SQL produces the schema the code
 * expects. Run against the database `docker compose up` serves, that also deletes whatever was in
 * it -- and it did, twice, while somebody had the app open in a browser. The failure is quiet and
 * looks like being mysteriously signed out.
 *
 * So the database is `blinkered_test`, created on demand, and the development one is left alone.
 *
 * Pinned here rather than read from `BLINKERED_DB_NAME`, which is the part that matters: the
 * repository's own `.envrc` sets that variable to the development database, so honouring it would
 * mean the safe default applied to everybody except the people actually working in the repo.
 * Where a connection is made is still environmental -- host, port, user, password all come from
 * the environment, so a CI service container works -- and only *which database* is the suite's
 * own business. `BLINKERED_TEST_DB_NAME` is there for the case that turns out to be wrong.
 */
const TEST_DATABASE = process.env.BLINKERED_TEST_DB_NAME ?? 'blinkered_test'

export const integrationConfig: DatabaseConfig = databaseConfig({
  BLINKERED_DB_HOST: process.env.BLINKERED_DB_HOST ?? 'localhost',
  BLINKERED_DB_PORT: process.env.BLINKERED_DB_PORT ?? '55432',
  BLINKERED_DB_TLS: process.env.BLINKERED_DB_TLS ?? 'false',
  BLINKERED_DB_USER: process.env.BLINKERED_DB_USER ?? 'blinkered',
  BLINKERED_DB_PASSWORD: process.env.BLINKERED_DB_PASSWORD ?? 'testpass',
  BLINKERED_DB_NAME: TEST_DATABASE,
  BLINKERED_DB_SCHEMA: process.env.BLINKERED_DB_SCHEMA ?? DATABASE_SCHEMA,
})

/**
 * Makes the test database if it is not there, then empties the schema inside it.
 *
 * `create database` cannot run inside a transaction and cannot be made conditional in SQL, so it
 * is attempted and `42P04` -- already exists -- is the success case rather than an error. The
 * connection for it is to `postgres`, since a database cannot be created from inside itself.
 */
export async function freshDatabase(): Promise<void> {
  const admin = client({ ...integrationConfig, database: 'postgres', schema: 'public' })
  try {
    await admin.unsafe(`create database "${integrationConfig.database}"`)
  } catch (failure) {
    if (!alreadyExists(failure)) throw failure
  } finally {
    await admin.end({ timeout: 5 })
  }

  const bare = client({ ...integrationConfig, schema: 'public' })
  await bare.unsafe(`drop schema if exists "${DATABASE_SCHEMA}" cascade`)
  await bare.end({ timeout: 5 })
}

/** Postgres for "that database is already there", which is the outcome we wanted anyway. */
function alreadyExists(failure: unknown): boolean {
  for (let at = failure; at !== undefined && at !== null; at = (at as { cause?: unknown }).cause) {
    if (typeof at !== 'object') return false
    if ((at as { code?: unknown }).code === '42P04') return true
  }
  return false
}
