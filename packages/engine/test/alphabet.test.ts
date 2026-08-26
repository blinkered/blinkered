import { describe, expect, it } from 'vitest'
import {
  ALPHABET_IDS,
  DEFAULT_LANGUAGE,
  ENGLISH,
  alphabetFor,
  configFor,
  segmentBy,
  stripDiacritics,
} from '../src/index.js'

describe('alphabets', () => {
  it('defaults to English', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
    expect(alphabetFor('en')).toBe(ENGLISH)
    expect(ALPHABET_IDS).toEqual(['en'])
  })

  it('records the language in every ruleset, so an old game stays interpretable', () => {
    expect(configFor('medium').language).toBe('en')
  })

  it('refuses a language it cannot deal a board in', () => {
    expect(() => alphabetFor('fr')).toThrow(RangeError)
  })

  it('describes English coherently', () => {
    const letters = Object.keys(ENGLISH.weights)
    expect(letters).toHaveLength(26)
    expect(Object.values(ENGLISH.weights).every((weight) => weight > 0)).toBe(true)
    for (const vowel of ENGLISH.vowels) expect(letters).toContain(vowel)
    for (const rare of ENGLISH.rareLetters) expect(letters).toContain(rare)
    for (const [letter, needs] of Object.entries(ENGLISH.requires)) {
      expect(letters).toContain(letter)
      for (const companion of needs) expect(letters).toContain(companion)
    }
  })

  it('folds typed keys onto tile letters', () => {
    expect(ENGLISH.fold('q')).toBe('Q')
    expect(ENGLISH.fold('Q')).toBe('Q')
  })
})

describe('stripDiacritics', () => {
  it('leaves the base letter behind', () => {
    // The French case that motivates it: an accented E is an E wearing an accent.
    expect(stripDiacritics('épée')).toBe('epee')
    expect(stripDiacritics('père')).toBe('pere')
    expect(stripDiacritics('côté')).toBe('cote')
  })

  it('leaves unaccented text alone', () => {
    expect(stripDiacritics('EPEE')).toBe('EPEE')
  })

  it('does not touch letters that are not a base plus a mark', () => {
    // Polish L-with-stroke and German eszett are single code points, not decomposable, which
    // is a hint that they are letters in their own right rather than accented forms.
    expect(stripDiacritics('ładna')).toBe('ładna')
    expect(stripDiacritics('straße')).toBe('straße')
  })
})

describe('segmentBy', () => {
  const segment = segmentBy(['IJ', 'A', 'I', 'J', 'N', 'S', 'Ł'])

  it('prefers the longest letter at each position', () => {
    expect(segment('IJS')).toEqual(['IJ', 'S'])
    expect(segment('IS')).toEqual(['I', 'S'])
  })

  it('does not let a digraph swallow the wrong letters', () => {
    expect(segment('JIJ')).toEqual(['J', 'IJ'])
    expect(segment('AIJA')).toEqual(['A', 'IJ', 'A'])
  })

  it('keeps a multi-byte letter whole', () => {
    expect(segment('ŁA')).toEqual(['Ł', 'A'])
  })

  it('passes through anything the alphabet does not know, one code point at a time', () => {
    // Survives so the word list can drop it, rather than being silently mangled here.
    expect(segment("A'B")).toEqual(['A', "'", 'B'])
  })
})
