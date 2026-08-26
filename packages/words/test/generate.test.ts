import { describe, expect, it } from 'vitest'
import { configFor, letterFaults } from '@blinkered/engine'
import type { Alphabet } from '@blinkered/engine'
import { buildIndex, generateBoard } from '../src/index.js'
import { MINI, MINI_WORDS } from './fixtures.js'

const index = buildIndex(MINI_WORDS, MINI)

/** Seven tiles of the miniature language, with bars a small language can actually clear. */
const config = (overrides = {}) =>
  configFor('medium', { n: 7, minWordLength: 3, wMin: 3, ceilingMin: 5, ...overrides })

describe('generateBoard', () => {
  it('accepts a board that clears every bar', () => {
    const settings = config()
    const board = generateBoard(settings, 4242, index, MINI)
    expect(board.accepted).toBe(true)
    expect(board.letters).toHaveLength(settings.n)
    expect(board.wordCount).toBeGreaterThanOrEqual(settings.wMin)
    expect(board.longest).toBeGreaterThanOrEqual(settings.ceilingMin)
    expect(letterFaults(board.letters, MINI)).toEqual([])
  })

  it('is deterministic for a seed, and varies with it', () => {
    expect(generateBoard(config(), 7, index, MINI).letters).toEqual(
      generateBoard(config(), 7, index, MINI).letters,
    )
    expect(generateBoard(config(), 7, index, MINI).letters).not.toEqual(
      generateBoard(config(), 8, index, MINI).letters,
    )
  })

  it('advances the rng past every rejected draw', () => {
    const board = generateBoard(config(), 11, index, MINI)
    expect(board.attempts).toBeGreaterThanOrEqual(1)
    expect(board.rng.seed).not.toBe(11)
  })

  it('never hands back a board with a dead letter', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const board = generateBoard(config(), seed, index, MINI)
      expect(letterFaults(board.letters, MINI)).toEqual([])
    }
  })

  it('refuses a board that cannot pay, however many words it holds', () => {
    // The lesson of EPSTOWWE, which admitted eighty words and nothing longer than five: a
    // word count alone is the wrong bar. Measured against this language at eight tiles, a
    // six-letter ceiling occurs in roughly one sound draw in six, so demanding one rejects
    // most boards that would otherwise pass on word count alone.
    const lax = config({ n: 8, ceilingMin: 3 })
    const strict = config({ n: 8, ceilingMin: 6 })
    let laxDraws = 0
    let strictDraws = 0
    for (let seed = 1; seed <= 25; seed++) {
      laxDraws += generateBoard(lax, seed, index, MINI).attempts
      const board = generateBoard(strict, seed, index, MINI)
      strictDraws += board.attempts
      expect(board.accepted).toBe(true)
      expect(board.longest).toBeGreaterThanOrEqual(6)
    }
    // Both always find a board; the strict one has to look considerably harder for it.
    expect(strictDraws).toBeGreaterThan(laxDraws)
  })

  it('never claims to accept a ceiling the language cannot reach', () => {
    // Nothing in MINI_WORDS is eight letters long, so no board can ever clear this.
    const unreachable = config({ n: 8, ceilingMin: 8 })
    for (let seed = 1; seed <= 5; seed++) {
      const board = generateBoard(unreachable, seed, index, MINI, 50)
      expect(board.accepted).toBe(false)
      expect(board.attempts).toBe(50)
      expect(board.longest).toBeLessThan(8)
    }
  })

  it('ranks the fallback on the ceiling, not on the word count', () => {
    // Nothing can clear this word floor, so every draw is a fallback candidate. The one it
    // settles on still holds the longest word it saw, because the ceiling is ranked first.
    const impossible = config({ wMin: 1_000_000 })
    const board = generateBoard(impossible, 99, index, MINI, 60)
    expect(board.accepted).toBe(false)
    expect(board.longest).toBeGreaterThanOrEqual(6)
  })

  it('reports an empty board when every draw is faulty', () => {
    const hopeless: Alphabet = {
      ...MINI,
      id: 'test-hopeless',
      weights: { A: 1, R: 1 },
      vowels: ['A'],
      rareLetters: ['A', 'R'],
    }
    const board = generateBoard(config({ n: 4 }), 1, index, hopeless, 20)
    expect(board).toMatchObject({ letters: [], accepted: false, wordCount: 0, longest: 0 })
  })
})
