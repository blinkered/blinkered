import type { OidcProvider } from './oidc.js'

/**
 * Sign in with Google, which is the cheap one, and cheap for a reason worth protecting.
 *
 * **The scopes are `openid`, `email`, `profile` and nothing else.** Those three are
 * non-sensitive, so the app never enters Google's verification process. Ask for a fourth --
 * anything touching Drive, contacts, or somebody's calendar -- and publishing turns into a review
 * with a security questionnaire attached. There is no reason a word game needs a fourth scope.
 * The point of naming it here is to make an accidental addition obvious.
 */
const SCOPE = 'openid email profile'

const AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN = 'https://oauth2.googleapis.com/token'
const KEYS = 'https://www.googleapis.com/oauth2/v3/certs'

/**
 * What the pod is told about Google.
 *
 * Both values are per environment, unlike Apple's single Services ID: production and development
 * are separate OAuth clients in one project, so a leaked development secret is not a production
 * incident. See docs/AUTH.md.
 */
export interface GoogleConfig {
  readonly clientId: string
  /** Issued by Google, unlike Apple's, which we mint. A real secret, from a Kubernetes secret. */
  readonly clientSecret: string
  readonly redirectUri: string
}

/**
 * Google as an OpenID Connect provider.
 *
 * Two differences from Apple worth knowing, both handled here rather than in the shared core:
 *
 * - **Two issuer spellings.** Google mints `id_token`s with `iss` as either
 *   `https://accounts.google.com` or the bare `accounts.google.com`, interchangeably. Accepting
 *   only the first rejects real tokens, intermittently, which is the worst way to find out.
 * - **No `response_mode`.** The callback is an ordinary redirect with a query string, so it is a
 *   GET and the state cookie can be `SameSite=Lax` -- which is the stricter choice, and the one
 *   to prefer wherever the flow allows it.
 */
export function googleProvider(config: GoogleConfig): OidcProvider {
  return {
    name: 'google',
    authorizeUrl: AUTHORIZE,
    tokenUrl: TOKEN,
    keysUrl: KEYS,
    issuers: ['https://accounts.google.com', 'accounts.google.com'],
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: SCOPE,
    secret: () => config.clientSecret,
  }
}
