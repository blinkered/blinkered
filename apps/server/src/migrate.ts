import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { client } from './db.js'
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
export async function runMigrations(config: DatabaseConfig): Promise<void> {
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
    await migrate(drizzle(connection), {
      migrationsFolder: MIGRATIONS,
      // Drizzle's own bookkeeping goes in our schema too, so a database holding more than this
      // application does not collect a stray `__drizzle_migrations` in `public`.
      migrationsSchema: DATABASE_SCHEMA,
      migrationsTable: '__drizzle_migrations',
    })
  } finally {
    await connection.end({ timeout: 5 })
  }
}
