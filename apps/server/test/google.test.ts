import { generateKeyPairSync, sign } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { googleProvider } from '../src/auth/google.js'
import type { GoogleConfig } from '../src/auth/google.js'
import { authorizeUrl, oidcClient } from '../src/auth/oidc.js'
import type { Fetcher } from '../src/auth/oidc.js'

/**
 * Google, which is the thin one: a descriptor over the shared core in `oidc.ts`.
 *
 * The protocol itself is covered by `apple.test.ts` against real keys and is not repeated here.
 * What is asserted is what is actually Google's: the scope list, the static secret, and the two
 * issuer spellings.
 */

const config: GoogleConfig = {
  clientId: '1234.apps.googleusercontent.com',
  clientSecret: 'a-real-secret-issued-by-google',
  redirectUri: 'https://playblinkered.com/v1/auth/google/callback',
}

const provider = googleProvider(config)

const googleKey = generateKeyPairSync('rsa', { modulusLength: 2048 })
const KID = 'google-key-1'
const publicJwk = {
  ...(googleKey.publicKey.export({ format: 'jwk' }) as Record<string, unknown>),
  kid: KID,
  alg: 'RS256',
  use: 'sig',
}

const AT = new Date('2026-09-15T16:00:00Z')

function idToken(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: KID })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({
      iss: 'https://accounts.google.com',
      aud: config.clientId,
      nonce: 'the-nonce',
      sub: '117234567890123456789',
      exp: Math.floor(AT.getTime() / 1000) + 600,
      ...claims,
    }),
  ).toString('base64url')
  const signature = sign('sha256', Buffer.from(`${header}.${body}`), googleKey.privateKey)
  return `${header}.${body}.${signature.toString('base64url')}`
}

const fetcher: Fetcher = (url) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve(url === provider.keysUrl ? { keys: [publicJwk] } : { id_token: idToken({}) }),
  })

describe('the Google provider', () => {
  it('asks for three scopes and no more', () => {
    /*
     * The assertion that keeps Google cheap. `openid`, `email` and `profile` are non-sensitive,
     * so the app never enters Google's verification process. A fourth scope, anything touching
     * Drive or contacts or a calendar, turns publishing into a review with a security
     * questionnaire attached. This test is here to make an accidental addition loud.
     */
    expect(provider.scope).toBe('openid email profile')
  })

  it('does not ask for a form post, so its callback stays an ordinary redirect', () => {
    // Which is what lets the state cookie be SameSite=Lax rather than None.
    expect(provider.authorizeExtras).toBeUndefined()
    expect(
      new URL(authorizeUrl(provider, { state: 's', nonce: 'n' })).searchParams.has('response_mode'),
    ).toBe(false)
  })

  it('returns the secret Google issued rather than minting one', () => {
    // The opposite of Apple, where `secret()` signs a fresh JWT per exchange.
    expect(provider.secret(AT)).toBe('a-real-secret-issued-by-google')
    expect(provider.secret(new Date(AT.getTime() + 999_999))).toBe(provider.secret(AT))
  })

  it('has no notion of a relay address', () => {
    expect(provider.relayed).toBeUndefined()
  })

  it('accepts both spellings of the issuer', async () => {
    /*
     * Google mints tokens with `iss` as either `https://accounts.google.com` or the bare
     * `accounts.google.com`, interchangeably and by design. Accepting only the documented one
     * rejects real tokens intermittently, which is the worst way to find out about it.
     */
    const client = oidcClient(provider, fetcher)
    for (const iss of ['https://accounts.google.com', 'accounts.google.com']) {
      const identity = await client.verify(idToken({ iss }), 'the-nonce', AT)
      expect(identity.sub).toBe('117234567890123456789')
    }
  })

  it('still refuses an issuer that is neither', async () => {
    const client = oidcClient(provider, fetcher)
    await expect(
      client.verify(idToken({ iss: 'https://accounts.google.com.evil.example' }), 'the-nonce', AT),
    ).rejects.toThrow('wrong-issuer')
  })

  it('reads a verified address, and never reports a relay', async () => {
    const client = oidcClient(provider, fetcher)
    const identity = await client.verify(
      idToken({ email: 'player@example.com', email_verified: true }),
      'the-nonce',
      AT,
    )
    expect(identity).toEqual({
      sub: '117234567890123456789',
      email: 'player@example.com',
      emailVerified: true,
      isPrivateRelay: false,
    })
  })

  it('exchanges a code using the static secret', async () => {
    const sent: string[] = []
    const recording: Fetcher = (url, init) => {
      sent.push(init?.body ?? url)
      return fetcher(url, init)
    }
    await oidcClient(provider, recording).exchange('the-code', AT)
    expect(sent[0]).toContain('client_secret=a-real-secret-issued-by-google')
    expect(sent[0]).toContain('grant_type=authorization_code')
  })
})
