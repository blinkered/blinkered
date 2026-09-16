import { describe, expect, it } from 'vitest'
import { doneLine, namesForStamps, planLines, planMigrations } from '../src/migrationReport.js'

/**
 * What the migration Job says it is doing.
 *
 * The arithmetic is here rather than in `migrate.ts` because that file is one of the four
 * `vitest.config.ts` excludes from the coverage gate, and STATUS.md already records that the
 * integration suite it defers to measures no coverage at all. So logic put there is logic nothing
 * checks.
 *
 * **Two tests were deleted rather than ported when this moved to drizzle 1.0**, and they are
 * worth naming because the temptation was to keep them. They covered a migration stranded by
 * timestamp ordering -- 0.45 applied only what was newer than the newest applied row, so a file
 * from a branch that merged second was skipped in silence -- and this module used to refuse the
 * deployment over it. 1.0 matches by folder name and set membership, so the condition cannot
 * occur, and a test that cannot fail is a test that makes the next reader trust something that
 * is not being checked.
 */

const LOCAL = [
  '20260901181717_initial',
  '20260910232339_drop_game_words',
  '20260916010518_is_admin',
] as const

describe('planning a run', () => {
  it('has everything to do on an empty database', () => {
    const plan = planMigrations(LOCAL, [])
    expect(plan.pending).toEqual([...LOCAL])
    expect(plan.already).toEqual([])
    expect(plan.ahead).toEqual([])
  })

  it('has nothing to do on a database that is level with it', () => {
    const plan = planMigrations(LOCAL, [...LOCAL])
    expect(plan.pending).toEqual([])
    expect(plan.already).toEqual([...LOCAL])
  })

  it('names the ones it is about to apply, and only those', () => {
    const plan = planMigrations(LOCAL, ['20260901181717_initial'])
    expect(plan.pending).toEqual(['20260910232339_drop_game_words', '20260916010518_is_admin'])
    expect(plan.already).toEqual(['20260901181717_initial'])
  })

  it('applies a migration the database is missing whatever its age', () => {
    /*
     * The behaviour the 1.0 upgrade was for, and the reason this suite no longer has a refusal
     * in it.
     *
     * Two branches each generate a migration and the older one merges second. Under 0.45 the
     * older file was stranded for good, because the rule was "newer than the newest applied"
     * rather than "not yet applied". Here it is simply pending.
     */
    const local = [
      '20260901181717_initial',
      '20260910120000_from_the_older_branch',
      '20260910130000_from_the_newer_branch',
    ]
    const plan = planMigrations(local, [
      '20260901181717_initial',
      '20260910130000_from_the_newer_branch',
    ])
    expect(plan.pending).toEqual(['20260910120000_from_the_older_branch'])
    expect(plan.ahead).toEqual([])
  })

  it('reports a database further ahead than the build, which is what a rollback looks like', () => {
    // Deploying an older image. Drizzle ignores a row it does not recognise, so without this the
    // case arrives as an ordinary success.
    const plan = planMigrations(LOCAL, [...LOCAL, '20260920090000_something_newer'])
    expect(plan.pending).toEqual([])
    expect(plan.ahead).toEqual(['20260920090000_something_newer'])
    expect(planLines(plan)).toContain(
      '  the database has 20260920090000_something_newer, which this build does not carry',
    )
    expect(doneLine(plan)).toContain('DATABASE AHEAD by 1: 20260920090000_something_newer')
  })

  it('can be behind and ahead at once, and says both', () => {
    // A shared database somebody else has migrated, against a build with its own new file.
    const plan = planMigrations(
      [...LOCAL, '20260921100000_mine'],
      [...LOCAL, '20260920090000_theirs'],
    )
    expect(plan.pending).toEqual(['20260921100000_mine'])
    expect(plan.ahead).toEqual(['20260920090000_theirs'])
    expect(doneLine(plan)).toBe(
      'done: applied 1 migration: 20260921100000_mine; 3 already there; ' +
        'DATABASE AHEAD by 1: 20260920090000_theirs',
    )
  })

  it('reads a not-yet-upgraded table as an empty one, which is honest and happens once', () => {
    // Every row of a 0.45-format table has a null `name`, so `migrate.ts` hands over nothing and
    // the plan says it will apply everything. Then drizzle backfills the names and applies none
    // of them. A worse log than it could be, exactly once per database.
    const plan = planMigrations(LOCAL, [])
    expect(plan.pending).toEqual([...LOCAL])
  })
})

