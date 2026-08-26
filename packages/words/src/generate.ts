import { drawLetters, letterFaults, seedRng } from '@blinkered/engine'
import type { Alphabet, GameConfig, RngState } from '@blinkered/engine'
import type { WordIndex } from './wordIndex.js'

export interface GeneratedBoard {
  readonly letters: readonly string[]
  readonly rng: RngState
  readonly wordCount: number
  readonly longest: number
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
  let best: GeneratedBoard | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const [letters, next] = drawLetters(rng, config.n, alphabet)
    rng = next
    if (letterFaults(letters, alphabet).length > 0) continue

    const { count, longest } = index.profile(letters, config.minWordLength)
    const candidate: GeneratedBoard = {
      letters,
      rng: next,
      wordCount: count,
      longest,
      attempts: attempt,
      accepted: count >= config.wMin && longest >= config.ceilingMin,
    }
    if (candidate.accepted) return candidate
    if (best === null || rank(candidate) > rank(best)) best = candidate
  }
  return best ?? emptyResult(rng, maxAttempts)
}

/** A board that can pay beats a board that merely holds plenty of words. */
function rank(board: GeneratedBoard): number {
  return board.longest * 10_000 + board.wordCount
}

function emptyResult(rng: RngState, attempts: number): GeneratedBoard {
  return { letters: [], rng, wordCount: 0, longest: 0, attempts, accepted: false }
}
