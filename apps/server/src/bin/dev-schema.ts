import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { databaseConfig } from '../config.js'
import { runMigrations } from '../migrate.js'
import { DATABASE_SCHEMA } from '../schema.js'

/**
 * Keeps the local database matching `src/schema.ts` while it is being edited.
 *
 * Run under `tsx watch`, which reruns a script when anything it imports changes. Importing the
 * schema is therefore not decoration: it is what makes editing a column rerun this.
 *
 * It generates a migration and applies it, which is **the same path that deploys**. That was the
 * second answer. The first was `drizzle-kit push`, which writes a schema straight into a database
 * with no migration in between and is the usual tool for this loop, and it does not work here:
 * with the tables in a schema of their own rather than in `public`, push decides the schema
 * itself is surplus and emits `DROP SCHEMA "blinkered"` as its entire plan, every run, after
 * correctly creating the tables. Setting `schemaFilter` gets it as far as looking in the right
 * place and no further.
 *
 * Using the real path is better anyway, and not only because it works. A dev loop that applies
 * migrations exercises the thing that runs in production, and it leaves behind the artifact that
 * has to exist before the change can ship, rather than a database that quietly disagrees with
 * `drizzle/` until somebody remembers to generate.
 *
 * `generate` is a no-op when nothing changed, so saving an unrelated file costs nothing.
 */
const server = fileURLToPath(new URL('../../', import.meta.url))

const generated = spawnSync('pnpm', ['exec', 'drizzle-kit', 'generate'], {
  stdio: 'inherit',
  cwd: server,
})

if (generated.status !== 0) {
  // Reported, not thrown. A schema that will not generate is usually a schema still being typed,
  // and killing the watcher would mean restarting the stack to get back to a working one.
  console.error('the schema did not generate; fix it and save again')
} else {
  try {
    await runMigrations(databaseConfig(process.env))
    console.log(`the ${DATABASE_SCHEMA} schema is up to date`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
  }
}
