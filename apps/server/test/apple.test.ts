import { generateKeyPairSync, sign, verify } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { appleProvider, clientSecret } from '../src/auth/apple.js'
import type { AppleConfig } from '../src/auth/apple.js'
import { authorizeUrl, oidcClient } from '../src/auth/oidc.js'
import type { Fetcher, OidcClient } from '../src/auth/oidc.js'

/**
 * A throwaway P-256 pair, generated per run rather than checked in. A fixture key in a repository
 * is a key somebody eventually uses for something, and this one proves nothing that a fresh one
 * does not.
 */
const pair = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

const config: AppleConfig = {
  teamId: 'ZJ3A78KXA4',
  keyId: '85Z9WXC2Q9',
  servicesId: 'com.tightlinesoftware.blinkered.signin',
  redirectUri: 'https://playblinkered.com/v1/auth/apple/callback',
  privateKey: pair.privateKey,
  bundleId: 'com.tightlinesoftware.blinkered',
}

const AT = new Date('2026-09-15T16:00:00Z')

function part(token: string, index: number): Record<string, unknown> {
  const segment = token.split('.')[index]
  if (segment === undefined) throw new Error('missing segment')
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as Record<string, unknown>
}

describe('the Apple client secret', () => {
  it('is a three-part JWS', () => {
    expect(clientSecret(config, AT).split('.')).toHaveLength(3)
  })

  it('names the key in the header, so Apple knows which public half to check', () => {
    expect(part(clientSecret(config, AT), 0)).toEqual({
      alg: 'ES256',
      kid: '85Z9WXC2Q9',
      typ: 'JWT',
    })
  })

  it('is issued by the team and subject to the Services ID', () => {
    const claims = part(clientSecret(config, AT), 1)
    expect(claims.iss).toBe('ZJ3A78KXA4')
    // The Services ID, never the bundle ID. This assertion is the regression test for the most
    // common Sign in with Apple misconfiguration there is.
    expect(claims.sub).toBe('com.tightlinesoftware.blinkered.signin')
    expect(claims.aud).toBe('https://appleid.apple.com')
  })

  it('lives for two minutes, far inside Apple’s six-month ceiling', () => {
    const claims = part(clientSecret(config, AT), 1)
    expect(claims.iat).toBe(Math.floor(AT.getTime() / 1000))
    expect(Number(claims.exp) - Number(claims.iat)).toBe(120)
    // Apple rejects anything longer than this outright.
    expect(Number(claims.exp) - Number(claims.iat)).toBeLessThan(15_777_000)
  })

  it('verifies against the public half as a raw r||s signature', () => {
    const token = clientSecret(config, AT)
    const [header, claims, signature] = token.split('.')
    expect(signature).toBeDefined()
    const ok = verify(
      'sha256',
      Buffer.from(`${String(header)}.${String(claims)}`),
      { key: pair.publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(String(signature), 'base64url'),
    )
    // The DER default would produce a token that looks right and that Apple answers
    // `invalid_client` to, which is indistinguishable from every other cause of that error.
    expect(ok).toBe(true)
  })

  it('signs a 64-byte signature, which is what p1363 means for P-256', () => {
    const signature = clientSecret(config, AT).split('.')[2]
    expect(Buffer.from(String(signature), 'base64url')).toHaveLength(64)
  })

  it('moves with the clock', () => {
    const later = new Date(AT.getTime() + 60_000)
    expect(part(clientSecret(config, later), 1).iat).toBe(Math.floor(later.getTime() / 1000))
  })
})

/*
 * Apple's side of the conversation, faked.
 *
 * An RSA pair stands in for Apple's signing key and its public half is published as a JWK, which
 * is exactly the shape `appleClient` fetches from `/auth/keys`. That means the verification path
 * is exercised for real -- a genuine RS256 signature over genuine claims -- rather than against a
 * stubbed-out verifier, which would test nothing worth testing.
 */
const appleKey = generateKeyPairSync('rsa', { modulusLength: 2048 })
const KID = 'apple-key-1'

const publicJwk = {
  ...(appleKey.publicKey.export({ format: 'jwk' }) as Record<string, unknown>),
  kid: KID,
  alg: 'RS256',
  use: 'sig',
}

const LIVE = { exp: Math.floor(AT.getTime() / 1000) + 600 }

function idToken(
  claims: Record<string, unknown>,
  options: { kid?: string; signature?: string } = {},
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: options.kid ?? KID })).toString(
    'base64url',
  )
  const body = Buffer.from(
    JSON.stringify({
      iss: 'https://appleid.apple.com',
      aud: config.servicesId,
      nonce: 'the-nonce',
      sub: '001234.abcdef.5678',
      ...LIVE,
      ...claims,
    }),
  ).toString('base64url')
  const signature =
    options.signature ??
    sign('sha256', Buffer.from(`${header}.${body}`), appleKey.privateKey).toString('base64url')
  return `${header}.${body}.${signature}`
}

