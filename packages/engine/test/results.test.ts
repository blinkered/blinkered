import { describe, expect, it } from 'vitest'
import {
  DIFFICULTIES,
  compareResults,
  configFor,
  isCanonical,
  rankOf,
  rankedResults,
} from '../src/index.js'
import type { Difficulty, GameConfig, GameResult } from '../src/index.js'

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

  it('breaks a tie in favor of fewer rounds', () => {
    // The same score off less board is the better game.
    expect(compareResults(result({ rounds: 8 }), result({ rounds: 12 }))).toBeLessThan(0)
  })

  it('breaks a tie on both in favor of whoever got there first', () => {
    expect(compareResults(result({ at: 10 }), result({ at: 20 }))).toBeLessThan(0)
    expect(compareResults(result(), result())).toBe(0)
  })
})

describe('rankedResults', () => {
  const group = { language: 'en', difficulty: 'medium', engineVersion: '0.1.0' } as const

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

  it('will not rank a game against a different engine version of the same difficulty', () => {
    // The presets are still bids, so a retune makes `medium` a different game. A table mixing the
    // two would compare a score set with six seconds of exposed board against one set with two.
    const before = result({ score: 300, engineVersion: '0.1.0' })
    const after = result({ score: 100, engineVersion: '0.2.0' })
    expect(rankedResults([before, after], group).map((r) => r.score)).toEqual([300])
    expect(
      rankedResults([before, after], { ...group, engineVersion: '0.2.0' }).map((r) => r.score),
    ).toEqual([100])
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
    const ranked = rankedResults([worst, best], {
      language: 'en',
      difficulty: 'medium',
      engineVersion: '0.1.0',
    })
    expect(rankOf(ranked, best)).toBe(1)
    expect(rankOf(ranked, worst)).toBe(2)
  })

  it('is zero for a game that is not in the ranking', () => {
    // Which is what happens to a custom-rules game, and is why the caller has to check.
    const custom = result({ canonical: false })
    const ranked = rankedResults([custom], {
      language: 'en',
      difficulty: 'medium',
      engineVersion: '0.1.0',
    })
    expect(rankOf(ranked, custom)).toBe(0)
  })
})

describe('isCanonical', () => {
  const NAMES = Object.keys(DIFFICULTIES) as Difficulty[]

  it('accepts every preset, in every language it ships', () => {
    for (const difficulty of NAMES) {
      for (const language of ['en', 'hr', 'ru', 'el']) {
        expect(isCanonical(configFor(difficulty, { language }), difficulty), difficulty).toBe(true)
      }
    }
  })

  it('refuses a ruleset with any rule edited away from its preset', () => {
    const preset = configFor('medium')
    expect(isCanonical({ ...preset, minWordLength: 5 }, 'medium')).toBe(false)
    expect(isCanonical({ ...preset, n: 9 }, 'medium')).toBe(false)
    expect(isCanonical({ ...preset, flipEconomy: 'perLetter' }, 'medium')).toBe(false)
    expect(isCanonical({ ...preset, wildChance: 0.5 }, 'medium')).toBe(false)
  })

  it('asks what the rules are, not how they were reached', () => {
    // Hand-tuned in nerd mode to exactly the preset's numbers. That is a preset game.
    const tuned = configFor('hard', { minWordLength: DIFFICULTIES.hard.minWordLength })
    expect(isCanonical(tuned, 'hard')).toBe(true)
  })

  it('judges against the difficulty claimed, so hard rules filed as medium are not canonical', () => {
    // The reason it does not compare against all four presets. A game whose rules happen to
    // equal hard's is not a canonical *medium* game, and medium is what it would be filed under.
    const asHard = configFor('hard')
    expect(isCanonical(asHard, 'hard')).toBe(true)
    expect(isCanonical(asHard, 'medium')).toBe(false)
  })

  it('does not count a language as a custom rule', () => {
    // Language changes `wMin`, since a Greek board admits fewer words than an Italian one, so a
    // comparison that pinned the language on one side only would call every non-English game
    // custom.
    for (const language of ['fr', 'hr', 'ru', 'el', 'fi']) {
      expect(isCanonical(configFor('insane', { language }), 'insane'), language).toBe(true)
    }
  })

  it('refuses a config that is missing a rule rather than reading it as equal', () => {
    // A server rebuilds a config from columns, and a column nobody wrote is `undefined`.
    const missing: Record<string, unknown> = { ...configFor('easy') }
    delete missing.wMin
    expect(isCanonical(missing as unknown as GameConfig, 'easy')).toBe(false)
  })
})
