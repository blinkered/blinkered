/**
 * Everything about the game that is a fact about a language rather than a fact about the
 * rules. The reducer, the scoring and the economy never look in here; only letter drawing,
 * board acceptance and keyboard folding do.
 *
 * A tile holds a `string`, not a character, and word length is counted in tiles, so an
 * alphabet whose letters are digraphs (Dutch IJ, Hungarian SZ) needs no engine changes.
 */
export interface Alphabet {
  /** BCP 47 language tag. Stored with every game, so an old result stays interpretable. */
  readonly id: string
  /** Draw weight per letter. Relative, so any scale works. */
  readonly weights: Readonly<Record<string, number>>
  /** Which of those letters count as vowels, for the vowel floor in a draw. */
  readonly vowels: readonly string[]
  /** Letters a board may not hold twice: too rare to be usable in pairs. */
  readonly rareLetters: readonly string[]
  /**
   * Letters that are dead without a companion. In English a Q with no U can be revealed and
   * never used. Empty for languages where every letter stands alone.
   */
  readonly requires: Readonly<Record<string, readonly string[]>>
  /**
   * Folds a typed key onto a tile letter. English upper-cases. A language with accents
   * decides here whether typing `e` should reach an `É` tile.
   *
   * Deliberately not `toLocaleUpperCase`: Turkish maps `i` to `İ`, so a Turkish alphabet
   * needs its own fold rather than a locale argument bolted onto this one.
   */
  fold(key: string): string
  /**
   * Splits a word into tiles. One code point per tile for most alphabets; an alphabet with
   * digraph letters needs greedy longest-match, which `segmentBy` builds. This is what makes
   * word length a tile count rather than a character count all the way down to the word list.
   */
  segment(word: string): string[]
}

/**
 * Builds a greedy longest-match segmenter for an alphabet with multi-character letters, so
 * an IJ tile wins over an I tile at the same position. Anything the alphabet does not know
 * survives as a single code point, to be dropped later when the word list is filtered.
 */
export function segmentBy(letters: readonly string[]): (word: string) => string[] {
  const ordered = [...letters].sort((a, b) => b.length - a.length)
  return (word) => {
    const tiles: string[] = []
    let at = 0
    while (at < word.length) {
      const letter = ordered.find((candidate) => word.startsWith(candidate, at))
      if (letter === undefined) {
        const codePoint = String.fromCodePoint(word.codePointAt(at) as number)
        tiles.push(codePoint)
        at += codePoint.length
        continue
      }
      tiles.push(letter)
      at += letter.length
    }
    return tiles
  }
}

/**
 * Drops diacritics, leaving the base letter. This is the transform for a language whose
 * accented forms are not separate letters of its alphabet: in French an e-acute is an E
 * wearing an accent, so epee and pere both live on plain E tiles. Not for Polish or Turkish,
 * where the accented forms are letters in their own right and deserve their own tiles.
 */
export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export const ENGLISH: Alphabet = {
  id: 'en',
  // Derived from the word list by tools/derive, not copied from Scrabble. Scrabble's tile
  // distribution follows letter frequency in running text; a board has to spell dictionary
  // words, where C, L, S and P are far commoner and D, W and F rather less so.
  weights: {
    A: 9,
    B: 2,
    C: 5,
    D: 3,
    E: 10,
    F: 1,
    G: 2,
    H: 3,
    I: 9,
    J: 1,
    K: 1,
    L: 6,
    M: 3,
    N: 7,
    O: 8,
    P: 3,
    Q: 1,
    R: 7,
    S: 6,
    T: 7,
    U: 4,
    V: 1,
    W: 1,
    X: 1,
    Y: 2,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['J', 'K', 'Q', 'V', 'W', 'X', 'Z'],
  requires: { Q: ['U'] },
  fold: (key) => key.toUpperCase(),
  // Every English letter is one code point, so the simple split is also the correct one.
  segment: (word) => [...word],
}

const ALPHABETS: Readonly<Record<string, Alphabet>> = { [ENGLISH.id]: ENGLISH }

export const DEFAULT_LANGUAGE = ENGLISH.id

/** Every language Blinkered can currently deal a board in. */
export const ALPHABET_IDS: readonly string[] = Object.keys(ALPHABETS)

export function alphabetFor(id: string): Alphabet {
  const alphabet = ALPHABETS[id]
  if (!alphabet) throw new RangeError(`no alphabet for language ${id}`)
  return alphabet
}