/** A fetcher that answers from a script and records what it was asked. */
function fakeFetch(answers: { ok?: boolean; body?: unknown }[]): Fetcher & { calls: string[] } {
  const calls: string[] = []
  let at = 0
  const fetcher = (
    url: string,
  ): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> => {
    calls.push(url)
    const answer = answers[Math.min(at, answers.length - 1)] ?? {}
    at += 1
    return Promise.resolve({
      ok: answer.ok ?? true,
      status: answer.ok === false ? 400 : 200,
      json: () => Promise.resolve(answer.body ?? {}),
    })
  }
  return Object.assign(fetcher, { calls })
}

const keysBody = { keys: [publicJwk] }

describe('the authorize URL', () => {
  const url = new URL(authorizeUrl(appleProvider(config), { state: 'st', nonce: 'no' }))

  it('goes to Apple with the Services ID as the client', () => {
    expect(url.origin + url.pathname).toBe('https://appleid.apple.com/auth/authorize')
    expect(url.searchParams.get('client_id')).toBe('com.tightlinesoftware.blinkered.signin')
  })

  it('asks for a form post, which is what makes the callback a POST', () => {
    // Required the moment `scope` is non-empty, and the reason the state cookie has to be
    // SameSite=None. Changing this without changing the cookie breaks sign-in silently.
    expect(url.searchParams.get('response_mode')).toBe('form_post')
    expect(url.searchParams.get('scope')).toBe('name email')
  })

  it('carries both the state and the nonce', () => {
    expect(url.searchParams.get('state')).toBe('st')
    expect(url.searchParams.get('nonce')).toBe('no')
    expect(url.searchParams.get('redirect_uri')).toBe(config.redirectUri)
  })
})

describe('exchanging the code', () => {
  it('posts the minted secret and returns the id_token', async () => {
    const fetcher = fakeFetch([{ body: { id_token: 'an.id.token' } }])
    expect(await oidcClient(appleProvider(config), fetcher).exchange('the-code', AT)).toBe(
      'an.id.token',
    )
    expect(fetcher.calls).toEqual(['https://appleid.apple.com/auth/token'])
  })

  it('fails when Apple refuses', async () => {
    const client = oidcClient(appleProvider(config), fakeFetch([{ ok: false }]))
    await expect(client.exchange('the-code', AT)).rejects.toThrow('exchange-failed')
  })

  it('fails when the body is not an object at all', async () => {
    const client = oidcClient(appleProvider(config), fakeFetch([{ body: 'nope' }]))
    await expect(client.exchange('the-code', AT)).rejects.toThrow('exchange-failed')
  })

  it('fails when there is no id_token in it', async () => {
    const client = oidcClient(appleProvider(config), fakeFetch([{ body: { access_token: 'x' } }]))
    await expect(client.exchange('the-code', AT)).rejects.toThrow('no-id-token')
  })
})

