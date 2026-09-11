import { alphabetFor } from '@blinkered/engine'
import type { TieredIndex } from '@blinkered/words'

/**
 * Writing a found word out, and telling each character which tile it came from.
 *
 * Extracted because two screens need it and a second copy would drift: the rail beside a running
 * game, and the history of a game finished weeks ago. Both have to mark the letters a wild gave,
 * and `wilds` indexes **tiles**, so both have to solve the same problem.
 */

export interface Spelling {
  /** The word as it is written, which is not always the word as it was folded. */
  readonly spell: (word: string) => string
  /**
   * The written word, with each character told which tile it came from, and `-1` for the ones
   * that came from none.
   *
   * The two stopped being the same string the moment a spelling could be longer than what was
   * tiled: Vietnamese CHÂU CHẤU ĐÁ XE is sixteen characters over twelve tiles. Marking by
   * character position would mark the wrong letters. A character belongs to a tile when the fold
   * keeps it; the separators the fold eats belong to no tile, and are what pushes the two apart.
   */
  readonly laid: (word: string) => { letter: string; tile: number }[]
}

/**
 * How a language writes its words.
 *
 * The dictionary is optional and the fallback is deliberate. Two different jobs wear the name
 * `spell`: the dictionary restores what only a lookup can find, and `display` restores what a
 * rule can, which is Hebrew's five final forms. Everywhere else both are identity.
 *
 * A history screen usually has no dictionary to hand — reviewing a Croatian game while playing in
 * English would mean fetching a whole word list to draw a list — so it passes whichever one it
 * happens to have and accepts the fallback otherwise. What that costs is Vietnamese compounds
 * shown as they were tiled rather than as they are written, which is the same trade the rail
 * already makes when a finished game outlives the fetch that produced it.
 */
export function spellingFor(language: string, dictionary?: TieredIndex | null): Spelling {
  const alphabet = alphabetFor(language)
  const spell = (word: string): string =>
    dictionary?.spell(word) ?? alphabet.display?.(word) ?? word
  return {
    spell,
    laid: (word) => {
      let tile = 0
      return [...spell(word)].map((letter) => {
        const at = alphabet.fold(letter) === '' ? -1 : tile++
        return { letter, tile: at }
      })
    },
  }
}