describe('what it prints', () => {
  it('counts the build, then names each one it applies', () => {
    expect(planLines(planMigrations(LOCAL, ['20260901181717_initial']))).toEqual([
      '3 migrations in this build, 1 already applied',
      '  applying 20260910232339_drop_game_words',
      '  applying 20260916010518_is_admin',
    ])
  })

  it('says so out loud when there is nothing to do', () => {
    // Rather than printing nothing, which reads as a Job that did not run.
    expect(planLines(planMigrations(LOCAL, [...LOCAL]))).toEqual([
      '3 migrations in this build, 3 already applied',
      '  nothing to apply',
    ])
  })

  it('agrees with itself about one migration', () => {
    const plan = planMigrations(['20260901181717_initial'], [])
    expect(planLines(plan)[0]).toBe('1 migration in this build, 0 already applied')
    expect(doneLine(plan)).toBe(
      'done: applied 1 migration: 20260901181717_initial; 0 already there',
    )
  })

  it('ends on one line carrying every count', () => {
    expect(doneLine(planMigrations(LOCAL, [...LOCAL]))).toBe(
      'done: nothing to apply; 3 already there',
    )
    expect(doneLine(planMigrations(LOCAL, ['20260901181717_initial']))).toBe(
      'done: applied 2 migrations: 20260910232339_drop_game_words, 20260916010518_is_admin; ' +
        '1 already there',
    )
  })
})

describe('reading a table drizzle has not upgraded yet', () => {
  /*
   * One deployment per database, and it is the one somebody is watching.
   *
   * A 0.45-format table has no `name` column, so every row reads as nameless. Taken at face
   * value that is an empty table, and the report said "applied 5 migrations" while the migrator
   * applied none -- a log that lies in the reassuring direction, which is the fault this whole
   * module exists to avoid. These are the real stamps from this repository's own journal.
   */
  const STAMPS = [1788286637353, 1789082619391, 1789082630542, 1789139903315, 1789520718608]
  const NAMES = [
    '20260901181717_initial',
    '20260910232339_drop_game_words',
    '20260910232350_game_detail',
    '20260911151823_boards_carry_wilds',
    '20260916010518_is_admin',
  ]

  it('matches every stamp to the folder `drizzle-kit up` derived from it', () => {
    // Exact rather than approximate: `up` built those names from these same numbers.
    expect(namesForStamps(NAMES, STAMPS)).toEqual(NAMES)
  })

  it('truncates to the second, because a folder name has no milliseconds in it', () => {
    // 1788286637353 is 2026-09-01T18:17:17.353Z, and the folder is named for the second.
    expect(namesForStamps(NAMES, [1788286637353])).toEqual(['20260901181717_initial'])
    expect(namesForStamps(NAMES, [1788286637000])).toEqual(['20260901181717_initial'])
    expect(namesForStamps(NAMES, [1788286637999])).toEqual(['20260901181717_initial'])
  })

  it('turns that into a plan that says nothing to do, which is the truth', () => {
    const plan = planMigrations(NAMES, namesForStamps(NAMES, STAMPS))
    expect(plan.pending).toEqual([])
    expect(plan.already).toEqual(NAMES)
    expect(doneLine(plan)).toBe('done: nothing to apply; 5 already there')
  })

  it('drops a stamp no folder answers to rather than inventing a name for it', () => {
    // A row from a build this image does not carry. Dropped here and reported as `ahead` by the
    // plan, which is the rollback case and is not a failure.
    expect(namesForStamps(NAMES, [...STAMPS, 1999999999999])).toEqual(NAMES)
  })

  it('says everything is pending on a database that really is empty', () => {
    expect(namesForStamps(NAMES, [])).toEqual([])
    expect(planMigrations(NAMES, namesForStamps(NAMES, [])).pending).toEqual(NAMES)
  })
})
