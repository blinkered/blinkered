import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { client } from './db.js'
import { namesForStamps, planLines, planMigrations } from './migrationReport.js'
import type { MigrationPlan } from './migrationReport.js'
import { DATABASE_SCHEMA } from './schema.js'
import type { DatabaseConfig } from './config.js'

/**
 * Where `drizzle-kit generate` writes the SQL.
 *
 * Found by walking up to the package root rather than by counting directories, because this file
 * sits at different depths in the two layouts it runs in: `src/migrate.ts` under vitest, which
 * resolves the workspace to its sources, and `dist/src/migrate.js` in the image. A relative path
 * is correct in exactly one of them, and the first version was correct in the one that is not
 * tested, so it worked in the container and failed the moment a test called it.
 */
export const MIGRATIONS = join(packageRoot(), 'drizzle')

function packageRoot(): string {
  let directory = dirname(fileURLToPath(import.meta.url))
  for (;;) {
    if (existsSync(join(directory, 'package.json'))) return directory
    const parent = dirname(directory)
    // `dirname` of the filesystem root is the root, which is the only way this loop ends badly.
    if (parent === directory) throw new Error('no package root above ' + import.meta.url)
    directory = parent
  }
}

/**
 * Brings the database up to date, in whichever of the two arrangements it is.
 *
 * The schema is created by the migration itself rather than by the chart's initdb, and that is
 * deliberate: initdb only runs when Postgres is the one in the StatefulSet and its data directory
 * is empty, so a managed database would never see it. Doing it here means both arrangements
 * arrive in the same state, which is the whole reason the connection is described by seven keys
 * rather than by a URL. See docs/DEPLOY.md.
 */
export async function runMigrations(
  config: DatabaseConfig,
  say: (line: string) => void = () => undefined,
): Promise<MigrationPlan> {
  /*
   * The generated SQL names the schema, so a config that disagrees with it cannot be honoured.
   *
   * Refused up front rather than discovered halfway: the migration would create its tables in
   * the schema it was generated for while the pool looked in the one the secret named, and the
   * result is an application that connects successfully and cannot see a single table. A wrong
   * value here should be a process that will not start.
   */
  if (config.schema !== DATABASE_SCHEMA) {
    throw new Error(
      `BLINKERED_DB_SCHEMA is ${config.schema}, but the migrations are generated for ` +
        `${DATABASE_SCHEMA}. Change the secret to match, or regenerate the migrations.`,
    )
  }

  const connection = client(config, { quiet: true })
  try {
    /*
     * What is about to happen, worked out before it happens.
     *
     * Read first and reported first, rather than diffed afterwards, so that a migration which
     * fails halfway has already said which one it was. A report assembled after the fact says
     * nothing at all in the case where somebody most wants to read it.
     */
    const local = localMigrations()
    const plan = planMigrations(local, await appliedNames(connection, local))
    for (const line of planLines(plan)) say(line)

    await migrate(drizzle({ client: connection }), {
      migrationsFolder: MIGRATIONS,
      // Drizzle's own bookkeeping goes in our schema too, so a database holding more than this
      // application does not collect a stray `__drizzle_migrations` in `public`.
      migrationsSchema: DATABASE_SCHEMA,
      migrationsTable: '__drizzle_migrations',
    })
    return plan
  } finally {
    await connection.end({ timeout: 5 })
  }
}

/**
 * The migrations this build carries, by folder name, in the order drizzle applies them.
 *
 * Read off the directory rather than out of a journal, because drizzle 1.0 does not write one --
 * that is the whole point of the format change, since a shared `_journal.json` was a file two
 * branches conflicted in every time. The folder name carries its own timestamp, so sorting the
 * names is sorting by age.
 */
function localMigrations(): readonly string[] {
  return readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

/**
 * The names already recorded, or none at all.
 *
 * The table is created by the migrator, so on a first install it is not there yet and that is
 * the ordinary case rather than an error. Asked of `information_schema` rather than by catching
 * the failure of a select, because "does this relation exist" is a question with an answer and
 * matching on an error code would be reading a message to find out.
 *
 * **A 0.45-format table is read by its timestamps rather than reported as empty.** Every row
 * there has a null `name`, because the column does not exist yet, and taking that at face value
 * made the upgrade deployment print "applied 5 migrations" while the migrator applied none. That
 * is one deployment per database and it is the one somebody is watching, so it is worth the
 * fourteen lines: the stamps are matched to folder names the way drizzle's own `upgradeIfNeeded`
 * matches them, and the plan comes out saying five already applied and nothing to do.
 */
async function appliedNames(
  connection: ReturnType<typeof client>,
  local: readonly string[],
): Promise<readonly string[]> {
  const columns = await connection`
    select column_name from information_schema.columns
    where table_schema = ${DATABASE_SCHEMA} and table_name = '__drizzle_migrations'
  `
  if (columns.length === 0) return []
  const table = connection(DATABASE_SCHEMA)

  if (!columns.some((column) => column.column_name === 'name')) {
    const legacy = await connection`
      select created_at from ${table}.__drizzle_migrations order by created_at
    `
    // `bigint` arrives as a string from postgres.js, which is right in general and wrong here.
    return namesForStamps(
      local,
      legacy.map((row) => Number(row.created_at)),
    )
  }

  const rows = await connection`
    select name from ${table}.__drizzle_migrations where name is not null order by name
  `
  return rows.map((row) => String(row.name))
}
