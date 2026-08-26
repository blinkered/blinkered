import type { Alphabet } from './alphabet.js'
import { ENGLISH } from './languages.js'

/**
 * Letter-shape rules a board must satisfy, independent of any dictionary. The word-count and
 * ceiling tests need a word list and so live in the generator; these do not.
 *
 * The rules themselves are properties of an alphabet, not of the game: Q needing a U is a
 * fact about English. See docs/PLAN.md 1.7 and 7.
 */
export type LetterFault =
  /** Two J's or two W's on one board reliably yields a rich-looking board with no long words. */
  | { readonly type: 'duplicate-rare-letter'; readonly letter: string }
  /** A letter that cannot be used without a companion its board does not have. */
  | {
      readonly type: 'unaccompanied-letter'
      readonly letter: string
      readonly needs: readonly string[]
    }

export function letterFaults(
  letters: readonly string[],
  alphabet: Alphabet = ENGLISH,
): LetterFault[] {
  const board = letters.map((letter) => alphabet.fold(letter))
  const faults: LetterFault[] = []

  const seen = new Set<string>()
  const reported = new Set<string>()
  for (const letter of board) {
    if (alphabet.rareLetters.includes(letter) && seen.has(letter) && !reported.has(letter)) {
      faults.push({ type: 'duplicate-rare-letter', letter })
      reported.add(letter)
    }
    seen.add(letter)
  }

  for (const [letter, needs] of Object.entries(alphabet.requires)) {
    if (board.includes(letter) && !needs.some((companion) => board.includes(companion))) {
      faults.push({ type: 'unaccompanied-letter', letter, needs })
    }
  }

  return faults
}
