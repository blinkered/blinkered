import type { AppleConfig } from './auth/apple.js'
import type { GoogleConfig } from './auth/google.js'

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

/**
 * Sign in with Apple, or nothing.
 *
 * Optional as a whole, like the mailer above and for the same reason: a deployment without a key
 * serves the game, answers probes, and offers no Apple button. A laptop is that deployment, and
 * so is any environment whose `.p8` has not been put in place yet.
 *
 * All-or-nothing rather than per-key defaults. Four values that only work together, where three
 * of them are public and the fourth is a signing key, is exactly the shape where a partial
 * configuration produces `invalid_client` at sign-in instead of an error at boot. The Team ID,
 * Key ID, Services ID and redirect URI come from the chart; only the key is a secret.
 */
export function appleConfig(env: Environment): AppleConfig | null {
  const privateKey = env.BLINKERED_APPLE_PRIVATE_KEY
  if (privateKey === undefined || privateKey === '') return null

  const problems: string[] = []
  const read = (key: string): string => {
    const value = env[key]
    if (value === undefined || value.trim() === '') {
      problems.push(`${key} is missing`)
      return ''
    }
    return value.trim()
  }

  const teamId = read('BLINKERED_APPLE_TEAM_ID')
  const keyId = read('BLINKERED_APPLE_KEY_ID')
  const servicesId = read('BLINKERED_APPLE_SERVICES_ID')
  const redirectUri = read('BLINKERED_APPLE_REDIRECT_URI')

  /*
   * Apple refuses a redirect URI that is not HTTPS, with no localhost exemption of the kind
   * Google offers. Catching it here rather than at sign-in matters because the error Apple gives
   * back names neither the field nor the reason, and because the value has to match what is
   * registered in the portal byte for byte -- which is why it is configuration rather than
   * something assembled from request headers, where `X-Forwarded-Proto` would decide it.
   */
  if (redirectUri !== '' && !redirectUri.startsWith('https://')) {
    problems.push(`BLINKERED_APPLE_REDIRECT_URI is not https: ${redirectUri}`)
  }

  if (problems.length > 0) throw new ConfigError(problems)
  return { teamId, keyId, servicesId, redirectUri, privateKey }
}

/**
 * Sign in with Google, or nothing.
 *
 * Optional as a whole, exactly as Apple and the mailer are: a deployment with no client secret
 * serves the game, answers its probes, and offers no Google button.
 *
 * Both values are per environment here, where Apple's Services ID is shared. That is not an
 * inconsistency, it is the difference between the two providers: Google issues a real secret per
 * OAuth client, so production and development hold different ones and a leaked development
 * secret is not a production incident. The client id is public -- it travels in every authorize
 * URL -- and is in the chart beside the redirect URI for the same reason Apple's ids are.
 */
export function googleConfig(env: Environment): GoogleConfig | null {
  const clientSecret = env.BLINKERED_GOOGLE_CLIENT_SECRET
  if (clientSecret === undefined || clientSecret === '') return null

  const problems: string[] = []
  const read = (key: string): string => {
    const value = env[key]
    if (value === undefined || value.trim() === '') {
      problems.push(`${key} is missing`)
      return ''
    }
    return value.trim()
  }

  const clientId = read('BLINKERED_GOOGLE_CLIENT_ID')
  const redirectUri = read('BLINKERED_GOOGLE_REDIRECT_URI')

  /*
   * Google exempts `http://localhost` and nothing else, which is the one place it is more
   * forgiving than Apple. Anything that is neither localhost nor HTTPS is refused by Google at
   * the authorize step with an error that names the field but not the reason, so it is worth
   * catching here where the message can say what is actually wrong.
   */
  if (
    redirectUri !== '' &&
    !redirectUri.startsWith('https://') &&
    !redirectUri.startsWith('http://localhost')
  ) {
    problems.push(`BLINKERED_GOOGLE_REDIRECT_URI is neither https nor localhost: ${redirectUri}`)
  }

  if (problems.length > 0) throw new ConfigError(problems)
  return { clientId, clientSecret, redirectUri }
}
