import { describe, expect, it } from 'vitest'
import {
  ConfigError,
  appleConfig,
  databaseConfig,
  googleConfig,
  smtpConfig,
  trustsProxy,
} from '../src/config.js'

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

describe('smtpConfig', () => {
  const base = {
    BLINKERED_SMTP_HOST: 'smtp.gmail.com',
    BLINKERED_MAIL_FROM: 'noreply@playblinkered.com',
  }

  it('is absent when no host is named, rather than an error', () => {
    // A deployment with no mailer serves the game and cannot sign anybody in, which is a better
    // failure than refusing to start.
    expect(smtpConfig({})).toBeNull()
    expect(smtpConfig({ BLINKERED_SMTP_HOST: '' })).toBeNull()
  })

  it('defaults to 587, which is the submission port that uses STARTTLS', () => {
    expect(smtpConfig(base)).toMatchObject({ port: 587, implicitTls: false })
  })

  it('reads implicit TLS as a word rather than as a boolean', () => {
    // It says *when* the connection is encrypted, not whether. Both are encrypted.
    expect(smtpConfig({ ...base, BLINKERED_SMTP_TLS: 'implicit' })?.implicitTls).toBe(true)
    expect(smtpConfig({ ...base, BLINKERED_SMTP_TLS: 'starttls' })?.implicitTls).toBe(false)
  })

  it('carries credentials when there are any, and none when there are not', () => {
    expect(smtpConfig(base)).not.toHaveProperty('auth')
    expect(
      smtpConfig({ ...base, BLINKERED_SMTP_USER: 'u', BLINKERED_SMTP_PASSWORD: 'p' }),
    ).toMatchObject({ auth: { user: 'u', password: 'p' } })
  })

  it('refuses a sender it would have to guess', () => {
    // A relay authorizes a sender, so a guessed one produces mail refused at submission, and
    // that error arrives at the relay rather than here.
    expect(() => smtpConfig({ BLINKERED_SMTP_HOST: 'x' })).toThrow(ConfigError)
  })

  it('refuses a username with no password, which cannot authenticate', () => {
    expect(() => smtpConfig({ ...base, BLINKERED_SMTP_USER: 'u' })).toThrow(ConfigError)
  })

  it('refuses a port that is not one', () => {
    expect(() => smtpConfig({ ...base, BLINKERED_SMTP_PORT: 'submission' })).toThrow(ConfigError)
  })

  it('reports everything wrong at once, like the database config does', () => {
    try {
      smtpConfig({ BLINKERED_SMTP_HOST: 'x', BLINKERED_SMTP_PORT: 'no', BLINKERED_SMTP_USER: 'u' })
      expect.unreachable()
    } catch (error) {
      expect((error as ConfigError).problems).toHaveLength(3)
    }
  })
})

describe('the Apple configuration', () => {
  const complete = {
    BLINKERED_APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nxx\n-----END PRIVATE KEY-----',
    BLINKERED_APPLE_TEAM_ID: 'ZJ3A78KXA4',
    BLINKERED_APPLE_KEY_ID: '85Z9WXC2Q9',
    BLINKERED_APPLE_SERVICES_ID: 'com.tightlinesoftware.blinkered.signin',
    BLINKERED_APPLE_REDIRECT_URI: 'https://playblinkered.com/v1/auth/apple/callback',
  }

  it('reads a complete environment', () => {
    expect(appleConfig(complete)).toEqual({
      teamId: 'ZJ3A78KXA4',
      keyId: '85Z9WXC2Q9',
      servicesId: 'com.tightlinesoftware.blinkered.signin',
      redirectUri: 'https://playblinkered.com/v1/auth/apple/callback',
      privateKey: complete.BLINKERED_APPLE_PRIVATE_KEY,
    })
  })

  it('is absent rather than broken when there is no key', () => {
    // A laptop, and any environment whose .p8 is not in place. The game serves, the probes pass,
    // and there is no Apple button. Refusing to start would be a worse answer to the same fact.
    expect(appleConfig({})).toBeNull()
    expect(appleConfig({ ...complete, BLINKERED_APPLE_PRIVATE_KEY: '' })).toBeNull()
  })

  it('reports every missing key at once rather than one per deployment', () => {
    const { BLINKERED_APPLE_PRIVATE_KEY } = complete
    expect(() => appleConfig({ BLINKERED_APPLE_PRIVATE_KEY })).toThrow(ConfigError)
    try {
      appleConfig({ BLINKERED_APPLE_PRIVATE_KEY })
    } catch (failure) {
      expect((failure as ConfigError).problems).toHaveLength(4)
    }
  })

  it('treats whitespace as missing, and trims what it keeps', () => {
    expect(() => appleConfig({ ...complete, BLINKERED_APPLE_TEAM_ID: '   ' })).toThrow(ConfigError)
    expect(appleConfig({ ...complete, BLINKERED_APPLE_KEY_ID: ' 85Z9WXC2Q9 ' })?.keyId).toBe(
      '85Z9WXC2Q9',
    )
  })

  it('refuses a redirect URI that is not https', () => {
    // Apple has no localhost exemption of the kind Google offers, and the error it returns names
    // neither the field nor the reason. Catching it at boot is the difference between a bad
    // deployment and an afternoon.
    expect(() =>
      appleConfig({ ...complete, BLINKERED_APPLE_REDIRECT_URI: 'http://localhost:8080/cb' }),
    ).toThrow(ConfigError)
  })
})

