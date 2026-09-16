/**
 * What the migration Job is about to do, and what it did.
 *
 * Separate from `migrate.ts` for the reason `policy.ts` and `profile.ts` are separate from their
 * routes: all of it is arithmetic over two lists, so all of it is testable without a Postgres.
 * That matters more here than usual, because `migrate.ts` is one of the four files
 * `vitest.config.ts` excludes from the coverage gate, and STATUS.md already flags that the
 * integration suite it points at measures no coverage at all. Logic put in there is logic nothing
 * checks. So the logic is here.
 *
 * ## This file used to carry a guard, and drizzle 1.0 made it unnecessary
 *
 * Under 0.45 the migrator applied every migration **newer than the newest row** in
 * `__drizzle_migrations` rather than every migration that table was missing. That assumed one
 * line of history: two branches each generating a migration, with the older one merging second,
 * left the older one stranded and skipped in silence, for good. This module detected that and
 * refused the deployment, because the alternative was an API pod serving traffic against a schema
 * missing a column its code expected.
 *
 * 1.0 replaced the rule with set membership by name -- `getMigrationsToRun` is
 * `localMigrations.filter((lm) => !dbNamesSet.has(lm.name))`, which is what Rails has always
 * done -- so a migration cannot be stranded by ordering any more and the guard has nothing left
 * to guard. It is deleted rather than kept: a check that cannot fire is a check that will be
 * trusted for the wrong reason later. drizzle-team/drizzle-orm#5316 is the history.
 *
 * What is still worth reporting is what actually ran, and the one asymmetry the new rule leaves.
 *
 * ## There is no rollback, and this cannot invent one
 *
 * `drizzle-kit generate` writes forward SQL and nothing else -- there are no down migrations in
 * the repository and no `migrate down` to run. So a report cannot say "rolling back 0004",
 * because that never happens. Undoing a change means writing another migration.
 *
 * What does happen is an older image against a database that has moved on, which is the shape a
 * rollback takes here. After the migrations table has been upgraded to the 1.0 format, drizzle
 * simply ignores rows it does not recognise, so that arrives silently. It is worth a line saying
 * the database is ahead of the code.
 */

/**
 * The folder name a 0.45-format row corresponds to, for each row, or null where none does.
 *
 * Needed for exactly one deployment per database: the one that upgrades from 0.45, where every
 * row still has a null `name` and so looks like an empty table. Without this the report claims
 * it is applying every migration and then the migrator applies none, which is a log that lies in
 * the reassuring direction -- the fault this module exists to avoid.
 *
 * Matched the way drizzle's own `upgradeIfNeeded` matches: a stored `created_at` is milliseconds,
 * a folder name begins with `YYYYMMDDHHMMSS`, and the two agree once the stamp is truncated to
 * the second. `drizzle-kit up` derived those folder names from the same journal timestamps the
 * rows were written from, which is what makes this exact rather than approximate.
 */
export function namesForStamps(
  local: readonly string[],
  stamps: readonly number[],
): readonly string[] {
  const byPrefix = new Map(local.map((name) => [name.slice(0, 14), name]))
  return stamps
    .map((stamp) => byPrefix.get(stampPrefix(stamp)))
    .filter((name): name is string => name !== undefined)
}

/** A millisecond stamp as the fourteen digits a migration folder is named with, in UTC. */
function stampPrefix(stamp: number): string {
  const at = new Date(Math.floor(stamp / 1000) * 1000)
  const pad = (n: number, width = 2): string => String(n).padStart(width, '0')
  return (
    pad(at.getUTCFullYear(), 4) +
    pad(at.getUTCMonth() + 1) +
    pad(at.getUTCDate()) +
    pad(at.getUTCHours()) +
    pad(at.getUTCMinutes()) +
    pad(at.getUTCSeconds())
  )
}

export interface MigrationPlan {
  /** In the folder and in the database, in folder order. */
  readonly already: readonly string[]
  /** What this run will apply, in the order it will apply them. */
  readonly pending: readonly string[]
  /**
   * In the database, with no migration folder in this build.
   *
   * Which is to say the database is ahead of the image: the normal cause is a deliberate rollback
   * to an older build, and the other is a shared database somebody else has migrated further.
   */
  readonly ahead: readonly string[]
}

/**
 * What will happen, worked out with drizzle's own rule.
 *
 * The rule, from `migrator.utils.js`: every local migration whose folder name is not recorded in
 * the table, in folder order. Reimplemented here rather than approximated, so the report cannot
 * claim something the migrator will not do -- a log that lies in the reassuring direction is
 * worse than the terse one this replaced.
 */
export function planMigrations(
  local: readonly string[],
  applied: readonly string[],
): MigrationPlan {
  const recorded = new Set(applied)
  const known = new Set(local)
  return {
    already: local.filter((name) => recorded.has(name)),
    pending: local.filter((name) => !recorded.has(name)),
    ahead: [...applied].filter((name) => !known.has(name)).sort(),
  }
}

/**
 * What to print before running, one line each.
 *
 * Named migrations rather than a count, because a count answers the wrong question: the reason to
 * read this log is to find out whether the thing you just wrote is the thing that ran.
 */
export function planLines(plan: MigrationPlan): readonly string[] {
  const lines: string[] = []
  const total = plan.already.length + plan.pending.length
  lines.push(
    `${count(total, 'migration')} in this build, ${String(plan.already.length)} already applied`,
  )
  for (const name of plan.pending) lines.push(`  applying ${name}`)
  if (plan.pending.length === 0) lines.push('  nothing to apply')

  /*
   * Not a failure, deliberately.
   *
   * A database ahead of the image is what a rollback looks like, and a Job that refused it would
   * block the rollback -- the one operation that has to work when everything else has gone wrong.
   * Worth a line because drizzle says nothing about a row it does not recognise, so the case
   * otherwise arrives as an ordinary success.
   */
  for (const name of plan.ahead) {
    lines.push(`  the database has ${name}, which this build does not carry`)
  }
  return lines
}

/**
 * The last line, and it is always last on purpose.
 *
 * `deploy/deploy.sh` prints this Job's log, and a reader scanning it wants one line that carries
 * every count rather than an arithmetic exercise over the ones above.
 */
export function doneLine(plan: MigrationPlan): string {
  const parts = [
    plan.pending.length === 0
      ? 'nothing to apply'
      : `applied ${count(plan.pending.length, 'migration')}: ${plan.pending.join(', ')}`,
    `${String(plan.already.length)} already there`,
  ]
  if (plan.ahead.length > 0) {
    parts.push(`DATABASE AHEAD by ${String(plan.ahead.length)}: ${plan.ahead.join(', ')}`)
  }
  return `done: ${parts.join('; ')}`
}

/** "1 migration", "3 migrations". English only; this is a deploy log, not a player's screen. */
function count(n: number, noun: string): string {
  return `${String(n)} ${noun}${n === 1 ? '' : 's'}`
}
