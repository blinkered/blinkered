import { describe, expect, it } from 'vitest'
import { compareResults, rankOf, rankedResults } from '../src/index.js'
import type { GameResult } from '../src/index.js'

const result = (over: Partial<GameResult> = {}): GameResult => ({
  score: 100,
  words: 10,
  rounds: 12,
  language: 'en',
  difficulty: 'medium',
  canonical: true,
  at: 1000,
  seed: 7,
  engineVersion: '0.1.0',
  ...over,
})

describe('compareResults', () => {
  it('puts the higher score first', () => {
    expect(compareResults(result({ score: 200 }), result({ score: 100 }))).toBeLessThan(0)
    expect(compareResults(result({ score: 100 }), result({ score: 200 }))).toBeGreaterThan(0)
  })

  it('breaks a tie in favour of fewer rounds', () => {
    // The same score off less board is the better game.
    expect(compareResults(result({ rounds: 8 }), result({ rounds: 12 }))).toBeLessThan(0)
  })

  it('breaks a tie on both in favour of whoever got there first', () => {
    expect(compareResults(result({ at: 10 }), result({ at: 20 }))).toBeLessThan(0)
    expect(compareResults(result(), result())).toBe(0)
  })
})

describe('rankedResults', () => {
  const group = { language: 'en', difficulty: 'medium' } as const

  it('compares only like with like', () => {
    // A score means nothing across languages or difficulties.
    const results = [
      result({ score: 500, language: 'ru' }),
      result({ score: 400, difficulty: 'insane' }),
      result({ score: 100 }),
    ]
    expect(rankedResults(results, group).map((r) => r.score)).toEqual([100])
  })

  it('leaves out a game played under changed rules', () => {
    const results = [result({ score: 900, canonical: false }), result({ score: 100 })]
    expect(rankedResults(results, group).map((r) => r.score)).toEqual([100])
  })

  it('orders best first', () => {
    const results = [result({ score: 10 }), result({ score: 30 }), result({ score: 20 })]
    expect(rankedResults(results, group).map((r) => r.score)).toEqual([30, 20, 10])
  })

  it('does not disturb what it was given', () => {
    const results = [result({ score: 10 }), result({ score: 30 })]
    rankedResults(results, group)
    expect(results.map((r) => r.score)).toEqual([10, 30])
  })
})

describe('rankOf', () => {
  it('counts from one', () => {
    const best = result({ score: 300 })
    const worst = result({ score: 100 })
    const ranked = rankedResults([worst, best], { language: 'en', difficulty: 'medium' })
    expect(rankOf(ranked, best)).toBe(1)
    expect(rankOf(ranked, worst)).toBe(2)
  })

  it('is zero for a game that is not in the ranking', () => {
    // Which is what happens to a custom-rules game, and is why the caller has to check.
    const custom = result({ canonical: false })
    const ranked = rankedResults([custom], { language: 'en', difficulty: 'medium' })
    expect(rankOf(ranked, custom)).toBe(0)
  })
})
