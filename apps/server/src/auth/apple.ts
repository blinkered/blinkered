import { createPrivateKey, createPublicKey, sign, verify as verifySignature } from 'node:crypto'

/**
 * Sign in with Apple, and the one thing about it that surprises people: **Apple does not issue a
 * client secret.** Every other OAuth provider hands over a string to put in a secret manager.
 * Apple hands over a signing key and expects the secret to be a JWT we mint ourselves, signed
 * with that key, valid for at most six months.
 *
 * Which means the interesting decision is how long to make it. Six months and a calendar
 * reminder is the obvious reading of the documentation, and it is the option that eventually
 * fails on a Sunday: the expiry is silent, the symptom is `invalid_client` on every sign-in, and
 * nothing in the system knows why. Minting a fresh one per token exchange costs about a
 * millisecond, has no renewal to forget, and has no stored credential to leak. So there is no
 * six-month secret anywhere in this project, and nothing to rotate.
 *
 * Everything here is `node:crypto`. ES256 is ECDSA over P-256 with SHA-256, and the only part
 * that is not obvious is `dsaEncoding`: Node signs to DER by default, while JWS wants the raw
 * `r || s` pair. `ieee-p1363` is that pair. Getting it wrong produces a well-formed token that
 * Apple rejects as `invalid_client`, which is indistinguishable from every other cause of
 * `invalid_client` and is the reason this comment exists.
 */

/** Apple's audience, fixed, and the same for every team. */
const AUDIENCE = 'https://appleid.apple.com'

/**
 * Two minutes. Long enough for a token exchange including a retry, short enough that a captured
 * secret is worthless by the time anybody looks at it. Apple's ceiling is 15777000 seconds; the
 * distance between that and this is the whole point.
 */
const LIFETIME_SECONDS = 120

/**
 * What the pod is told about Apple.
 *
 * Only `privateKey` comes from a Kubernetes secret. The other four are in the chart, because a
 * Team ID is the prefix on every App ID the account owns, a Key ID travels to Apple in the `kid`
 * header of every exchange, and a Services ID is the public `client_id` in the authorize URL.
 * None of them authenticates anything without the key. See docs/AUTH.md.
 */
export interface AppleConfig {
  /** The developer team, and the `iss` of the client secret. */
  readonly teamId: string
  /** Which key signed it, so Apple knows which public half to check against. */
  readonly keyId: string
  /** The Services ID. This is the `client_id`, and it is **not** the App ID. */
  readonly servicesId: string
  /** Byte-identical to a Return URL registered on the Services ID, or Apple refuses it. */
  readonly redirectUri: string
  /** The `.p8`, PEM, as downloaded. */
  readonly privateKey: string
}

function segment(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

/**
 * The client secret for one token exchange.
 *
 * `now` is injected rather than read here so a test can pin it, and so a single exchange cannot
 * straddle a second boundary between `iat` and `exp`.
 */
export function clientSecret(config: AppleConfig, now: Date): string {
  const issued = Math.floor(now.getTime() / 1000)
  const signing = [
    segment({ alg: 'ES256', kid: config.keyId, typ: 'JWT' }),
    segment({
      iss: config.teamId,
      iat: issued,
      exp: issued + LIFETIME_SECONDS,
      aud: AUDIENCE,
      // The Services ID, not the bundle ID. Using the App ID here is the single most common way
      // to get `invalid_client` back, and the error says nothing about which field is wrong.
      sub: config.servicesId,
    }),
  ].join('.')

  const signature = sign('sha256', Buffer.from(signing), {
    key: createPrivateKey(config.privateKey),
    dsaEncoding: 'ieee-p1363',
  })

  return `${signing}.${signature.toString('base64url')}`
}

/** Apple's three endpoints. Fixed, and the same for every team. */
const AUTHORIZE = 'https://appleid.apple.com/auth/authorize'
const TOKEN = 'https://appleid.apple.com/auth/token'
const KEYS = 'https://appleid.apple.com/auth/keys'

/** The relay domain behind "Hide My Email". See `AppleIdentity.isPrivateRelay`. */
const RELAY_DOMAIN = '@privaterelay.appleid.com'

/**
 * What Apple tells us about somebody, once the token has been checked.
 *
 * `sub` is the identity and the other three are context. Apple's `sub` is stable per developer
 * team, so the same person is the same `sub` in dev and in production, and it survives every
 * change they make to their address.
 */
export interface AppleIdentity {
  readonly sub: string
  readonly email: string | null
  /** Apple's own claim that it checked. Never assume it; the linking rule turns on this. */
  readonly emailVerified: boolean
  /** A "Hide My Email" address, which forwards and can be switched off. */
  readonly isPrivateRelay: boolean
}

/**
 * Something went wrong with Apple rather than with us.
 *
 * `reason` is a short tag rather than a message, because it reaches a redirect query string that
 * the sign-in dialog turns into something a person can read. Apple's own errors are not for
 * showing to anybody.
 */
export class AppleError extends Error {
  constructor(readonly reason: string) {
    super(`apple: ${reason}`)
    this.name = 'AppleError'
  }
}

/** Just enough of `fetch` to be substitutable in a test without inventing a Response. */
export type Fetcher = (
  url: string,
  init?: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>

/**
 * Where to send the browser to start.
 *
 * `response_mode=form_post` is required the moment `scope` is non-empty, and it is what makes the
 * callback a POST. `state` and `nonce` are both carried: `state` is ours to compare against a
 * cookie, `nonce` goes into the `id_token` and is compared there, so a token minted for somebody
 * else's session does not work in this one.
 */
export function authorizeUrl(
  config: AppleConfig,
  params: { state: string; nonce: string },
): string {
  const query = new URLSearchParams({
    client_id: config.servicesId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'name email',
    state: params.state,
    nonce: params.nonce,
  })
  return `${AUTHORIZE}?${query.toString()}`
}

/**
 * Apple sends `email_verified` and `is_private_email` as **either** a boolean or the string
 * `"true"`, depending on the token and on the day. Both spellings mean the same thing and the
 * difference is undocumented, so reading it as `claim === true` silently treats a verified
 * address as unverified, and that failure is invisible: sign-in works, linking just never
 * happens and everybody quietly gets a second account.
 */
function flag(claim: unknown): boolean {
  return claim === true || claim === 'true'
}

/**
 * One JWT segment, as an object, or an `AppleError`.
 *
 * The try/catch is not decoration. `Buffer.from(x, 'base64url')` never throws -- it drops what is
 * not base64 and returns what is left -- so a mangled segment reaches `JSON.parse` as garbage and
 * throws a `SyntaxError`. Letting that escape turns a bad token into a 500 with a stack trace,
 * where the honest answer is a failed sign-in.
 */
function decode(segment: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))
  } catch {
    throw new AppleError('malformed-token')
  }
  if (typeof parsed !== 'object' || parsed === null) throw new AppleError('malformed-token')
  return parsed as Record<string, unknown>
}

