import { defineConfig } from 'drizzle-kit'

/**
 * For the `drizzle-kit` commands.
 *
 * `generate` reads the schema and writes SQL without opening a connection, and its output is what
 * ships: applying it is `runMigrations` in `src/migrate.ts`, which knows about the seven-key
 * config and refuses a schema the SQL was not generated for.
 *
 * `push` and `studio` do open one, at the credentials below, which are the local container's and
 * are wrong everywhere else on purpose. `push` writes the schema straight into a database with no
 * migration in between: it is for iterating on `schema.ts` without generating a file per
 * experiment, and it is **not** how anything is deployed. Nothing that has ever held a row
 * somebody cares about should be pushed to. Generate, commit the SQL, and migrate.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env.BLINKERED_DB_HOST ?? 'localhost',
    port: Number(process.env.BLINKERED_DB_PORT ?? 55432),
    user: process.env.BLINKERED_DB_USER ?? 'blinkered',
    password: process.env.BLINKERED_DB_PASSWORD ?? 'testpass',
    database: process.env.BLINKERED_DB_NAME ?? 'blinkered',
    ssl: false,
  },
})
