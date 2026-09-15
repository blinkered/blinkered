import { createPrivateKey, sign } from 'node:crypto'
import { flag } from './oidc.js'
import type { OidcProvider } from './oidc.js'

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

/** The relay domain behind "Hide My Email". */
const RELAY_DOMAIN = '@privaterelay.appleid.com'

/**
 * Apple as an OpenID Connect provider, which is all that is left once the secret is minted.
 *
 * Three things here are not shared with Google, and they are the whole of the difference:
 *
 * - **`response_mode=form_post`**, required the moment `scope` is non-empty. It is what makes
 *   the callback a POST from appleid.apple.com rather than a redirect back, and therefore what
 *   forces the state cookie to `SameSite=None`. See `routes.ts`.
 * - **A minted secret.** `secret()` signs a fresh two-minute JWT per exchange.
 * - **Relay addresses.** Apple's own claim, with the domain as a backstop: the claim is the
 *   authority, but an address at the relay domain is a relay address whatever the token says.
 */
export function appleProvider(config: AppleConfig): OidcProvider {
  return {
    name: 'apple',
    authorizeUrl: AUTHORIZE,
    tokenUrl: TOKEN,
    keysUrl: KEYS,
    issuers: ['https://appleid.apple.com'],
    clientId: config.servicesId,
    redirectUri: config.redirectUri,
    scope: 'name email',
    authorizeExtras: { response_mode: 'form_post' },
    secret: (now) => clientSecret(config, now),
    relayed: (email, claims) => flag(claims.is_private_email) || email.endsWith(RELAY_DOMAIN),
  }
}
