import { PROFITABLE_LENGTH, alphabetFor, configFor, defaultWMin } from '@blinkered/engine'
import { buildIndex, generateBoard, parseWordList } from '@blinkered/words'
import type { ParsedWordList } from '@blinkered/words'

/**
 * The seeds the floor is judged on, and the same three `everyLanguagePlays` uses.
 *
 * Three rather than one because a single lucky draw proves nothing about a thin language, and
 * the generator is allowed four hundred attempts before it gives up and hands back its best
 * effort. That last outcome is exactly what this is here to catch: nothing throws, nothing logs,
 * and the player is dealt a board the rules say is unplayable.
 */
export const SEEDS = [20260902, 7, 31337] as const

export interface Draw {
  readonly seed: number
  readonly accepted: boolean
  readonly words: number
  readonly longest: number
}

export interface Floor {
  /** Words a board of this size must admit in this language. `defaultWMin`, per language. */
  readonly wMin: number
  readonly draws: readonly Draw[]
  readonly passes: boolean
  /** What failed, in a sentence, for the operator who has to decide what to do about it. */
  readonly why?: string
}

export interface Usable {
  readonly parsed: ParsedWordList
  readonly floor: Floor
}

/** A list that does not parse is not a word list, whatever the server sent. */
export class NotAWordList extends Error {}

/**
 * Whether a list deals a board worth playing, which is the only question this repository asks of
 * one.
 *
 * Coverage is the language repository's question and it is a different one: a thin list published
 * with its thinness stated is a fine thing to have and a poor thing to deal from. What matters
 * here is whether pressing Start gives the player something to do, so the test is the game's own
 * acceptance rule on the board the game opens on.
 *
 * Measured against the **common** tier alone, because that is what the generator counts toward
 * the floor. The full tier grants credit and cannot make a board solvable.
 */
export function usability(tag: string, text: string): Usable {
  let parsed: ParsedWordList
  try {
    parsed = parseWordList(text)
  } catch (error) {
    throw new NotAWordList(error instanceof Error ? error.message : String(error))
  }
  if (parsed.language !== tag) {
    throw new NotAWordList(`header says language=${parsed.language}, expected ${tag}`)
  }

  const alphabet = alphabetFor(tag)
  const config = { ...configFor('medium'), language: tag }
  const index = buildIndex([...parsed.common], alphabet)
  const draws = SEEDS.map((seed) => {
    const board = generateBoard(config, seed, index, alphabet)
    return { seed, accepted: board.accepted, words: board.wordCount, longest: board.longest }
  })

  const short = draws.filter((draw) => !draw.accepted)
  const flat = draws.filter((draw) => draw.accepted && draw.longest < PROFITABLE_LENGTH)
  const wMin = defaultWMin(config.n, config.minWordLength, tag)
  const passes = short.length === 0 && flat.length === 0

  const why =
    short.length > 0
      ? `${String(short.length)} of ${String(draws.length)} draws fell short of the ` +
        `${String(wMin)}-word floor (${short.map((draw) => String(draw.words)).join(', ')})`
      : flat.length > 0
        ? `${String(flat.length)} of ${String(draws.length)} draws held no word of ` +
          `${String(PROFITABLE_LENGTH)} tiles, so they cannot be played at a profit`
        : undefined

  const floor: Floor = why === undefined ? { wMin, draws, passes } : { wMin, draws, passes, why }
  return { parsed, floor }
}
