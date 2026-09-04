import { describe, expect, it, vi } from 'vitest'
import {
  codeMatches,
  hashCode,
  hashSessionToken,
  looksLikeCode,
  newCode,
  newSessionToken,
} from '../src/auth/secrets.js'
import {
  CODE_LIFETIME_MS,
  MAX_ATTEMPTS,
  MAX_CODES_PER_WINDOW,
  codeExpiry,
  looksLikeEmail,
  normalizeEmail,
  tooManyCodes,
  verifyCode,
  windowStart,
} from '../src/auth/policy.js'
import type { CodeRow } from '../src/auth/policy.js'
import { consoleMailer, noMailer } from '../src/auth/mail.js'
import {
  checkUsername,
  generateUsername,
  isGeneratedUsername,
  normalizeUsername,
} from '../src/auth/usernames.js'

describe('login codes', () => {
  it('is six digits, and every digit is reachable', () => {
    // Uniformity is the property that matters and it cannot be asserted from one draw, so this
    // checks the shape exhaustively and the spread loosely: a generator that quietly favoured
    // low digits would still pass the regex.
    const codes = Array.from({ length: 400 }, () => newCode())
    for (const code of codes) expect(looksLikeCode(code)).toBe(true)
    const digits = new Set([...codes.join('')])
    expect(digits.size).toBe(10)
  })

  it('refuses anything that is not six digits', () => {
    for (const bad of ['', '12345', '1234567', 'abcdef', '12345a', ' 123456', '12 3456']) {
      expect(looksLikeCode(bad), bad).toBe(false)
    }
  })

  it('never stores the code', () => {
    const code = '123456'
    const stored = hashCode(code)
    expect(stored).not.toContain(code)
    expect(codeMatches(code, stored)).toBe(true)
    expect(codeMatches('123457', stored)).toBe(false)
  })

  it('salts, so two codes the same do not look the same', () => {
    // Without this a leaked table tells an attacker which accounts share a code, and a rainbow
    // table over a million possibilities is trivial to build once.
    expect(hashCode('123456')).not.toBe(hashCode('123456'))
  })

  it('answers no to a stored value it cannot read, rather than throwing', () => {
    // The caller is a sign-in route. A row it cannot parse is a failed sign-in, not a 500 that
    // tells whoever is poking at it that they found something interesting.
    for (const junk of ['', 'nonsense', 'nosalt:', ':nohash', 'zz:zz', 'aabb:ccdd']) {
      expect(codeMatches('123456', junk), junk).toBe(false)
    }
  })
})

describe('session tokens', () => {
  it('hands back a token and its hash, and stores neither the other way round', () => {
    const { token, hash } = newSessionToken()
    expect(hash).toBe(hashSessionToken(token))
    expect(hash).not.toBe(token)
    // 32 bytes of base64url. Long enough that nothing enumerates it, which is why this one is
    // allowed a fast hash where the six-digit code is not.
    expect(token.length).toBeGreaterThanOrEqual(43)
  })

  it('does not repeat itself', () => {
    const seen = new Set(Array.from({ length: 200 }, () => newSessionToken().token))
    expect(seen.size).toBe(200)
  })
})

describe('the rules a code is subject to', () => {
  const at = (ms: number): Date => new Date(ms)
  const row = (over: Partial<CodeRow> = {}): CodeRow => ({
    codeHash: 'stored',
    attempts: 0,
    expiresAt: at(1000),
    consumedAt: null,
    ...over,
  })
  const right = (code: string): boolean => code === '123456'

  it('opens on the right code', () => {
    expect(verifyCode(row(), '123456', at(0), right)).toBe('ok')
  })

  it('says wrong while there are guesses left', () => {
    expect(verifyCode(row({ attempts: 1 }), '000000', at(0), right)).toBe('wrong')
  })

  it('calls the last wrong guess wrong, and the one after it dead', () => {
    // The first version returned `dead` for the guess that reached the limit, which read well
    // and broke the route: attempts are only recorded on `wrong`, so that guess was never
    // counted, the total stopped one short of the limit, and the real code worked for ever.
    expect(verifyCode(row({ attempts: MAX_ATTEMPTS - 1 }), '000000', at(0), right)).toBe('wrong')
    expect(verifyCode(row({ attempts: MAX_ATTEMPTS }), '000000', at(0), right)).toBe('dead')
  })

  it('says the same thing for expired, reused and exhausted', () => {
    // Distinguishing them confirms to somebody working through codes that the address is real
    // and that they were close enough to matter.
    expect(verifyCode(row({ consumedAt: at(5) }), '123456', at(0), right)).toBe('dead')
    expect(verifyCode(row({ attempts: MAX_ATTEMPTS }), '123456', at(0), right)).toBe('dead')
    expect(verifyCode(row(), '123456', at(1000), right)).toBe('dead')
  })

  it('decides everything it can from the row before hashing anything', () => {
    // scrypt is the expensive call, so it is the one an attacker would like to make us run. A
    // dead row must never reach it.
    const matches = vi.fn(() => true)
    verifyCode(row({ consumedAt: at(5) }), '123456', at(0), matches)
    verifyCode(row({ attempts: MAX_ATTEMPTS }), '123456', at(0), matches)
    verifyCode(row(), '123456', at(1000), matches)
    expect(matches).not.toHaveBeenCalled()
  })

  it('expires exactly at the boundary, not a millisecond after', () => {
    expect(codeExpiry(at(0)).getTime()).toBe(CODE_LIFETIME_MS)
    expect(verifyCode(row({ expiresAt: at(1000) }), '123456', at(999), right)).toBe('ok')
    expect(verifyCode(row({ expiresAt: at(1000) }), '123456', at(1000), right)).toBe('dead')
  })
})

