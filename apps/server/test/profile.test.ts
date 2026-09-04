import { describe, expect, it } from 'vitest'
import { BIO_MAX, checkBio, parsePatch } from '../src/account/profile.js'

describe('the bio', () => {
  it('takes an ordinary sentence', () => {
    expect(checkBio('Plays badly in six languages.')).toBeNull()
  })

  it('counts code points rather than UTF-16 units', () => {
    // A string of astral characters is half as long as `String.length` claims, and a limit that
    // used the wrong one would refuse a bio of seventy emoji as though it were a hundred and forty.
    expect(checkBio('🐟'.repeat(BIO_MAX))).toBeNull()
    expect(checkBio('🐟'.repeat(BIO_MAX + 1))).toBe('too-long')
  })

  it('refuses anything that reads as a link, in all three of its disguises', () => {
    for (const bio of ['see https://example.com', 'www.example.com', 'find me at example.com']) {
      expect(checkBio(bio)).toBe('has-link')
    }
  })

  it('leaves prose with full stops alone, which is the whole reason the dot is tight', () => {
    expect(checkBio('I play. I lose. I play again.')).toBeNull()
  })

  it('refuses control characters and direction overrides', () => {
    // A right-to-left override lets a name render as something other than what is stored, which
    // is the same impersonation problem the username rules exist for.
    expect(checkBio('nick‮nick')).toBe('has-control')
    expect(checkBio('two\nlines')).toBe('has-control')
  })
})

describe('reading a profile patch', () => {
  it('refuses a body that is not an object', () => {
    for (const body of [null, 'nope', 42, ['a']]) {
      const parsed = parsePatch(body)
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) expect(parsed.problem).toEqual({ field: 'body', problem: 'not-an-object' })
    }
  })

  it('leaves out what was not mentioned, which is what makes it a patch', () => {
    const parsed = parsePatch({})
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.patch).toEqual({})
  })

  it('takes a username and trims it', () => {
    const parsed = parsePatch({ username: '  trout  ' })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.patch).toEqual({ username: 'trout' })
  })

  it('reports the username problem the checker found', () => {
    const parsed = parsePatch({ username: 'no' })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.problem).toEqual({ field: 'username', problem: 'too-short' })
  })

  it('will not empty a username, because the column is not nullable', () => {
    // Absent means "leave it"; an empty one is a bad name rather than an instruction to remove it.
    for (const username of ['', '   ', null, 7]) {
      const parsed = parsePatch({ username })
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) expect(parsed.problem.field).toBe('username')
    }
  })

  it('clears a bio for null, an empty string, and a value of the wrong type alike', () => {
    for (const bio of [null, '', '   ', 42]) {
      const parsed = parsePatch({ bio })
      expect(parsed.ok).toBe(true)
      if (parsed.ok) expect(parsed.patch).toEqual({ bio: null })
    }
  })

  it('keeps a bio it accepts, trimmed', () => {
    const parsed = parsePatch({ bio: '  fly fishing  ' })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.patch).toEqual({ bio: 'fly fishing' })
  })

  it('passes the bio problem through', () => {
    const parsed = parsePatch({ bio: 'buy at example.com' })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.problem).toEqual({ field: 'bio', problem: 'has-link' })
  })

  it('stores a country upper case, whatever case it arrived in', () => {
    const parsed = parsePatch({ country: 'us' })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.patch).toEqual({ country: 'US' })
  })

  it('clears a country, and refuses one that is not two letters', () => {
    const cleared = parsePatch({ country: null })
    expect(cleared.ok && cleared.patch).toEqual({ country: null })
    const bad = parsePatch({ country: 'USA' })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.problem).toEqual({ field: 'country', problem: 'not-a-country' })
  })

  it('takes both languages, clears both, and refuses a tag that is not one', () => {
    const set = parsePatch({ uiLanguage: 'el', gameLanguage: 'pt-BR' })
    expect(set.ok && set.patch).toEqual({ uiLanguage: 'el', gameLanguage: 'pt-BR' })

    const cleared = parsePatch({ uiLanguage: null, gameLanguage: '' })
    expect(cleared.ok && cleared.patch).toEqual({ uiLanguage: null, gameLanguage: null })

    for (const field of ['uiLanguage', 'gameLanguage'] as const) {
      const parsed = parsePatch({ [field]: 'not a tag' })
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) expect(parsed.problem).toEqual({ field, problem: 'not-a-language' })
    }
  })

  it('keeps the two languages apart, which the app has always done on purpose', () => {
    // Plenty of people play in a language they do not read menus in; collapsing these into one
    // preferred language would quietly undo a decision settings.ts made deliberately.
    const parsed = parsePatch({ uiLanguage: 'en', gameLanguage: 'fi' })
    expect(parsed.ok && parsed.patch).toEqual({ uiLanguage: 'en', gameLanguage: 'fi' })
  })
})
