import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BOARD_SIZE,
  DIFFICULTIES,
  PROFITABLE_LENGTH,
  configFor,
  createGame,
  defaultWMin,
  drawLetters,
  seedRng,
} from '../src/index.js'
import type { Difficulty } from '../src/index.js'

const levels = Object.keys(DIFFICULTIES) as Difficulty[]
const sizes = [6, 7, 8, 9, 10, 11, 12]

describe('difficulty profiles', () => {
  it('covers every level', () => {
    expect(levels).toEqual(['easy', 'medium', 'hard', 'insane'])
  })

  it('escalates the clock and shrinks the hold as levels rise', () => {
    const speeds = levels.map((level) => DIFFICULTIES[level].speedMultiplier)
    const holds = levels.map((level) => DIFFICULTIES[level].holdTicks)
    const rounds = levels.map((level) => DIFFICULTIES[level].initialRounds)
    expect(speeds).toEqual([...speeds].sort((a, b) => b - a))
    expect(holds).toEqual([...holds].sort((a, b) => b - a))
    expect(rounds).toEqual([...rounds].sort((a, b) => b - a))
  })

  it('says nothing about board size, because that is not a difficulty axis', () => {
    for (const level of levels) {
      expect(DIFFICULTIES[level]).not.toHaveProperty('n')
    }
  })

  for (const level of levels) {
    it(`${level} resolves to a coherent ruleset at every board size`, () => {
      for (const n of sizes) {
        const config = configFor(level, { n })
        expect(config.n).toBe(n)
        expect(config.minWordLength).toBeGreaterThanOrEqual(2)
        expect(config.minWordLength).toBeLessThanOrEqual(n)
        expect(config.holdTicks).toBeGreaterThanOrEqual(0)
        expect(config.speedMultiplier).toBeGreaterThan(0)
        expect(config.wMin).toBeGreaterThan(0)
        expect(config.ceilingMin).toBe(PROFITABLE_LENGTH)
      }
    })

    it(`${level} opens a game at the default size`, () => {
      const config = configFor(level)
      const [letters] = drawLetters(seedRng(1), config.n)
      const [state] = createGame({ config, letters, seed: 1 })
      expect(config.n).toBe(DEFAULT_BOARD_SIZE)
      expect(state.ticksRemaining).toBe(config.n + config.holdTicks)
      expect(state.flipsRemaining).toBe(config.initialFlips - 1)
      expect(state.status).toBe('playing')
    })

    it(`${level} lasts the same number of rounds whatever the board size`, () => {
      // A round costs one flip per tile, so the flip budget has to scale with the board or
      // the same level would be twice as long on a small board.
      const expected = DIFFICULTIES[level].initialRounds
      for (const n of sizes) {
        const config = configFor(level, { n })
        expect(config.initialFlips).toBe(expected * n)
        expect(config.initialFlips % n).toBe(0)
      }
    })
  }
})

describe('overrides', () => {
  it('derives the flip budget and word floor from an overridden board size', () => {
    const small = configFor('medium', { n: 6 })
    const large = configFor('medium', { n: 12 })
    expect(small.initialFlips).toBe(72)
    expect(large.initialFlips).toBe(144)
    expect(large.wMin).toBeGreaterThan(small.wMin)
  })

  it('derives the word floor from an overridden minimum length', () => {
    const loose = configFor('medium', { minWordLength: 3 })
    const strict = configFor('medium', { minWordLength: 5 })
    expect(strict.wMin).toBeLessThan(loose.wMin)
  })

  it('lets an explicit flip budget or word floor win anyway', () => {
    expect(configFor('medium', { n: 12, initialFlips: 40, wMin: 7 })).toMatchObject({
      n: 12,
      initialFlips: 40,
      wMin: 7,
    })
  })

  it('leaves the rules that do not scale with the board alone', () => {
    for (const n of sizes) {
      expect(configFor('hard', { n })).toMatchObject({
        speedMultiplier: 0.9,
        holdTicks: 1,
        minWordLength: 4,
      })
    }
  })
})

describe('defaultWMin', () => {
  it('grows with the board', () => {
    const floors = sizes.map((n) => defaultWMin(n, 3))
    expect(floors).toEqual([...floors].sort((a, b) => a - b))
    expect(new Set(floors).size).toBe(floors.length)
  })

  it('falls as the minimum word length rises', () => {
    const floors = [2, 3, 4, 5, 6].map((min) => defaultWMin(9, min))
    expect(floors).toEqual([...floors].sort((a, b) => b - a))
  })

  it('stays sane past the measured range in both directions', () => {
    expect(defaultWMin(2, 3)).toBe(defaultWMin(4, 3))
    expect(defaultWMin(40, 3)).toBe(defaultWMin(12, 3))
    expect(defaultWMin(9, 12)).toBeGreaterThan(0)
  })

  it('never asks for fewer than one word', () => {
    expect(defaultWMin(4, 20)).toBe(1)
  })
})
