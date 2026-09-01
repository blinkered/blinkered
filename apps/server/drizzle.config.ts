import { defineConfig } from 'drizzle-kit'

/**
 * For `drizzle-kit generate` only, which reads the schema and writes SQL and never opens a
 * connection. Applying those files is `runMigrations` in `src/migrate.ts`, which knows about the
 * schema and the seven-key config; this file deliberately does not.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
})
