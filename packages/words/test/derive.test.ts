import { describe, expect, it } from 'vitest'
import { ENGLISH } from '@blinkered/engine'
import type { Alphabet } from '@blinkered/engine'
import { CALIBRATE_DEFAULTS, buildIndex, calibrate, deriveWeights } from '../src/index.js'
import { WORDS } from './fixtures.js'

describe('deriveWeights', () => {
  const derived = deriveWeights(WORDS, ENGLISH, { bagSize: 100 })

  it('weights every letter of the alphabet, however rare', () => {
    // A letter that fell to zero would make its words unreachable, so the floor is one.
    expect(Object.keys(derived.weights).sort()).toEqual(Object.keys(ENGLISH.weights).sort())
    expect(Object.values(derived.weights).every((weight) => weight >= 1)).toBe(true)
  })

  it('ranks letters by how often the word list uses them', () => {
    expect(derived.weights['E']).toBeGreaterThan(derived.weights['B'] as number)
    expect(derived.frequency['E']).toBeGreaterThan(derived.frequency['B'] as number)
  })

  it('reports the vowel share of the bag', () => {
    expect(derived.vowelShare).toBeGreaterThan(0)
    expect(derived.vowelShare).toBeLessThan(1)
  })

  it('suggests the letters too rare to allow twice', () => {
    expect(derived.suggestedRareLetters).toContain('J')
    expect(derived.suggestedRareLetters).not.toContain('E')
    // Vowels are never suggested: a board needs to be able to repeat them.
    for (const vowel of ENGLISH.vowels) expect(derived.suggestedRareLetters).not.toContain(vowel)
  })

  it('respects a stricter rarity threshold', () => {
    const strict = deriveWeights(WORDS, ENGLISH, { bagSize: 100, rareAtOrBelow: 100 })
    expect(strict.suggestedRareLetters.length).toBeGreaterThan(derived.suggestedRareLetters.length)
  })

  it('counts the words it was given', () => {
    expect(derived.wordsCounted).toBe(WORDS.length)
  })

  it('survives an empty word list', () => {
    const empty = deriveWeights([], ENGLISH)
    expect(Object.values(empty.weights).every((weight) => weight === 1)).toBe(true)
    expect(empty.vowelShare).toBeCloseTo(5 / 26)
  })
})

describe('calibrate', () => {
  const index = buildIndex(WORDS, ENGLISH)
  const rows = calibrate(index, ENGLISH, { sizes: [6, 8], minLengths: [3, 4], samples: 40 })

  it('reports a row per size and minimum length', () => {
    expect(rows.map((row) => [row.n, row.minLength])).toEqual([
      [6, 3],
      [6, 4],
      [8, 3],
      [8, 4],
    ])
  })

  it('orders its quantiles', () => {
    for (const row of rows) {
      expect(row.p25).toBeLessThanOrEqual(row.median)
      expect(row.median).toBeLessThanOrEqual(row.p75)
    }
  })

  it('finds fewer words as the minimum length rises', () => {
    const loose = rows.find((row) => row.n === 8 && row.minLength === 3)
    const strict = rows.find((row) => row.n === 8 && row.minLength === 4)
    expect(strict?.median).toBeLessThanOrEqual(loose?.median as number)
  })

  it('reports rates as shares', () => {
    for (const row of rows) {
      expect(row.ceilingRate).toBeGreaterThanOrEqual(0)
      expect(row.ceilingRate).toBeLessThanOrEqual(1)
      expect(row.faultRate).toBeGreaterThanOrEqual(0)
      expect(row.faultRate).toBeLessThan(1)
    }
  })

  it('is deterministic for a seed, and varies with it', () => {
    const options = { sizes: [6], minLengths: [3], samples: 30 }
    expect(calibrate(index, ENGLISH, { ...options, seed: 5 })).toEqual(
      calibrate(index, ENGLISH, { ...options, seed: 5 }),
    )
    expect(calibrate(index, ENGLISH, { ...options, seed: 5 })).not.toEqual(
      calibrate(index, ENGLISH, { ...options, seed: 6 }),
    )
  })

  it('fills in every option it was not given', () => {
    const defaulted = calibrate(index, ENGLISH, { sizes: [6], samples: 10 })
    expect(defaulted).toHaveLength(CALIBRATE_DEFAULTS.minLengths.length)
    expect(defaulted.every((row) => row.n === 6)).toBe(true)
  })

  it('counts boards on both sides of the ceiling', () => {
    // The default ceiling of six is out of reach for this tiny fixture, so aim lower and
    // check the tally is neither always nor never.
    const rows = calibrate(index, ENGLISH, {
      sizes: [8],
      minLengths: [3],
      samples: 120,
      ceiling: 3,
    })
    const rate = rows[0]?.ceilingRate as number
    expect(rate).toBeGreaterThan(0)
    expect(rate).toBeLessThan(1)
  })

  it('gives up on an alphabet that cannot produce a sound board', () => {
    // Every letter is rare, so every draw of three tiles duplicates one.
    const hopeless: Alphabet = {
      ...ENGLISH,
      id: 'test-hopeless',
      weights: { A: 1, J: 1 },
      vowels: ['A'],
      rareLetters: ['A', 'J'],
    }
    expect(() => calibrate(index, hopeless, { sizes: [3], samples: 5 })).toThrow(RangeError)
  })
})
