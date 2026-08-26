import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { configFor, flipReward, wordScore } from '../src/index.js'
import type { FlipEconomy } from '../src/index.js'

describe('wordScore', () => {
  it('matches the table in the brief', () => {
    expect([2, 3, 4, 5, 6, 7, 8, 9].map(wordScore)).toEqual([1, 2, 3, 5, 8, 13, 21, 34])
  })

  it('scores nothing below two letters', () => {
    expect(wordScore(0)).toBe(0)
    expect(wordScore(1)).toBe(0)
  })

  it('obeys the Fibonacci recurrence at every length', () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 25 }), (length) => {
        expect(wordScore(length)).toBe(wordScore(length - 1) + wordScore(length - 2))
      }),
    )
  })
})

describe('flipReward', () => {
  // The table in docs/PLAN.md 1.10, asserted so the doc cannot drift from the code.
  const expected: Record<FlipEconomy, readonly number[]> = {
    none: [0, 0, 0, 0, 0, 0],
    perLetter: [3, 4, 5, 6, 7, 8],
    fibonacci: [2, 3, 5, 8, 13, 21],
    overMinimum: [1, 2, 3, 4, 5, 6],
  }
  const lengths = [3, 4, 5, 6, 7, 8]

  for (const [economy, rewards] of Object.entries(expected)) {
    it(`pays ${economy} as documented`, () => {
      const config = configFor('easy', {
        flipEconomy: economy as FlipEconomy,
        minWordLength: 3,
      })
      expect(lengths.map((length) => flipReward(length, config))).toEqual(rewards)
    })
  }

  it('never pays a negative reward under overMinimum', () => {
    const config = configFor('easy', { flipEconomy: 'overMinimum', minWordLength: 5 })
    expect(flipReward(2, config)).toBe(0)
  })

  it('tracks the minimum word length under overMinimum', () => {
    const strict = configFor('easy', { flipEconomy: 'overMinimum', minWordLength: 4 })
    expect(flipReward(6, strict)).toBe(3)
  })
})
