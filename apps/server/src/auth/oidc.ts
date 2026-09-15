import { createPublicKey, verify as verifySignature } from 'node:crypto'
import type { Provider } from './types.js'

/**
 * The half of Sign in with Apple and Sign in with Google that is the same half.
 *
 * Both are OpenID Connect, so both end in the same place: a signed `id_token` whose claims have
 * to be checked before a single one of them is believed. That check is the security of the whole
 * feature, and it exists here once. Two copies of it would be two places for a provider-specific
 * "fix" to drift into, and the second copy is always the one nobody rereads.
 *
 * What genuinely differs between the two is small and lives in `OidcProvider`: the endpoints, how
 * a client secret is arrived at (Apple makes us mint one, Google issues one), which issuer
 * strings to accept, and whether the callback comes back as a form post. See `apple.ts` and
 * `google.ts`, which are both thin.
 */

/** Just enough of `fetch` to be substitutable in a test without inventing a Response. */
export type Fetcher = (
  url: string,
  init?: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>

/**
 * Something went wrong with the provider rather than with us.
 *
 * `reason` is a short tag rather than a message, because it reaches a redirect query string that
 * the sign-in dialog turns into something a person can read. A provider's own errors are not for
 * showing to anybody, and neither is the name of the check that failed.
 */
export class OidcError extends Error {
  constructor(readonly reason: string) {
    super(`oidc: ${reason}`)
    this.name = 'OidcError'
  }
}

/** What a provider tells us about somebody, once the token has been checked. */
export interface OidcIdentity {
  /** The identity. Stable, and the only thing worth keying an account on. */
  readonly sub: string
  readonly email: string | null
  /** The provider's own claim that it checked. Never assume it; linking turns on this. */
  readonly emailVerified: boolean
  /** An address that forwards rather than a mailbox. Apple's Hide My Email; Google has none. */
  readonly isPrivateRelay: boolean
}

export interface OidcProvider {
  /** Which column of `auth_identities` these land in. */
  readonly name: Provider
  readonly authorizeUrl: string
  readonly tokenUrl: string
  readonly keysUrl: string
  /**
   * Every `iss` worth accepting. A list rather than a string because Google mints tokens with
   * both `https://accounts.google.com` and the bare `accounts.google.com`, interchangeably and by
   * design, so accepting only the documented one rejects real tokens at random.
   */
  readonly issuers: readonly string[]
  readonly clientId: string
  readonly redirectUri: string
  readonly scope: string
  /**
   * The client secret for one exchange.
   *
   * A function rather than a string because Apple does not issue one: it is a JWT we sign per
   * exchange, and that is the whole reason nothing here has an expiry date on it. Google returns
   * the stored string and ignores the argument.
   */
  readonly secret: (now: Date) => string
  /** Extra authorize parameters. Apple needs `response_mode=form_post`; Google needs none. */
  readonly authorizeExtras?: Readonly<Record<string, string>>
  /** Whether this address forwards rather than delivers. Apple only. */
  readonly relayed?: (email: string, claims: Record<string, unknown>) => boolean
}

/** Where to send the browser to start. */
export function authorizeUrl(
  provider: OidcProvider,
  params: { state: string; nonce: string },
): string {
  const query = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: 'code',
    scope: provider.scope,
    state: params.state,
    nonce: params.nonce,
    ...provider.authorizeExtras,
  })
  return `${provider.authorizeUrl}?${query.toString()}`
}

/**
 * A claim that means yes.
 *
 * Apple sends `email_verified` and `is_private_email` as **either** a boolean or the string
 * `"true"`, depending on the token and on the day, and the difference is undocumented. Reading it
 * as `claim === true` silently treats a verified address as unverified, and that failure is
 * invisible: sign-in still works, linking just never happens, and everybody quietly gets a second
 * account. Google sends a real boolean, and loses nothing by passing through the same funnel.
 */
export function flag(claim: unknown): boolean {
  return claim === true || claim === 'true'
}

