import { describe, expect, it } from 'vitest'
import { ConfigError, databaseConfig } from '../src/config.js'

const complete = {
  BLINKERED_DB_HOST: 'db.example.com',
  BLINKERED_DB_PORT: '5432',
  BLINKERED_DB_TLS: 'true',
  BLINKERED_DB_USER: 'blinkered',
  BLINKERED_DB_PASSWORD: 'hunter2',
  BLINKERED_DB_NAME: 'blinkered',
  BLINKERED_DB_SCHEMA: 'blinkered',
}

/** The problems from a config that was expected to be refused. */
function problems(env: Record<string, string>): readonly string[] {
  try {
    databaseConfig(env)
  } catch (error) {
    if (error instanceof ConfigError) return error.problems
    throw error
  }
  throw new Error('expected the config to be refused')
}

describe('databaseConfig', () => {
  it('reads the seven keys the deployment secret carries', () => {
    expect(databaseConfig(complete)).toEqual({
      host: 'db.example.com',
      port: 5432,
      tls: true,
      user: 'blinkered',
      password: 'hunter2',
      database: 'blinkered',
      schema: 'blinkered',
    })
  })

  it('keeps the database and the schema apart', () => {
    // Two keys because Postgres distinguishes them and because different things create them:
    // the database by initdb or a provider, the schema by the migrations.
    const config = databaseConfig({
      ...complete,
      BLINKERED_DB_NAME: 'app',
      BLINKERED_DB_SCHEMA: 'blinkered',
    })
    expect(config.database).toBe('app')
    expect(config.schema).toBe('blinkered')
  })

  it('reports every missing key at once, not the first one', () => {
    // The audience has just written a Kubernetes secret. Reporting one problem per deploy means
    // one round trip through a rollout per typo.
    expect(problems({}).length).toBe(7)
    expect(problems({})).toContain('BLINKERED_DB_HOST is missing')
    expect(problems({})).toContain('BLINKERED_DB_SCHEMA is missing')
  })

  it('treats a key that exists and is blank as missing', () => {
    // Which is what a secret whose value never got filled in actually looks like.
    expect(problems({ ...complete, BLINKERED_DB_PASSWORD: '   ' })).toEqual([
      'BLINKERED_DB_PASSWORD is missing',
    ])
  })

  it('trims, because a secret written by hand tends to carry a newline', () => {
    expect(databaseConfig({ ...complete, BLINKERED_DB_HOST: '  db.example.com\n' }).host).toBe(
      'db.example.com',
    )
  })

  it('refuses a port that is not one', () => {
    for (const port of ['0', '65536', '-1', 'five', '5432.5']) {
      expect(problems({ ...complete, BLINKERED_DB_PORT: port }), port).toEqual([
        `BLINKERED_DB_PORT is not a port number: ${port}`,
      ])
    }
  })

  it('accepts the spellings of yes and no that people actually write in YAML', () => {
    for (const yes of ['true', 'yes', 'on', '1', 'TRUE', 'True']) {
      expect(databaseConfig({ ...complete, BLINKERED_DB_TLS: yes }).tls, yes).toBe(true)
    }
    for (const no of ['false', 'no', 'off', '0', 'FALSE']) {
      expect(databaseConfig({ ...complete, BLINKERED_DB_TLS: no }).tls, no).toBe(false)
    }
  })

  it('refuses a TLS value it does not recognise rather than reading it as no', () => {
    // The whole reason this is not `value === 'true'`. A typo silently turning encryption off is
    // a security setting failing open and saying nothing about it.
    expect(problems({ ...complete, BLINKERED_DB_TLS: 'ture' })).toEqual([
      'BLINKERED_DB_TLS is not a yes or a no: ture',
    ])
  })

  it('refuses a schema name that is not an identifier', () => {
    // A schema reaches SQL where no bind parameter can carry it, because an identifier is not a
    // value. Refusing the interesting shapes here is cheaper than quoting carefully everywhere.
    for (const schema of ['drop table', 'blinkered;--', '1abc', 'a-b', '"quoted"']) {
      expect(problems({ ...complete, BLINKERED_DB_SCHEMA: schema }), schema).toEqual([
        `BLINKERED_DB_SCHEMA is not an identifier: ${schema}`,
      ])
    }
    for (const schema of ['blinkered', '_private', 'a$b', 'S1']) {
      expect(databaseConfig({ ...complete, BLINKERED_DB_SCHEMA: schema }).schema, schema).toBe(
        schema,
      )
    }
  })

  it('says everything wrong in one message', () => {
    const error = problems({ ...complete, BLINKERED_DB_PORT: 'x', BLINKERED_DB_HOST: '' })
    expect(error).toHaveLength(2)
  })
})
