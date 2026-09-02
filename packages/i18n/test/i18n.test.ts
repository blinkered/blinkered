import { describe, expect, it } from 'vitest'
import { ALPHABET_IDS } from '@blinkered/engine'
import {
  DEFAULT_LOCALE,
  LOCALES,
  localeFor,
  messagesFor,
  preferredLocale,
  shareText,
} from '../src/index.js'
import { format, plural } from '../src/messages.js'
import { en } from '../src/locales/en.js'

describe('format', () => {
  it('fills named placeholders', () => {
    expect(format('{word} pays {points}', { word: 'SENATOR', points: 21 })).toBe('SENATOR pays 21')
  })

  it('leaves an unknown placeholder written out, so a mistake looks like one', () => {
    // Replacing it with "undefined" would ship a translation bug looking like a game bug.
    expect(format('{word} pays {ponits}', { word: 'ANT' })).toBe('ANT pays {ponits}')
  })

  it('needs no values at all', () => {
    expect(format('shuffled')).toBe('shuffled')
  })
})

describe('plural', () => {
  it('picks the English form', () => {
    expect(plural('en', en.plurals.words, 1)).toBe('1 word')
    expect(plural('en', en.plurals.words, 3)).toBe('3 words')
  })

  it('picks all four Russian forms, which is why this is not hand-written', () => {
    const forms = messagesFor('ru').plurals.words
    expect(plural('ru', forms, 1)).toBe('1 слово')
    expect(plural('ru', forms, 3)).toBe('3 слова')
    expect(plural('ru', forms, 7)).toBe('7 слов')
    expect(plural('ru', forms, 21)).toBe('21 слово')
  })

  it('picks all three Croatian forms', () => {
    const forms = messagesFor('hr').plurals.rounds
    expect(plural('hr', forms, 1)).toBe('1 runda')
    expect(plural('hr', forms, 3)).toBe('3 runde')
    expect(plural('hr', forms, 8)).toBe('8 rundi')
  })

  it('uses one form for a language that has one', () => {
    const forms = messagesFor('ms').plurals.words
    expect(plural('ms', forms, 1)).toBe('1 kata')
    expect(plural('ms', forms, 9)).toBe('9 kata')
  })

  it('falls back to `other` when a locale omits the form a count selects', () => {
    expect(plural('en', { other: '{n} things' }, 1)).toBe('1 things')
  })
})

describe('the locale registry', () => {
  it('finds a locale by tag, and says so when there is none', () => {
    expect(localeFor('fi')?.endonym).toBe('Suomi')
    expect(localeFor('kl')).toBeUndefined()
  })

  it('falls back to English rather than failing', () => {
    // The interface language can arrive from a stale setting or a browser preference. An
    // untranslated interface beats a blank screen.
    expect(messagesFor('kl')).toBe(en)
    expect(messagesFor(DEFAULT_LOCALE)).toBe(en)
  })
})

describe('preferredLocale', () => {
  it('prefers an exact tag over the base language', () => {
    expect(preferredLocale(['pt-BR'])).toBe('pt-BR')
    expect(preferredLocale(['pt'])).toBe('pt')
  })

  it('matches a regional tag we have no entry for to its language', () => {
    expect(preferredLocale(['pt-PT'])).toBe('pt')
    expect(preferredLocale(['en-US'])).toBe('en')
    expect(preferredLocale(['DE-ch'])).toBe('de')
  })

  it('takes the first preference it can serve', () => {
    expect(preferredLocale(['kl', 'ja', 'sv', 'fr'])).toBe('sv')
  })

  it('falls back to the default when it can serve none', () => {
    expect(preferredLocale(['kl', 'ja'])).toBe(DEFAULT_LOCALE)
    expect(preferredLocale([])).toBe(DEFAULT_LOCALE)
  })
})

