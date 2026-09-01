import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'
import type { DatabaseConfig } from './config.js'

export type Database = ReturnType<typeof connect>['db']

/**
 * Opens the pool, with the schema on the connection rather than in the queries.
 *
 * `search_path` is set per connection, which is what lets every table in `schema.ts` be declared
 * unqualified. Which schema this is belongs to the deployment, not to the source.
 *
 * The `search_path` deliberately does **not** include `public`. A table that exists in `public`
 * and not in ours would otherwise be found and used, which is how two deployments sharing a
 * database quietly read each other's rows.
 */
export function connect(config: DatabaseConfig): {
  db: ReturnType<typeof make>
  close: () => Promise<void>
} {
  const sql = client(config)
  return { db: make(sql), close: () => sql.end({ timeout: 5 }) }
}

function make(sql: postgres.Sql): ReturnType<typeof drizzle<typeof schema>> {
  return drizzle(sql, { schema })
}

export function client(config: DatabaseConfig): postgres.Sql {
  return postgres({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    // `false` rather than omitted: postgres.js reads `ssl` as its own tri-state, and leaving it
    // undefined is not the same as saying no.
    ssl: config.tls ? 'require' : false,
    connection: { search_path: config.schema },
    // A connection that cannot be had should fail the request rather than hang it. The API is
    // behind a proxy with its own timeouts, and outliving them buys nobody anything.
    connect_timeout: 10,
  })
}
