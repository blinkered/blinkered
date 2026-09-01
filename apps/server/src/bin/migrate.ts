import { databaseConfig } from '../config.js'
import { runMigrations } from '../migrate.js'

/**
 * Brings the database up to date, then exits.
 *
 * Its own entrypoint rather than something the API does on the way up, because there is more
 * than one replica: two pods starting together would race, and a migration that takes a while
 * would hold the readiness probe off long enough to look like a failed rollout. In the cluster
 * this is a Job that runs before the Deployment rolls; locally it is `pnpm --filter
 * @blinkered/server migrate`.
 */
try {
  await runMigrations(databaseConfig(process.env))
  console.log('migrations are up to date')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  // Non-zero, so a Job fails and the rollout that depends on it does not proceed.
  process.exit(1)
}
