import { alphabetFor } from './languages.js'
import type { FlipEconomy, GameConfig } from './types.js'

/**
 * Fibonacci anchored on the brief's table: 2 letters score 1, 3 letters score 2,
 * and every longer word is the sum of the two below it.
 */
export function wordScore(length: number): number {
  // `length` is a tile count throughout, not a character count.
  if (length < 2) return 0
  if (length === 2) return 1
  let lower = 1
  let upper = 2
  for (let l = 3; l < length; l++) {
    const next = lower + upper
    lower = upper
    upper = next
  }
  return upper
}

/**
 * Flips an accepted word pays back. Every revealed tile cost one flip, so compare
 * against `length` to see whether a word earns its letters. See docs/PLAN.md 1.10.
 */
export function flipReward(length: number, config: GameConfig): number {
  const economy: FlipEconomy = config.flipEconomy
  switch (economy) {
    case 'none':
      return 0
    case 'perLetter':
      return length
    case 'fibonacci':
      return wordScore(length)
    case 'overMinimum':
      return Math.max(0, length - config.minWordLength + 1)
  }
}

/**
 * What a list of finished words is worth, which is the only thing a server needs to score a game.
 *
 * The whole reason a submitted score can be recomputed rather than replayed: `wordScore` is a
 * function of length and nothing else, so the words are sufficient. No board, no clock, no order.
 * `properties.test.ts` asserts that a played game's score is exactly this sum, which is what makes
 * the server's number the same number rather than a second opinion.
 *
 * Length is measured in **tiles**, so the word is segmented by its own alphabet first. Counting
 * characters is right in English and wrong in Croatian, where LJ, NJ and DŽ are one tile each, and
 * wrong in the direction that quietly underpays the people least likely to be asked.
 */
export function scoreWords(words: readonly string[], language: string): number {
  const alphabet = alphabetFor(language)
  return words.reduce((total, word) => total + wordScore(alphabet.segment(word).length), 0)
}