/** Apple talks to us, and we talk to Apple. One object so the JWKS cache has somewhere to live. */
export interface AppleClient {
  /** Trades the one-time code for an `id_token`. */
  exchange(code: string, now: Date): Promise<string>
  /** Checks an `id_token` completely, and says who it is about. */
  verify(idToken: string, expectedNonce: string, now: Date): Promise<AppleIdentity>
}

async function objectFrom(
  response: { ok: boolean; json: () => Promise<unknown> },
  reason: string,
): Promise<Record<string, unknown>> {
  if (!response.ok) throw new AppleError(reason)
  const body: unknown = await response.json()
  if (typeof body !== 'object' || body === null) throw new AppleError(reason)
  return body as Record<string, unknown>
}

/**
 * The client, holding the one piece of state worth keeping: Apple's public keys.
 *
 * Cached until a token arrives naming a `kid` we do not have, and refetched then. That is the
 * whole rotation strategy, and it is better than a TTL in both directions: a TTL refetches keys
 * that have not changed, and still fails for the length of the TTL on the day they do. Apple
 * publishes the new key before it signs with it, so the miss happens once and fixes itself.
 */
export function appleClient(config: AppleConfig, fetcher: Fetcher): AppleClient {
  let keys: Record<string, unknown>[] = []

  const known = (kid: string): Record<string, unknown> | undefined =>
    keys.find((key) => key.kid === kid)

  const keyFor = async (kid: string): Promise<Record<string, unknown>> => {
    if (known(kid) === undefined) {
      const body = await objectFrom(await fetcher(KEYS), 'keys-unavailable')
      keys = Array.isArray(body.keys) ? (body.keys as Record<string, unknown>[]) : []
    }
    const key = known(kid)
    // A token signed by a key Apple does not publish. Refusing is the only safe answer.
    if (key === undefined) throw new AppleError('unknown-key')
    return key
  }

  return {
    exchange: async (code, now) => {
      const form = new URLSearchParams({
        client_id: config.servicesId,
        // Minted here, valid for two minutes, and never stored. See the top of this file.
        client_secret: clientSecret(config, now),
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      })
      const response = await fetcher(TOKEN, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      const payload = await objectFrom(response, 'exchange-failed')
      const idToken = payload.id_token
      if (typeof idToken !== 'string') throw new AppleError('no-id-token')
      return idToken
    },

    verify: async (idToken, expectedNonce, now) => {
      const parts = idToken.split('.')
      const [rawHeader, rawClaims, rawSignature] = parts
      if (rawHeader === undefined || rawClaims === undefined || rawSignature === undefined) {
        throw new AppleError('malformed-token')
      }

      const kid = decode(rawHeader).kid
      if (typeof kid !== 'string') throw new AppleError('malformed-token')

      const signed = verifySignature(
        'sha256',
        Buffer.from(`${rawHeader}.${rawClaims}`),
        createPublicKey({ key: (await keyFor(kid)) as never, format: 'jwk' }),
        Buffer.from(rawSignature, 'base64url'),
      )
      // Before any claim is read. A claim from an unverified token is somebody else's assertion.
      if (!signed) throw new AppleError('bad-signature')

      const claims = decode(rawClaims)
      if (claims.iss !== AUDIENCE) throw new AppleError('wrong-issuer')
      // Ours, not somebody else's app. A token minted for another client is a valid token.
      if (claims.aud !== config.servicesId) throw new AppleError('wrong-audience')
      if (typeof claims.exp !== 'number' || claims.exp * 1000 <= now.getTime()) {
        throw new AppleError('expired')
      }
      // Binds the token to the browser that started this, so one captured in flight is useless
      // in any other session.
      if (claims.nonce !== expectedNonce) throw new AppleError('wrong-nonce')

      const sub = claims.sub
      if (typeof sub !== 'string' || sub === '') throw new AppleError('no-subject')

      const email = typeof claims.email === 'string' ? claims.email : null
      return {
        sub,
        email,
        emailVerified: flag(claims.email_verified),
        // Apple's own flag, with the domain as a backstop: the claim is the authority, but an
        // address at the relay domain is a relay address whatever the token says about it.
        isPrivateRelay: flag(claims.is_private_email) || (email?.endsWith(RELAY_DOMAIN) ?? false),
      }
    },
  }
}
