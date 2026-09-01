import { scoreWords } from '@blinkered/engine'
import { alphabetFor } from '@blinkered/engine'
import type { GameConfig } from '@blinkered/engine'

/**
 * What a client claims about a game it has finished.
 *
 * Note what is absent: a score. That is the whole design. `wordScore` is a function of word
 * length and nothing else, so the words are sufficient to compute one, and a number the client
 * chose is never stored. See docs/ACCOUNTS.md, "How a score is checked".
 */
export interface Submission {
  /** Every word the game accepted, in the order it accepted them. */
  readonly words: readonly string[]
  /** Rounds played, counting from one. */
  readonly rounds: number
}

export type Rejection =
  /** A word shorter than the ruleset allows. The game would never have accepted it. */
  | 'too-short'
  /** The same word twice. The reducer refuses a duplicate, so a game cannot contain one. */
  | 'duplicate'
  /** Fewer rounds than words could have been made in, or no rounds at all. */
  | 'impossible-rounds'
  /** More tiles spent than the rounds claimed ever dealt. */
  | 'impossible-tiles'
  /** More words than a game can hold. A bound on the request, not a rule of the game. */
  | 'too-many-words'

export type Verdict =
  | { readonly ok: true; readonly score: number; readonly words: number; readonly tiles: number }
  | { readonly ok: false; readonly reason: Rejection }

/**
 * A ceiling on the request rather than a rule about play.
 *
 * A game is bounded by its flip budget, which under `fibonacci` does not actually close -- a long
 * word pays back more flips than the round cost -- so there is no honest arithmetic limit to
 * derive this from. It exists so a submission cannot be a megabyte.
 */
const MOST_WORDS = 2000

/**
 * Scores a finished game, and refuses one that could not have been played.
 *
 * The checks here are the cheap, exact ones: a game cannot contain a word below its own minimum,
 * cannot contain the same word twice, and under `spend` cannot have used more tiles than its
 * rounds dealt. What none of them do is prove a human played it, and they are not pretending to.
 * A score large enough to be worth faking is large enough to see, and the answer to that is a
 * person with a delete button rather than more arithmetic here.
 */
export function scoreSubmission(submission: Submission, config: GameConfig): Verdict {
  const { words, rounds } = submission

  if (!Number.isInteger(rounds) || rounds < 1) return { ok: false, reason: 'impossible-rounds' }
  if (words.length > MOST_WORDS) return { ok: false, reason: 'too-many-words' }

  const alphabet = alphabetFor(config.language)
  const seen = new Set<string>()
  let tiles = 0

  for (const word of words) {
    if (seen.has(word)) return { ok: false, reason: 'duplicate' }
    seen.add(word)
    // Tiles, not characters. Croatian LJ is one tile, and a length measured in characters would
    // refuse a legal word for being too short as readily as it would overpay it.
    const length = alphabet.segment(word).length
    if (length < config.minWordLength) return { ok: false, reason: 'too-short' }
    tiles += length
  }

  /*
   * Under `spend` a completed word takes its letters off the board, and a round deals `n` tiles.
   * So the tiles a game spent cannot exceed what its rounds dealt. Exact, and free.
   *
   * Only under `spend`. `keep` leaves the letters where they are, so a tile can be used again and
   * the bound is simply not true there. `keep` is not a preset, so no such game reaches a board,
   * but it is still a game somebody played and refusing to record it would be wrong.
   */
  if (config.wordCompleteMode === 'spend' && tiles > rounds * config.n) {
    return { ok: false, reason: 'impossible-tiles' }
  }

  return { ok: true, score: scoreWords(words, config.language), words: words.length, tiles }
}
