import { drawLetters, letterFaults, seedRng } from '@blinkered/engine'
import type { Alphabet, GameConfig, RngState } from '@blinkered/engine'
import type { WordIndex } from './wordIndex.js'

export interface GeneratedBoard {
  readonly letters: readonly string[]
  readonly rng: RngState
  readonly wordCount: number
  readonly longest: number
  /** Draws made, whether or not they were faulty. */
  readonly attempts: number
  /** False when no draw cleared every bar and the best one found is being played anyway. */
  readonly accepted: boolean
}

const DEFAULT_MAX_ATTEMPTS = 400

/**
 * Draws until a board clears three bars: enough words, one word long enough to be worth
 * holding out for, and no letter faults. A count alone is not enough, because a board can
 * admit eighty words and still cap out at five letters, which under the fibonacci economy
 * cannot be played at a profit. See docs/PLAN.md 1.7.
 */
export function generateBoard(
  config: GameConfig,
  seed: number,
  index: WordIndex,
  alphabet: Alphabet,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
): GeneratedBoard {
  let rng = seedRng(seed)
  let best: Candidate | null = null
  let attempt = 0

  while (attempt < maxAttempts) {
    attempt += 1
    const [letters, next] = drawLetters(rng, config.n, alphabet)
    rng = next
    if (letterFaults(letters, alphabet).length > 0) continue

    const { count, longest } = index.profile(letters, config.minWordLength)
    const candidate: Candidate = { letters, rng: next, wordCount: count, longest }
    if (count >= config.wMin && longest >= config.ceilingMin) {
      return { ...candidate, attempts: attempt, accepted: true }
    }
    if (best === null || rank(candidate) > rank(best)) best = candidate
  }

  // Nothing cleared every bar, so play the best board seen and report that it fell short.
  if (best === null) {
    return { letters: [], rng, wordCount: 0, longest: 0, attempts: attempt, accepted: false }
  }
  return { ...best, attempts: attempt, accepted: false }
}

/** A candidate board before it is known whether it was accepted. */
interface Candidate {
  readonly letters: readonly string[]
  readonly rng: RngState
  readonly wordCount: number
  readonly longest: number
}

/** A board that can pay beats a board that merely holds plenty of words. */
function rank(board: Candidate): number {
  return board.longest * 10_000 + board.wordCount
}
