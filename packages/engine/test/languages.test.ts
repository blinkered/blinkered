import { describe, expect, it } from 'vitest'
import { ALPHABET_IDS, DEFAULT_LANGUAGE, alphabetFor, configFor } from '../src/index.js'

/** One probe per language: a word that exercises that alphabet's diacritic policy. */
const PROBES: Readonly<Record<string, readonly [string, string, number]>> = {
  en: ['naive', 'NAIVE', 5],
  fr: ['épée', 'EPEE', 4],
  es: ['añejo', 'AÑEJO', 5],
  it: ['perché', 'PERCHE', 6],
  de: ['straße', 'STRASSE', 7],
  nl: ['coëfficiënt', 'COEFFICIENT', 11],
  pt: ['ação', 'AÇAO', 4],
  // Same alphabet as pt, different word list. A spelling the two variants disagree on.
  'pt-BR': ['ônibus', 'ONIBUS', 6],
  hr: ['džemper', 'DŽEMPER', 6],
  ms: ['makan', 'MAKAN', 5],
  id: ['makan', 'MAKAN', 5],
  ru: ['ёлка', 'ЕЛКА', 4],
  sv: ['förälder', 'FÖRÄLDER', 8],
  no: ['blåbær', 'BLÅBÆR', 6],
  fi: ['hyvää', 'HYVÄÄ', 5],
  el: ['καλημέρα', 'ΚΑΛΗΜΕΡΑ', 8],
}

describe('the language registry', () => {
  it('covers every language asked for', () => {
    expect([...ALPHABET_IDS].sort()).toEqual([
      'de',
      'el',
      'en',
      'es',
      'fi',
      'fr',
      'hr',
      'id',
      'it',
      'ms',
      'nl',
      'no',
      'pt',
      'pt-BR',
      'ru',
      'sv',
    ])
  })

  it('defaults to English', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
    expect(configFor('medium').language).toBe('en')
  })

  it('refuses a language it has no alphabet for', () => {
    expect(() => alphabetFor('xx')).toThrow(RangeError)
  })

  it('has a probe for every language, so none goes unexercised', () => {
    expect(Object.keys(PROBES).sort()).toEqual([...ALPHABET_IDS].sort())
  })
})

describe.each(ALPHABET_IDS)('%s', (id) => {
  const alphabet = alphabetFor(id)
  const [raw, folded, tiles] = PROBES[id] as readonly [string, string, number]

  it('is internally coherent', () => {
    const letters = Object.keys(alphabet.weights)
    expect(letters.length).toBeGreaterThan(15)
    expect(alphabet.endonym).not.toBe('')
    expect(Object.values(alphabet.weights).every((weight) => weight > 0)).toBe(true)
    for (const vowel of alphabet.vowels) expect(letters).toContain(vowel)
    for (const rare of alphabet.rareLetters) expect(letters).toContain(rare)
    for (const [letter, needs] of Object.entries(alphabet.requires)) {
      expect(letters).toContain(letter)
      for (const companion of needs) expect(letters).toContain(companion)
    }
    // A board needs both kinds of tile to be playable at all.
    expect(alphabet.vowels.length).toBeGreaterThan(0)
    expect(letters.length - alphabet.vowels.length).toBeGreaterThan(0)
  })

  it('folds its own diacritic policy correctly', () => {
    expect(alphabet.fold(raw)).toBe(folded)
    // Folding is idempotent, which matters because it runs on both keys and word lists.
    expect(alphabet.fold(alphabet.fold(raw))).toBe(folded)
  })

  it('segments a folded word into playable tiles', () => {
    const segments = alphabet.segment(alphabet.fold(raw))
    expect(segments).toHaveLength(tiles)
    const playable = new Set(Object.keys(alphabet.weights))
    for (const tile of segments) expect(playable.has(tile)).toBe(true)
  })
})
