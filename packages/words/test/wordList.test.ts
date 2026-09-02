import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { ENGLISH, stripDiacritics, segmentBy } from '@blinkered/engine'
import type { Alphabet } from '@blinkered/engine'
import { normalizeWordList } from '../src/index.js'
import { readWordList } from '../src/node.js'

describe('normalizeWordList', () => {
  it('folds words onto tiles and sorts them', () => {
    expect(normalizeWordList(['ate', 'EAT', 'tea'], ENGLISH)).toEqual(['ATE', 'EAT', 'TEA'])
  })

  it('drops duplicates that folding created', () => {
    expect(normalizeWordList(['ate', 'ATE', 'Ate'], ENGLISH)).toEqual(['ATE'])
  })

  it('drops blank lines and stray whitespace', () => {
    expect(normalizeWordList(['', '  ', ' ate '], ENGLISH)).toEqual(['ATE'])
  })

  it('honors the length window', () => {
    const words = ['at', 'ate', 'atone', 'antidisestablishmentarianism']
    expect(normalizeWordList(words, ENGLISH, { minLength: 3, maxLength: 5 })).toEqual([
      'ATE',
      'ATONE',
    ])
  })

  it('drops anything carrying a letter the alphabet does not have', () => {
    // Apostrophes, hyphens and accents are not tiles in English.
    expect(normalizeWordList(["can't", 'well-fed', 'café', 'cafe'], ENGLISH)).toEqual(['CAFE'])
  })

  it('keeps accented words when the alphabet folds accents away', () => {
    // The French case: an accented E is an E wearing an accent, not a letter of its own, so
    // epee and pere are both playable on plain E tiles.
    const frenchish: Alphabet = {
      ...ENGLISH,
      id: 'test-fr',
      fold: (key) => stripDiacritics(key).toUpperCase(),
    }
    expect(normalizeWordList(['épée', 'père', 'côte'], frenchish)).toEqual(['COTE', 'EPEE', 'PERE'])
  })

  it('keeps accented letters that are letters in their own right', () => {
    // The Polish case: the accented forms get their own tiles, so nothing is folded away.
    const polishish: Alphabet = {
      id: 'test-pl',
      endonym: 'Polishish',
      direction: 'ltr',
      weights: { L: 4, Ł: 2, A: 5, D: 3, N: 3, O: 4, Ń: 1 },
      vowels: ['A', 'O'],
      rareLetters: ['Ń'],
      requires: {},
      fold: (key) => key.toUpperCase(),
      segment: segmentBy(['L', 'Ł', 'A', 'D', 'N', 'O', 'Ń']),
    }
    expect(normalizeWordList(['ładna', 'ladna'], polishish)).toEqual(['LADNA', 'ŁADNA'])
  })
})

describe('readWordList', () => {
  const directory = mkdtempSync(join(tmpdir(), 'blinkered-words-'))
  afterAll(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it('reads a newline-delimited list off disk', () => {
    const path = join(directory, 'words.txt')
    writeFileSync(path, 'ate\nEAT\n\ntea\ncan not\n')
    expect(readWordList(path, ENGLISH, { minLength: 3 })).toEqual(['ATE', 'EAT', 'TEA'])
  })
})
