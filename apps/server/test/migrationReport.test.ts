import { describe, expect, it } from 'vitest'
import {
  doneLine,
  journalEntries,
  planLines,
  planMigrations,
  refusal,
} from '../src/migrationReport.js'
import type { JournalEntry } from '../src/migrationReport.js'

/**
 * What the migration Job says it is doing.
 *
 * The arithmetic is here rather than in `migrate.ts` because that file is one of the four
 * `vitest.config.ts` excludes from the coverage gate, and STATUS.md already records that the
 * integration suite it defers to measures no coverage at all. So logic put there is logic nothing
 * checks, and the two cases worth checking are exactly the ones nobody would think to try by
 * hand.
 */

const JOURNAL: readonly JournalEntry[] = [
  { tag: '0000_initial', when: 1000 },
  { tag: '0001_drop_game_words', when: 2000 },
  { tag: '0002_game_detail', when: 3000 },
]

describe('reading the journal', () => {
  it('takes the shape drizzle writes, in order', () => {
    const raw = {
      version: '7',
      dialect: 'postgresql',
      entries: [
        { idx: 0, tag: '0000_initial', when: 1000, breakpoints: true },
        { idx: 1, tag: '0001_next', when: 2000, breakpoints: true },
      ],
    }
    expect(journalEntries(raw)).toEqual([
      { tag: '0000_initial', when: 1000 },
      { tag: '0001_next', when: 2000 },
    ])
  })

  it('refuses anything else rather than reporting about undefined', () => {
    for (const raw of [null, 42, 'entries', {}, { entries: 'no' }]) {
      expect(() => journalEntries(raw)).toThrow()
    }
    expect(() => journalEntries({ entries: [{ tag: 'x' }] })).toThrow(/timestamp/)
    expect(() => journalEntries({ entries: [{ when: 1 }] })).toThrow(/tag/)
  })
})

describe('planning a run', () => {
  it('has everything to do on an empty database', () => {
    const plan = planMigrations(JOURNAL, [])
    expect(plan.pending).toEqual(['0000_initial', '0001_drop_game_words', '0002_game_detail'])
    expect(plan.already).toEqual([])
    expect(plan.skipped).toEqual([])
    expect(plan.ahead).toEqual([])
  })

  it('has nothing to do on a database that is level with it', () => {
    const plan = planMigrations(JOURNAL, [1000, 2000, 3000])
    expect(plan.pending).toEqual([])
    expect(plan.already).toEqual(['0000_initial', '0001_drop_game_words', '0002_game_detail'])
  })

  it('names the ones it is about to apply, and only those', () => {
    const plan = planMigrations(JOURNAL, [1000, 2000])
    expect(plan.pending).toEqual(['0002_game_detail'])
    expect(plan.already).toEqual(['0000_initial', '0001_drop_game_words'])
  })

  it('reports a migration drizzle will silently never apply', () => {
    /*
     * The case that makes this module worth having.
     *
     * Drizzle applies everything *newer than the newest applied row*, not everything the table is
     * missing. So a file stamped before something already applied is skipped in silence, for
     * good -- which is what two branches generating a migration each and the older one merging
     * second produces.
     *
     * A plan built from set difference would announce it was applying this and then not, which is
     * a log that lies in the reassuring direction.
     */
    const journal: readonly JournalEntry[] = [
      { tag: '0000_initial', when: 1000 },
      { tag: '0001_from_the_older_branch', when: 1500 },
      { tag: '0002_from_the_newer_branch', when: 2000 },
    ]
    const plan = planMigrations(journal, [1000, 2000])
    expect(plan.pending).toEqual([])
    expect(plan.skipped).toEqual(['0001_from_the_older_branch'])
    expect(plan.already).toEqual(['0000_initial', '0002_from_the_newer_branch'])
    expect(planLines(plan)).toContain(
      '  WILL NOT APPLY 0001_from_the_older_branch: its stamp is older than a migration already applied',
    )
    expect(doneLine(plan)).toContain('SKIPPED 1: 0001_from_the_older_branch')
  })

  it('reports a database further ahead than the build, which is what a rollback looks like', () => {
    // Deploying an older image. Drizzle says nothing about the rows it does not recognise, so
    // today this arrives as "migrations are up to date" and reads as success.
    const plan = planMigrations(JOURNAL, [1000, 2000, 3000, 4000])
    expect(plan.pending).toEqual([])
    expect(plan.ahead).toEqual([4000])
    expect(planLines(plan)).toContain(
      '  the database has a migration this build does not, stamped 4000',
    )
    expect(doneLine(plan)).toContain('DATABASE AHEAD by 1')
  })

  it('can be behind and ahead at once, and says both', () => {
    // A shared database somebody else has migrated, against a build with its own new file. The
    // stamps interleave, which is the whole reason both categories are computed independently.
    const journal: readonly JournalEntry[] = [...JOURNAL, { tag: '0003_mine', when: 5000 }]
    const plan = planMigrations(journal, [1000, 2000, 3000, 4000])
    expect(plan.pending).toEqual(['0003_mine'])
    expect(plan.ahead).toEqual([4000])
    expect(doneLine(plan)).toBe(
      'done: applied 1 migration: 0003_mine; 3 already there; DATABASE AHEAD by 1',
    )
  })
})