/**
 * One JWT segment, as an object, or an `OidcError`.
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
    throw new OidcError('malformed-token')
  }
  if (typeof parsed !== 'object' || parsed === null) throw new OidcError('malformed-token')
  return parsed as Record<string, unknown>
}

async function objectFrom(
  response: { ok: boolean; json: () => Promise<unknown> },
  reason: string,
): Promise<Record<string, unknown>> {
  if (!response.ok) throw new OidcError(reason)
  const body: unknown = await response.json()
  if (typeof body !== 'object' || body === null) throw new OidcError(reason)
  return body as Record<string, unknown>
}

export interface OidcClient {
  /** Trades the one-time code for an `id_token`. */
  exchange(code: string, now: Date): Promise<string>
  /** Checks an `id_token` completely, and says who it is about. */
  verify(idToken: string, expectedNonce: string, now: Date): Promise<OidcIdentity>
}

/**
 * The client, holding the one piece of state worth keeping: the provider's public keys.
 *
 * Cached until a token arrives naming a `kid` we do not have, and refetched then. That is the
 * whole rotation strategy, and it is better than a TTL in both directions: a TTL refetches keys
 * that have not changed, and still fails for the length of the TTL on the day they do. Both
 * providers publish a new key before they sign with it, so the miss happens once and fixes itself.
 */
export function oidcClient(provider: OidcProvider, fetcher: Fetcher): OidcClient {
  let keys: Record<string, unknown>[] = []

  const known = (kid: string): Record<string, unknown> | undefined =>
    keys.find((key) => key.kid === kid)

  const keyFor = async (kid: string): Promise<Record<string, unknown>> => {
    if (known(kid) === undefined) {
      const body = await objectFrom(await fetcher(provider.keysUrl), 'keys-unavailable')
      keys = Array.isArray(body.keys) ? (body.keys as Record<string, unknown>[]) : []
    }
    const key = known(kid)
    // A token signed by a key the provider does not publish. Refusing is the only safe answer.
    if (key === undefined) throw new OidcError('unknown-key')
    return key
  }

  return {
    exchange: async (code, now) => {
      const form = new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.secret(now),
        code,
        grant_type: 'authorization_code',
        redirect_uri: provider.redirectUri,
      })
      const response = await fetcher(provider.tokenUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      const payload = await objectFrom(response, 'exchange-failed')
      const idToken = payload.id_token
      if (typeof idToken !== 'string') throw new OidcError('no-id-token')
      return idToken
    },

    verify: async (idToken, expectedNonce, now) => {
      const [rawHeader, rawClaims, rawSignature] = idToken.split('.')
      if (rawHeader === undefined || rawClaims === undefined || rawSignature === undefined) {
        throw new OidcError('malformed-token')
      }

      const kid = decode(rawHeader).kid
      if (typeof kid !== 'string') throw new OidcError('malformed-token')

      const signed = verifySignature(
        'sha256',
        Buffer.from(`${rawHeader}.${rawClaims}`),
        createPublicKey({ key: (await keyFor(kid)) as never, format: 'jwk' }),
        Buffer.from(rawSignature, 'base64url'),
      )
      // Before any claim is read. A claim from an unverified token is somebody else's assertion.
      if (!signed) throw new OidcError('bad-signature')

      const claims = decode(rawClaims)
      if (typeof claims.iss !== 'string' || !provider.issuers.includes(claims.iss)) {
        throw new OidcError('wrong-issuer')
      }
      // Ours, not somebody else's app. A token minted for another client is a valid token, and
      // without this check presenting one here signs you in as its subject.
      if (claims.aud !== provider.clientId) throw new OidcError('wrong-audience')
      if (typeof claims.exp !== 'number' || claims.exp * 1000 <= now.getTime()) {
        throw new OidcError('expired')
      }
      // Binds the token to the browser that started this, so one captured in flight is useless
      // in any other session.
      if (claims.nonce !== expectedNonce) throw new OidcError('wrong-nonce')

      const sub = claims.sub
      if (typeof sub !== 'string' || sub === '') throw new OidcError('no-subject')

      const email = typeof claims.email === 'string' ? claims.email : null
      return {
        sub,
        email,
        emailVerified: flag(claims.email_verified),
        isPrivateRelay: email !== null && (provider.relayed?.(email, claims) ?? false),
      }
    },
  }
}