describe('verifying the id_token', () => {
  const client = (answers: { ok?: boolean; body?: unknown }[] = [{ body: keysBody }]): OidcClient =>
    oidcClient(appleProvider(config), fakeFetch(answers))

  it('accepts a good token and reports who it is about', async () => {
    const identity = await client().verify(
      idToken({ email: 'player@example.com', email_verified: true }),
      'the-nonce',
      AT,
    )
    expect(identity).toEqual({
      sub: '001234.abcdef.5678',
      email: 'player@example.com',
      emailVerified: true,
      isPrivateRelay: false,
    })
  })

  it('reads email_verified when Apple spells it as a string', async () => {
    // Apple sends either, undocumented. Reading it as `=== true` makes every verified address
    // look unverified, which disables linking without failing anything.
    const identity = await client().verify(
      idToken({ email: 'player@example.com', email_verified: 'true' }),
      'the-nonce',
      AT,
    )
    expect(identity.emailVerified).toBe(true)
  })

  it('treats anything else as unverified', async () => {
    const identity = await client().verify(
      idToken({ email: 'player@example.com', email_verified: 'yes' }),
      'the-nonce',
      AT,
    )
    expect(identity.emailVerified).toBe(false)
  })

  it('spots a relay address from the claim', async () => {
    const identity = await client().verify(
      idToken({ email: 'x@example.com', is_private_email: 'true' }),
      'the-nonce',
      AT,
    )
    expect(identity.isPrivateRelay).toBe(true)
  })

  it('spots a relay address from the domain even without the claim', async () => {
    const identity = await client().verify(
      idToken({ email: 'k7m2xq9p4r@privaterelay.appleid.com' }),
      'the-nonce',
      AT,
    )
    expect(identity.isPrivateRelay).toBe(true)
  })

  it('has no email when Apple sends none', async () => {
    const identity = await client().verify(idToken({}), 'the-nonce', AT)
    expect(identity.email).toBeNull()
    expect(identity.isPrivateRelay).toBe(false)
  })

  it('fetches the keys once and caches them', async () => {
    const fetcher = fakeFetch([{ body: keysBody }])
    const cached = oidcClient(appleProvider(config), fetcher)
    await cached.verify(idToken({}), 'the-nonce', AT)
    await cached.verify(idToken({}), 'the-nonce', AT)
    expect(fetcher.calls).toEqual(['https://appleid.apple.com/auth/keys'])
  })

  it('refuses a token signed by a key Apple does not publish', async () => {
    await expect(client().verify(idToken({}, { kid: 'other' }), 'the-nonce', AT)).rejects.toThrow(
      'unknown-key',
    )
  })

  it('refuses when the key list cannot be fetched', async () => {
    await expect(client([{ ok: false }]).verify(idToken({}), 'the-nonce', AT)).rejects.toThrow(
      'keys-unavailable',
    )
  })

  it('refuses when the key list is not a list', async () => {
    await expect(
      client([{ body: { keys: 'nope' } }]).verify(idToken({}), 'the-nonce', AT),
    ).rejects.toThrow('unknown-key')
  })

  it('refuses a token that is not three parts', async () => {
    await expect(client().verify('two.parts', 'the-nonce', AT)).rejects.toThrow('malformed-token')
  })

  it('refuses a header with no kid', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url')
    await expect(client().verify(`${header}.e30.x`, 'the-nonce', AT)).rejects.toThrow(
      'malformed-token',
    )
  })

  it('refuses a segment that is not JSON, rather than throwing a SyntaxError', async () => {
    await expect(client().verify('!!!.e30.x', 'the-nonce', AT)).rejects.toThrow('malformed-token')
  })

  it('refuses a segment that is JSON but not an object', async () => {
    const header = Buffer.from('42').toString('base64url')
    await expect(client().verify(`${header}.e30.x`, 'the-nonce', AT)).rejects.toThrow(
      'malformed-token',
    )
  })

  it('refuses a forged signature', async () => {
    await expect(
      client().verify(idToken({}, { signature: 'AAAA' }), 'the-nonce', AT),
    ).rejects.toThrow('bad-signature')
  })

  it('refuses a token from the wrong issuer', async () => {
    await expect(
      client().verify(idToken({ iss: 'https://evil.example' }), 'the-nonce', AT),
    ).rejects.toThrow('wrong-issuer')
  })

  it('refuses a token minted for somebody else', async () => {
    // A perfectly valid Apple token, for a different app. Without this check it signs you in.
    await expect(
      client().verify(idToken({ aud: 'com.someone.else' }), 'the-nonce', AT),
    ).rejects.toThrow('wrong-audience')
  })

  it('refuses an expired token', async () => {
    await expect(
      client().verify(idToken({ exp: Math.floor(AT.getTime() / 1000) - 1 }), 'the-nonce', AT),
    ).rejects.toThrow('expired')
  })

  it('refuses a token with no expiry', async () => {
    await expect(client().verify(idToken({ exp: 'soon' }), 'the-nonce', AT)).rejects.toThrow(
      'expired',
    )
  })

  it('refuses a token minted for another session', async () => {
    await expect(client().verify(idToken({}), 'a-different-nonce', AT)).rejects.toThrow(
      'wrong-nonce',
    )
  })

  it('refuses a token with no subject', async () => {
    await expect(client().verify(idToken({ sub: '' }), 'the-nonce', AT)).rejects.toThrow(
      'no-subject',
    )
  })
})
