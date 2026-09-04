/**
 * The database connection, assembled from the seven keys the deployment secret carries.
 *
 * Seven discrete values rather than one `DATABASE_URL`, because the chart offers two
 * arrangements -- its own Postgres StatefulSet, or somebody's managed one -- and both hand over
 * exactly this shape. A URL in one case and fields in the other would mean a code path that only
 * ever runs in production. See docs/DEPLOY.md.
 */
export interface DatabaseConfig {
  readonly host: string
  readonly port: number
  readonly tls: boolean
  readonly user: string
  readonly password: string
  /** The database. Created by initdb, or by whoever runs the managed one. */
  readonly database: string
  /** The schema inside it. Created by the migrations, in both arrangements. */
  readonly schema: string
}

/** Everything wrong with the environment, rather than the first thing wrong with it. */
export class ConfigError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`the environment is not usable:\n  ${problems.join('\n  ')}`)
    this.name = 'ConfigError'
  }
}

/** What the chart sets, and what a developer has to set by hand. */
export type Environment = Readonly<Partial<Record<string, string>>>

const REQUIRED = {
  host: 'BLINKERED_DB_HOST',
  port: 'BLINKERED_DB_PORT',
  tls: 'BLINKERED_DB_TLS',
  user: 'BLINKERED_DB_USER',
  password: 'BLINKERED_DB_PASSWORD',
  database: 'BLINKERED_DB_NAME',
  schema: 'BLINKERED_DB_SCHEMA',
} as const

/**
 * Reads the whole environment and reports everything wrong with it at once.
 *
 * All of it, rather than the first failure, because the audience is somebody who has just written
 * a Kubernetes secret and would otherwise fix one key, redeploy, wait, and find the next. A
 * process that cannot reach its database should say so completely and then stop.
 */
export function databaseConfig(env: Environment): DatabaseConfig {
  const problems: string[] = []

  const read = (key: string): string => {
    const value = env[key]
    if (value === undefined || value.trim() === '') {
      problems.push(`${key} is missing`)
      return ''
    }
    return value.trim()
  }

  const host = read(REQUIRED.host)
  const rawPort = read(REQUIRED.port)
  const rawTls = read(REQUIRED.tls)
  const user = read(REQUIRED.user)
  const password = read(REQUIRED.password)
  const database = read(REQUIRED.database)
  const schema = read(REQUIRED.schema)

  const port = Number(rawPort)
  if (rawPort !== '' && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    problems.push(`${REQUIRED.port} is not a port number: ${rawPort}`)
  }

  /*
   * Strict about the spelling on purpose.
   *
   * The lazy reading of this is `value === 'true'`, which quietly treats a typo, a `yes`, or a
   * secret key that never got written as "no TLS". That is a security setting failing open and
   * saying nothing, on a value that arrives from a YAML file where `on` and `1` are both things
   * people write. Anything unrecognised is an error rather than a default.
   */
  const tls = TRUE.has(rawTls.toLowerCase())
  if (rawTls !== '' && !tls && !FALSE.has(rawTls.toLowerCase())) {
    problems.push(`${REQUIRED.tls} is not a yes or a no: ${rawTls}`)
  }

  // A schema name reaches SQL that no parameter can carry, since an identifier is not a value.
  // It is quoted at every use, and this refuses the shapes that make quoting interesting.
  if (schema !== '' && !/^[A-Za-z_][A-Za-z0-9_$]*$/.test(schema)) {
    problems.push(`${REQUIRED.schema} is not an identifier: ${schema}`)
  }

  if (problems.length > 0) throw new ConfigError(problems)
  return { host, port, tls, user, password, database, schema }
}

const TRUE = new Set(['true', 'yes', 'on', '1'])
const FALSE = new Set(['false', 'no', 'off', '0'])

/**
 * Where mail goes, and who we are when we send it.
 *
 * Optional as a whole: a deployment with no `BLINKERED_SMTP_HOST` serves the game, answers
 * probes, and cannot sign anybody in. That is a better failure than refusing to start, and a
 * much better one than coming up healthy with a mailer that silently discards.
 *
 * `BLINKERED_SMTP_TLS` says *when* the connection is encrypted rather than whether: `implicit`
 * is TLS from the first byte, which is port 465, and anything else is STARTTLS, which is 587.
 * Getting those backwards is the classic SMTP misconfiguration and it fails as a hang, because
 * one side is waiting for a handshake and the other for a greeting.
 */
export interface SmtpEnv {
  readonly host: string
  readonly port: number
  readonly implicitTls: boolean
  /** Together or not at all; see `SmtpConfig`. */
  readonly auth?: { readonly user: string; readonly password: string }
  readonly from: string
}

export function smtpConfig(env: Environment): SmtpEnv | null {
  const host = env.BLINKERED_SMTP_HOST
  if (host === undefined || host === '') return null

  const problems: string[] = []
  const port = Number(env.BLINKERED_SMTP_PORT ?? '587')
  if (!Number.isInteger(port) || port <= 0) {
    problems.push('BLINKERED_SMTP_PORT is not a port number')
  }
  const from = env.BLINKERED_MAIL_FROM
  // Named rather than defaulted. A relay authorizes a sender, so guessing one produces mail that
  // is refused at submission, and the error arrives at the relay rather than here.
  if (from === undefined || from === '') problems.push('BLINKERED_MAIL_FROM is not set')
  // A user without a password is a submission that will fail to authenticate; a password without
  // a user is a value nothing reads. Both are worth catching before the first sign-in attempt.
  const user = env.BLINKERED_SMTP_USER
  const password = env.BLINKERED_SMTP_PASSWORD
  if (user !== undefined && user !== '' && (password === undefined || password === '')) {
    problems.push('BLINKERED_SMTP_USER is set without BLINKERED_SMTP_PASSWORD')
  }
  if (problems.length > 0) throw new ConfigError(problems)

  return {
    host,
    port,
    implicitTls: env.BLINKERED_SMTP_TLS === 'implicit',
    ...(user === undefined || user === '' ? {} : { auth: { user, password: password as string } }),
    from: from as string,
  }
}
