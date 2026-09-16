import { describe, expect, it } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import {
  DATABASE_SCHEMA,
  authIdentities,
  gameDetail,
  games,
  loginCodes,
  reports,
  sessions,
  users,
} from '../src/schema.js'

const TABLES = { users, authIdentities, sessions, loginCodes, games, gameDetail, reports }

describe('the schema', () => {
  it('puts every table in the one schema the migrations name', () => {
    // The bug this pins: tables declared unqualified land wherever `search_path` says, while
    // drizzle-kit writes the schema into every foreign key regardless. One table left out of
    // `DATABASE_SCHEMA` would be created somewhere the foreign keys do not point.
    for (const [name, table] of Object.entries(TABLES)) {
      expect(getTableConfig(table).schema, name).toBe(DATABASE_SCHEMA)
    }
  })

  it('names the schema the committed migrations were generated for', () => {
    // Not a tautology: `drizzle/0000_initial.sql` says `CREATE SCHEMA "blinkered"`, and changing
    // this constant without regenerating leaves the two disagreeing. `runMigrations` refuses a
    // config that disagrees with this; nothing would catch this disagreeing with the SQL.
    expect(DATABASE_SCHEMA).toBe('blinkered')
  })

  it('holds the whole ruleset on a game, not just its difficulty', () => {
    // A difficulty is a label whose meaning changes: medium has been retuned once already and
    // ENGINE_VERSION is at 0.3.0 because of it. A row carrying its own numbers stays
    // explainable afterwards; a row carrying only the word does not.
    const columns = getTableConfig(games).columns.map((column) => column.name)
    for (const rule of [
      'n',
      'speed_multiplier',
      'hold_ticks',
      'initial_flips',
      'w_min',
      'min_word_length',
      'word_complete_mode',
      'flip_economy',
      'charge_full_round',
      'wild_chance',
      'replace_chance',
      'engine_version',
    ]) {
      expect(columns, rule).toContain(rule)
    }
  })

  it('keeps out of `games` everything that only the detail document needs', () => {
    // The split is by access pattern rather than by entity shape. `games` is what the leaderboard
    // and My Games scan, so anything nothing filters, sorts or joins on belongs in the document:
    // as rows, fourteen words cost more in tuple headers and index entries than in game.
    const columns = getTableConfig(games).columns.map((column) => column.name)
    expect(columns).not.toContain('letters')

    const detail = new Map(getTableConfig(gameDetail).columns.map((c) => [c.name, c]))
    // A column rather than a key inside the document, so "how many rows are still on version 1"
    // is a query rather than a scan.
    expect(detail.get('version')?.notNull).toBe(true)
    expect(detail.get('detail')?.notNull).toBe(true)
  })

  it('lets a game have no owner, and insists a user has a name', () => {
    const gameColumns = new Map(getTableConfig(games).columns.map((c) => [c.name, c]))
    // A guest is dealt a real game before there is anybody to attach it to.
    expect(gameColumns.get('user_id')?.notNull).toBe(false)
    const userColumns = new Map(getTableConfig(users).columns.map((c) => [c.name, c]))
    expect(userColumns.get('username_normalized')?.notNull).toBe(true)
    // Optional, all three, because a profile is not an interrogation.
    expect(userColumns.get('country')?.notNull).toBe(false)
    expect(userColumns.get('bio')?.notNull).toBe(false)
  })

  it('lets a report outlive everybody named in it', () => {
    /*
     * All three links `set null`, none `cascade`. Two of them were `cascade`, which meant
     * deleting an account deleted the reports about it -- so our own record of how much
     * moderating had happened shrank every time somebody left.
     *
     * Pinned here as well as in the integration suite because this is the kind of property a
     * later schema edit flips without anybody noticing: `references()` takes `onDelete` as an
     * option, and the default is not this.
     */
    const links = getTableConfig(reports).foreignKeys.map((key) => {
      const reference = key.reference()
      return { column: reference.columns[0]?.name, onDelete: key.onDelete }
    })
    expect(links).toHaveLength(3)
    for (const link of links) expect(link.onDelete, link.column).toBe('set null')
  })

  it('makes nobody an admin by default', () => {
    // The default is the security property, not a convenience. Every route under `/v1/admin`
    // reads this column, and a nullable or absent default would make "not set" a third state
    // that some expression somewhere would eventually read as true.
    const column = new Map(getTableConfig(users).columns.map((c) => [c.name, c])).get('is_admin')
    expect(column?.notNull).toBe(true)
    expect(column?.default).toBe(false)
  })
})