describe('every locale', () => {
  // The Messages type already forces every key to be present, so what is left to check is
  // what a type cannot: that no value is blank, that nothing was left in English by accident,
  // and that the placeholders survived translation. A missing `{word}` compiles fine and
  // silently drops the word from the message.
  const placeholdersOf = (template: string): string[] =>
    [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] as string).sort()

  const templateKeys = (Object.keys(en) as (keyof typeof en)[]).filter(
    (key) => typeof en[key] === 'string' && placeholdersOf(en[key]).length > 0,
  )

  it('has twenty-one of them, and the engine has an alphabet for each', () => {
    expect(LOCALES).toHaveLength(21)
    for (const locale of LOCALES) expect(ALPHABET_IDS).toContain(locale.tag)
  })

  it('agrees with itself about its own tag', () => {
    for (const locale of LOCALES) expect(locale.messages.tag).toBe(locale.tag)
  })

  it('has a flag and an endonym', () => {
    for (const locale of LOCALES) {
      expect(locale.flag).not.toBe('')
      expect(locale.endonym).not.toBe('')
    }
  })

  it('keeps every placeholder the English original has', () => {
    for (const { tag, messages } of LOCALES) {
      for (const key of templateKeys) {
        expect(placeholdersOf(messages[key] as string), `${tag}.${key}`).toEqual(
          placeholdersOf(en[key] as string),
        )
      }
    }
  })

  it('keeps {n} in every plural form', () => {
    for (const { tag, messages } of LOCALES) {
      for (const [name, forms] of Object.entries(messages.plurals)) {
        for (const [rule, template] of Object.entries(forms as Record<string, string>)) {
          expect(template, `${tag}.plurals.${name}.${rule}`).toContain('{n}')
        }
      }
    }
  })

  it('has no blank string anywhere', () => {
    const blanks: string[] = []
    const walk = (value: unknown, path: string): void => {
      if (typeof value === 'string') {
        if (value.trim() === '') blanks.push(path)
        return
      }
      if (typeof value !== 'object' || value === null) return
      for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`)
    }
    for (const locale of LOCALES) walk(locale.messages, locale.tag)
    expect(blanks).toEqual([])
  })

  it('is actually translated, not a copy of English with the tag changed', () => {
    // Some overlap is legitimate: "fibonacci" is a name, and "ord" is Swedish for "words".
    // A locale that matches English on most of its keys has not been translated at all.
    const keys = (Object.keys(en) as (keyof typeof en)[]).filter(
      (key) => typeof en[key] === 'string',
    )
    for (const { tag, messages } of LOCALES) {
      if (tag === 'en') continue
      const same = keys.filter((key) => messages[key] === en[key]).length
      expect(
        same / keys.length,
        `${tag} matches English on ${String(same)} of ${String(keys.length)} keys`,
      ).toBeLessThan(0.3)
    }
  })
})

describe('shareText', () => {
  const result = {
    score: 96,
    words: 14,
    rounds: 12,
    language: 'en',
    difficulty: 'medium',
    canonical: true,
    at: 1_700_000_000_000,
    seed: 42,
    engineVersion: '1',
  } as const

  const url = 'https://playblinkered.com'

  it('is three lines when there is nothing to boast about', () => {
    expect(shareText(en, result, { personalBest: false, url })).toBe(
      ['Blinkered, medium', '96 points from 14 words over 12 rounds', url].join('\n'),
    )
  })

  it('adds the boast when there is one, and no more than one line of it', () => {
    const text = shareText(en, result, { personalBest: true, url })
    expect(text.split('\n')).toEqual([
      'Blinkered, medium',
      '96 points from 14 words over 12 rounds',
      'A new personal best.',
      url,
    ])
  })

  it('names custom rules rather than a difficulty that did not apply', () => {
    // A game played on edited rules has a `difficulty` field, and repeating it would be a lie.
    const text = shareText(en, { ...result, canonical: false }, { personalBest: false, url })
    // The same words the setup screen's chip uses for an edited ruleset.
    expect(text.startsWith(`Blinkered, ${en.nerdMode}`)).toBe(true)
    expect(text).not.toContain('medium')
  })

  it('is written in the language the game was read in, plurals included', () => {
    const one = shareText(
      messagesFor('ru'),
      { ...result, words: 1, rounds: 1 },
      { personalBest: false, url },
    )
    // Russian picks a different form for 1 than for 14, which is the whole reason this goes
    // through Intl.PluralRules rather than through string concatenation.
    expect(one).toContain('1 слово')
    const many = shareText(messagesFor('ru'), result, { personalBest: false, url })
    expect(many).toContain('14 слов')
  })

  it('ends with the link, whatever else it says', () => {
    for (const best of [true, false]) {
      for (const canonical of [true, false]) {
        const text = shareText(
          messagesFor('el'),
          { ...result, canonical },
          { personalBest: best, url },
        )
        expect(text.endsWith(url)).toBe(true)
      }
    }
  })

  it('carries no dash as a separator, in any of them', () => {
    // House style, and it survives a paste into anything.
    for (const locale of LOCALES) {
      const text = shareText(locale.messages, result, { personalBest: true, url })
      expect(text, locale.tag).not.toMatch(/[—–]/)
    }
  })
})
