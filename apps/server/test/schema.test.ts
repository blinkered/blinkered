import { describe, expect, it } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import {
  DATABASE_SCHEMA,
  authIdentities,
  gameWords,
  games,
  loginCodes,
  reports,
  sessions,
  users,
} from '../src/schema.js'

const TABLES = { users, authIdentities, sessions, loginCodes, games, gameWords, reports }

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
})