describe('asking for codes', () => {
  it('stops at the limit', () => {
    expect(tooManyCodes(MAX_CODES_PER_WINDOW - 1)).toBe(false)
    expect(tooManyCodes(MAX_CODES_PER_WINDOW)).toBe(true)
  })

  it('measures the window backwards from now', () => {
    expect(windowStart(new Date(1_000_000)).getTime()).toBeLessThan(1_000_000)
  })
})

describe('addresses', () => {
  it('lower-cases and trims, and does nothing cleverer', () => {
    expect(normalizeEmail('  Nick@Example.COM ')).toBe('nick@example.com')
    // Gmail treats these as the same mailbox and other providers do not. Deciding that here
    // would be holding a policy about somebody else's mail server.
    expect(normalizeEmail('n.i.c.k+game@example.com')).toBe('n.i.c.k+game@example.com')
  })

  it('rejects what is obviously not an address', () => {
    for (const bad of ['', 'nick', 'nick@', '@example.com', 'nick@example', 'a b@example.com']) {
      expect(looksLikeEmail(bad), bad).toBe(false)
    }
    expect(looksLikeEmail(`${'a'.repeat(250)}@example.com`)).toBe(false)
  })

  it('accepts the awkward ones a strict regex would throw away', () => {
    for (const good of [
      'nick@example.com',
      'nick+blinkered@example.co.uk',
      "o'brien@example.com",
      'nick@tightlinesoftware.software',
    ]) {
      expect(looksLikeEmail(good), good).toBe(true)
    }
  })
})

describe('mailers', () => {
  it('writes the code where a developer can read it, and says it sent nothing', async () => {
    const lines: string[] = []
    await consoleMailer((line) => lines.push(line)).send({
      to: 'nick@example.com',
      code: '123456',
      locale: 'en',
    })
    expect(lines[0]).toContain('123456')
    // A sink that looks like a sender is how a deployment quietly stops delivering mail while
    // every dashboard stays green.
    expect(lines[0]).toContain('NO MAIL SENT')
  })

  it('refuses when nothing is configured, rather than pretending', async () => {
    await expect(noMailer().send({ to: 'a@b.com', code: '1', locale: 'en' })).rejects.toThrow(
      /no mailer is configured/,
    )
  })
})

describe('usernames', () => {
  it('gives a new account a name it can use immediately', () => {
    // The whole point: every path that makes a user produces a complete row, so nothing
    // downstream has to ask whether this one is real yet.
    for (let i = 0; i < 50; i += 1) {
      const name = generateUsername()
      expect(isGeneratedUsername(name), name).toBe(true)
      // And the generated form has to satisfy everything except the reservation it trips.
      expect(checkUsername(name)).toBe('reserved')
    }
  })

  it('spreads over enough names that a collision is a retry, not a design', () => {
    const many = new Set(Array.from({ length: 500 }, () => generateUsername()))
    expect(many.size).toBeGreaterThan(495)
  })

  it('will not let anybody choose a name the generator could produce', () => {
    // Without this, somebody registers the name a future account is about to be handed, or
    // lies in wait for a specific one.
    expect(checkUsername('swift-otter-4821')).toBe('reserved')
    // The pattern is exact, so a name that merely resembles it is fine.
    expect(checkUsername('swift-otter-482')).toBeNull()
    expect(checkUsername('swift-badger')).toBeNull()
  })

  it('folds width and case, because two of those are one account', () => {
    expect(normalizeUsername('ＮＩＣＫ')).toBe('nick')
    expect(normalizeUsername('Nick')).toBe(normalizeUsername('nick'))
  })

  it('accepts a name in the reader’s own script', () => {
    // Fifty-one languages ship. A Greek player wanting to be Ελληνικά is not an edge case.
    for (const good of ['nick', 'trout_fan', 'a-b-c', 'Ελληνικά', 'Русский', 'ניקי', '日本語']) {
      expect(checkUsername(good), good).toBeNull()
    }
  })

  it('refuses a name that mixes confusable scripts', () => {
    // `pаypal` with a Cyrillic а is the entire reason this check exists.
    expect(checkUsername('pаypal')).toBe('mixed-scripts')
    expect(checkUsername('nickο')).toBe('mixed-scripts')
  })

  it('refuses the lengths and the shapes', () => {
    expect(checkUsername('ab')).toBe('too-short')
    expect(checkUsername('a'.repeat(21))).toBe('too-long')
    expect(checkUsername('-nick')).toBe('bad-edges')
    expect(checkUsername('nick-')).toBe('bad-edges')
    expect(checkUsername('nick!')).toBe('bad-characters')
    expect(checkUsername('ni ck')).toBe('bad-characters')
  })

  it('counts length in characters rather than in code units', () => {
    // Four astral characters are eight UTF-16 units, and refusing them as `too-long` while
    // accepting eight Latin letters would be a rule about our storage, not about names.
    expect(checkUsername('𝕹𝖎𝖈𝖐')).not.toBe('too-long')
  })
})
