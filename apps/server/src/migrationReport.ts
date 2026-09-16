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
 * ## There is no rollback, and this cannot invent one
 *
 * `drizzle-kit generate` writes forward SQL and nothing else -- there are no down migrations in
 * the repository and no `migrate down` to run. So a report cannot say "rolling back 0004",
 * because that never happens.
 *
 * What does happen, and what this does report, is the shape a rollback actually takes in this
 * deployment: an older image is deployed against a database that is further ahead than its
 * journal. Drizzle's rule is to apply everything newer than the newest row in
 * `__drizzle_migrations` and say nothing about the rest, so today that arrives as
 * "migrations are up to date" and looks like success. It is worth a line that says the database
 * is ahead of the code.
 */

/** One entry in `drizzle/meta/_journal.json`. `when` is the millisecond stamp drizzle keys on. */
export interface JournalEntry {
  readonly tag: string
  readonly when: number
}

export interface MigrationPlan {
  /** In the journal and in the database, in journal order. */
  readonly already: readonly string[]
  /** What this run will apply, in the order it will apply them. */
  readonly pending: readonly string[]
  /**
   * In the journal, not in the database, and **drizzle will not apply them.**
   *
   * The reason this category exists at all is drizzle's rule: it applies every migration whose
   * stamp is greater than the newest row in the table, rather than every migration the table is
   * missing. A file whose stamp lands before something already applied is therefore skipped in
   * silence, forever. That happens when two branches each generate a migration and the older one
   * merges second, which is a thing that will eventually happen here.
   */
  readonly skipped: readonly string[]
  /**
   * In the database, with no entry in this build's journal.
   *
   * Which is to say the database is ahead of the image: the normal cause is a deliberate
   * rollback to an older build, and the other cause is somebody running a newer branch's
   * migrations against a shared database.
   */
  readonly ahead: readonly number[]
}

/**
 * Reads the journal, or says it could not.
 *
 * Validated rather than cast, because a journal that is not the shape drizzle writes would
 * otherwise produce a confident report about `undefined`. Entries are returned in journal order,
 * which is the order they are applied in.
 */
export function journalEntries(raw: unknown): readonly JournalEntry[] {
  if (typeof raw !== 'object' || raw === null)
    throw new Error('the migration journal is not an object')
  const entries = (raw as { entries?: unknown }).entries
  if (!Array.isArray(entries)) throw new Error('the migration journal has no entries')
  return entries.map((entry, at) => {
    const fields = entry as { tag?: unknown; when?: unknown }
    if (typeof fields.tag !== 'string' || typeof fields.when !== 'number') {
      throw new Error(`migration journal entry ${String(at)} is missing a tag or a timestamp`)
    }
    return { tag: fields.tag, when: fields.when }
  })
}

/**
 * What will happen, worked out with drizzle's own rule rather than a tidier one.
 *
 * The rule, from `pg-core/dialect.js`: read the single newest row of `__drizzle_migrations`, then
 * apply every migration whose folder stamp is greater than its `created_at`. Anything at or below
 * that line is left alone whether or not it is actually recorded.
 *
 * Reimplementing it here is the only way the report can be trusted, and the alternative is worse
 * than it sounds: a plan built from set difference would cheerfully announce it was applying a
 * file that drizzle then skipped, which is a log that lies in the direction of reassurance.
 */
export function planMigrations(
  journal: readonly JournalEntry[],
  applied: readonly number[],
): MigrationPlan {
  const recorded = new Set(applied)
  // -1 rather than -Infinity: a stamp is a millisecond count, so this is below every real one
  // and is a number, which keeps the comparison the same shape on an empty database.
  const newest = applied.length === 0 ? -1 : Math.max(...applied)

  const already: string[] = []
  const pending: string[] = []
  const skipped: string[] = []
  for (const entry of journal) {
    if (entry.when > newest) pending.push(entry.tag)
    else if (recorded.has(entry.when)) already.push(entry.tag)
    else skipped.push(entry.tag)
  }

  const known = new Set(journal.map((entry) => entry.when))
  const ahead = [...applied].filter((when) => !known.has(when)).sort((a, b) => a - b)

  return { already, pending, skipped, ahead }
}

/**
 * What to print before running, one line each.
 *
 * Named migrations rather than a count, because a count answers the wrong question: the reason to
 * read this log is to find out whether the thing you just wrote is the thing that ran.
 */
export function planLines(plan: MigrationPlan): readonly string[] {
  const lines: string[] = []
  const total = plan.already.length + plan.pending.length + plan.skipped.length
  lines.push(
    `${count(total, 'migration')} in this build, ${String(plan.already.length)} already applied`,
  )
  for (const tag of plan.pending) lines.push(`  applying ${tag}`)
  if (plan.pending.length === 0) lines.push('  nothing to apply')

  /*
   * The two anomalies, spelled out rather than counted.
   *
   * Neither is made a failure, and that is deliberate in both directions. A database ahead of the
   * image is what a rollback looks like, and a Job that refused it would block the rollback --
   * which is the one operation you need to work when everything else has gone wrong. A skipped
   * migration is a real fault, but failing here would leave the only fix as a hand-edited journal
   * against a stack that will not start.
   */
  for (const tag of plan.skipped) {
    lines.push(`  WILL NOT APPLY ${tag}: its stamp is older than a migration already applied`)
  }
  for (const when of plan.ahead) {
    lines.push(`  the database has a migration this build does not, stamped ${String(when)}`)
  }
  return lines
}

/**
 * The last line, and it is always last on purpose.
 *
 * `deploy/deploy.sh` tails this Job's log, so whatever matters most has to be at the end rather
 * than scrolled off the top. One line carrying every count means the tail is never the half of
 * the story that happens to be reassuring.
 */
export function doneLine(plan: MigrationPlan): string {
  const parts = [
    plan.pending.length === 0
      ? 'nothing to apply'
      : `applied ${count(plan.pending.length, 'migration')}: ${plan.pending.join(', ')}`,
    `${String(plan.already.length)} already there`,
  ]
  if (plan.skipped.length > 0) {
    parts.push(`SKIPPED ${String(plan.skipped.length)}: ${plan.skipped.join(', ')}`)
  }
  if (plan.ahead.length > 0) {
    parts.push(`DATABASE AHEAD by ${String(plan.ahead.length)}`)
  }
  return `done: ${parts.join('; ')}`
}

/** "1 migration", "3 migrations". English only; this is a deploy log, not a player's screen. */
function count(n: number, noun: string): string {
  return `${String(n)} ${noun}${n === 1 ? '' : 's'}`
}
