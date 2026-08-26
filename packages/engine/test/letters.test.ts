import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { drawLetters, ENGLISH, seedRng } from '../src/index.js'

const vowelCount = (letters: readonly string[]): number =>
  letters.filter((letter) => ENGLISH.vowels.includes(letter)).length

describe('drawLetters', () => {
  it('draws exactly n letters', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 2, max: 16 }), (seed, n) => {
        expect(drawLetters(seedRng(seed), n)[0]).toHaveLength(n)
      }),
    )
  })

  it('always leaves room for both a vowel and a consonant', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 2, max: 16 }), (seed, n) => {
        const [letters] = drawLetters(seedRng(seed), n)
        const vowels = vowelCount(letters)
        expect(vowels).toBeGreaterThanOrEqual(1)
        expect(vowels).toBeLessThanOrEqual(n - 1)
      }),
    )
  })

  it('draws only A-Z', () => {
    const [letters] = drawLetters(seedRng(3), 12)
    expect(letters.join('')).toMatch(/^[A-Z]+$/)
  })

  it('is deterministic for a seed', () => {
    expect(drawLetters(seedRng(77), 8)).toEqual(drawLetters(seedRng(77), 8))
  })

  it('advances the rng so a redraw differs', () => {
    const [first, next] = drawLetters(seedRng(77), 8)
    const [second] = drawLetters(next, 8)
    expect(second).not.toEqual(first)
  })

  it('refuses a board too small to hold a word', () => {
    expect(() => drawLetters(seedRng(1), 1)).toThrow(RangeError)
  })
})