describe('the Google configuration', () => {
  const complete = {
    BLINKERED_GOOGLE_CLIENT_SECRET: 'a-real-secret',
    BLINKERED_GOOGLE_CLIENT_ID: '1234.apps.googleusercontent.com',
    BLINKERED_GOOGLE_REDIRECT_URI: 'https://playblinkered.com/v1/auth/google/callback',
  }

  it('reads a complete environment', () => {
    expect(googleConfig(complete)).toEqual({
      clientId: '1234.apps.googleusercontent.com',
      clientSecret: 'a-real-secret',
      redirectUri: 'https://playblinkered.com/v1/auth/google/callback',
    })
  })

  it('is absent rather than broken when there is no secret', () => {
    expect(googleConfig({})).toBeNull()
    expect(googleConfig({ ...complete, BLINKERED_GOOGLE_CLIENT_SECRET: '' })).toBeNull()
  })

  it('reports every missing key at once', () => {
    const { BLINKERED_GOOGLE_CLIENT_SECRET } = complete
    try {
      googleConfig({ BLINKERED_GOOGLE_CLIENT_SECRET })
      expect.unreachable('should have thrown')
    } catch (failure) {
      expect((failure as ConfigError).problems).toHaveLength(2)
    }
  })

  it('allows localhost, which Google exempts and Apple does not', () => {
    // The one place Google is more forgiving. Worth a test because the asymmetry between the two
    // providers is exactly the kind of thing a later tidy-up would "fix" into consistency.
    expect(
      googleConfig({ ...complete, BLINKERED_GOOGLE_REDIRECT_URI: 'http://localhost:8080/cb' })
        ?.redirectUri,
    ).toBe('http://localhost:8080/cb')
  })

  it('refuses plain http anywhere else', () => {
    expect(() =>
      googleConfig({ ...complete, BLINKERED_GOOGLE_REDIRECT_URI: 'http://playblinkered.com/cb' }),
    ).toThrow(ConfigError)
  })

  it('trims what it keeps', () => {
    expect(googleConfig({ ...complete, BLINKERED_GOOGLE_CLIENT_ID: ' abc ' })?.clientId).toBe('abc')
  })
})

describe('trusting the proxy', () => {
  it('is false when nobody says otherwise', () => {
    // The safe direction. A deployment that has not thought about it gets no rate limiter rather
    // than a limiter keyed on a header any client can forge.
    expect(trustsProxy({})).toBe(false)
    expect(trustsProxy({ BLINKERED_TRUST_PROXY: '   ' })).toBe(false)
  })

  it('takes the spellings a YAML file actually produces', () => {
    for (const yes of ['true', 'yes', 'on', '1', 'TRUE']) {
      expect(trustsProxy({ BLINKERED_TRUST_PROXY: yes })).toBe(true)
    }
    for (const no of ['false', 'no', 'off', '0']) {
      expect(trustsProxy({ BLINKERED_TRUST_PROXY: no })).toBe(false)
    }
  })

  it('refuses a typo rather than reading it as no', () => {
    // A security setting that fails open on a typo is worse than one that refuses to start; the
    // database TLS flag already argues this and it applies here for the same reason.
    expect(() => trustsProxy({ BLINKERED_TRUST_PROXY: 'ture' })).toThrow(ConfigError)
  })
})
