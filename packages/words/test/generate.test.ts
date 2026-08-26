import { describe, expect, it } from 'vitest'
import { ENGLISH, configFor, letterFaults } from '@blinkered/engine'
import type { Alphabet } from '@blinkered/engine'
import { buildIndex, generateBoard, readWordList } from '../src/index.js'

/** The placeholder list, which is what the harness plays against today. */
const words = readWordList('/usr/share/dict/words', ENGLISH, { minLength: 2, maxLength: 16 })
const index = buildIndex(words, ENGLISH)

describe('generateBoard', () => {
  it('accepts a board that clears every bar', () => {
    const config = configFor('medium')
    const board = generateBoard(config, 4242, index, ENGLISH)
    expect(board.accepted).toBe(true)
    expect(board.letters).toHaveLength(config.n)
    expect(board.wordCount).toBeGreaterThanOrEqual(config.wMin)
    expect(board.longest).toBeGreaterThanOrEqual(config.ceilingMin)
    expect(letterFaults(board.letters, ENGLISH)).toEqual([])
  })

  it('is deterministic for a seed, and varies with it', () => {
    const config = configFor('medium')
    expect(generateBoard(config, 7, index, ENGLISH).letters).toEqual(
      generateBoard(config, 7, index, ENGLISH).letters,
    )
    expect(generateBoard(config, 7, index, ENGLISH).letters).not.toEqual(
      generateBoard(config, 8, index, ENGLISH).letters,
    )
  })

  it('advances the rng past every rejected draw', () => {
    const board = generateBoard(configFor('medium'), 11, index, ENGLISH)
    expect(board.attempts).toBeGreaterThanOrEqual(1)
    expect(board.rng.seed).not.toBe(11)
  })

  it('never hands back a board with a dead letter', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const board = generateBoard(configFor('medium'), seed, index, ENGLISH)
      expect(letterFaults(board.letters, ENGLISH)).toEqual([])
    }
  })

  it('plays the best board it found when nothing clears the bars', () => {
    // A word floor no board can reach, so acceptance always fails.
    const config = configFor('medium', { wMin: 1_000_000 })
    const board = generateBoard(config, 3, index, ENGLISH, 5)
    expect(board.accepted).toBe(false)
    expect(board.attempts).toBe(5)
    expect(board.letters).toHaveLength(config.n)
    expect(board.wordCount).toBeGreaterThan(0)
  })

  it('would reject the board that prompted all this', () => {
    // EPSTOWWE, dealt during playtesting: 80-odd words and not one of them longer than five,
    // so under the fibonacci economy it cannot be played at a profit however well it is
    // played. Two faults, either of which is enough on its own.
    const config = configFor('medium', { n: 8 })
    const { count, longest } = index.profile([...'EPSTOWWE'], config.minWordLength)
    expect(count).toBeGreaterThan(50)
    expect(longest).toBe(5)
    expect(longest).toBeLessThan(config.ceilingMin)
    expect(letterFaults([...'EPSTOWWE'], ENGLISH)).toEqual([
      { type: 'duplicate-rare-letter', letter: 'W' },
    ])
  })

  it('ranks the fallback on the ceiling, not on the word count', () => {
    // Nothing can clear this word floor, so every draw is a fallback candidate. The one it
    // settles on still holds a word long enough to pay, because the ceiling is ranked first.
    const config = configFor('medium', { n: 8, wMin: 1_000_000 })
    const board = generateBoard(config, 99, index, ENGLISH, 40)
    expect(board.accepted).toBe(false)
    expect(board.longest).toBeGreaterThanOrEqual(config.ceilingMin)
  })

  it('reports an empty board when every draw is faulty', () => {
    const hopeless: Alphabet = {
      ...ENGLISH,
      id: 'test-hopeless',
      weights: { A: 1, J: 1 },
      vowels: ['A'],
      rareLetters: ['A', 'J'],
    }
    const board = generateBoard(configFor('medium', { n: 4 }), 1, index, hopeless, 20)
    expect(board).toMatchObject({ letters: [], accepted: false, wordCount: 0, longest: 0 })
  })
})