describe('what it prints', () => {
  it('counts the build, then names each one it applies', () => {
    expect(planLines(planMigrations(JOURNAL, [1000]))).toEqual([
      '3 migrations in this build, 1 already applied',
      '  applying 0001_drop_game_words',
      '  applying 0002_game_detail',
    ])
  })

  it('says so out loud when there is nothing to do', () => {
    // Rather than printing nothing, which reads as a Job that did not run.
    expect(planLines(planMigrations(JOURNAL, [1000, 2000, 3000]))).toEqual([
      '3 migrations in this build, 3 already applied',
      '  nothing to apply',
    ])
  })

  it('agrees with itself about one migration', () => {
    const plan = planMigrations([{ tag: '0000_initial', when: 1000 }], [])
    expect(planLines(plan)[0]).toBe('1 migration in this build, 0 already applied')
    expect(doneLine(plan)).toBe('done: applied 1 migration: 0000_initial; 0 already there')
  })

  it('ends on one line carrying every count, because that is what a tail catches', () => {
    expect(doneLine(planMigrations(JOURNAL, [1000, 2000, 3000]))).toBe(
      'done: nothing to apply; 3 already there',
    )
    expect(doneLine(planMigrations(JOURNAL, [1000]))).toBe(
      'done: applied 2 migrations: 0001_drop_game_words, 0002_game_detail; 1 already there',
    )
  })
})

describe('refusing a deployment', () => {
  it('lets an ordinary run through', () => {
    for (const applied of [[], [1000], [1000, 2000, 3000]]) {
      expect(refusal(planMigrations(JOURNAL, applied))).toBeNull()
    }
  })

  it('lets a rollback through, because a rollback has to work', () => {
    // The database is ahead of the image. That is an older build being deployed on purpose, and
    // refusing it would block the one operation you need when everything else has gone wrong.
    expect(refusal(planMigrations(JOURNAL, [1000, 2000, 3000, 4000]))).toBeNull()
  })

  it('refuses a migration drizzle would never apply, and says what to do about it', () => {
    /*
     * The condition Nick's question was about, and the reason this is a refusal rather than the
     * warning it started as: what follows a warning is an API pod serving traffic against a
     * schema missing a column its code expects.
     */
    const journal: readonly JournalEntry[] = [
      { tag: '0000_initial', when: 1000 },
      { tag: '0001_from_the_older_branch', when: 1500 },
      { tag: '0002_from_the_newer_branch', when: 2000 },
    ]
    const said = refusal(planMigrations(journal, [1000, 2000]))
    expect(said).not.toBeNull()
    expect(said).toContain('0001_from_the_older_branch')
    // Names the cause rather than only the symptom, because the reader will not know that
    // drizzle compares against a high-water mark rather than against the table.
    expect(said).toContain('newer than the newest row')
    // And what to do, since the fix is one local command rather than a hand-edited journal.
    expect(said).toContain('drizzle-kit generate')
  })

  it('counts more than one of them', () => {
    const journal: readonly JournalEntry[] = [
      { tag: '0000_initial', when: 1000 },
      { tag: '0001_stranded', when: 1400 },
      { tag: '0002_also_stranded', when: 1500 },
      { tag: '0003_applied', when: 2000 },
    ]
    const said = refusal(planMigrations(journal, [1000, 2000]))
    expect(said).toContain('2 migrations in this build will never be applied')
    expect(said).toContain('0001_stranded, 0002_also_stranded')
  })
})
