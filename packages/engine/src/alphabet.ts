/**
 * Everything about the game that is a fact about a language rather than a fact about the
 * rules. The reducer, the scoring and the economy never look in here; only letter drawing,
 * board acceptance and keyboard folding do.
 *
 * A tile holds a `string`, not a character, and word length is counted in tiles, so an
 * alphabet whose letters are digraphs (Croatian LJ, NJ, DŽ) needs no engine change.
 */
export interface Alphabet {
  /** BCP 47 language tag. Stored with every game, so an old result stays interpretable. */
  readonly id: string
  /** The language's own name for itself, for a menu that a speaker can read. */
  readonly endonym: string
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
   * Folds a typed key onto a tile letter, and a dictionary entry onto tiles.
   *
   * This is where a language's diacritic policy lives. French E-acute is an E wearing an
   * accent, so it folds away and EPEE and PERE both play on plain E tiles. Croatian Č and
   * Swedish Ö are letters in their own right, so they survive folding and get their own
   * tiles. The difference is a fact about the alphabet, not about Unicode.
   */
  fold(key: string): string
  /**
   * Splits a word into tiles. One code point per tile for most alphabets; an alphabet with
   * digraph letters needs greedy longest-match, which `segmentBy` builds.
   */
  segment(word: string): string[]
}

/**
 * Drops diacritics, leaving the base letter. The whole transform for a language whose
 * accented forms are not separate letters of its alphabet.
 */
export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export interface FoldOptions {
  /** Letters whose mark is part of the letter and must survive: Spanish Ñ, Swedish Ö. */
  readonly keep?: readonly string[]
  /** Characters standing in for several letters: French Œ becomes OE. */
  readonly expand?: Readonly<Record<string, string>>
}

/**
 * Builds a fold: upper-case, expand any stand-in characters, then drop the diacritics that
 * are decoration while protecting the ones that are letters.
 *
 * Upper-casing does some of this already, and correctly: German eszett upper-cases to SS on
 * its own, which is exactly how German word games spell it.
 */
export function folder(options: FoldOptions = {}): (key: string) => string {
  const kept = options.keep ?? []
  const expand = Object.entries(options.expand ?? {})
  // Guard the protected letters behind characters no alphabet contains, strip, put them back.
  const guards = kept.map((letter, index) => [letter, `\u0001${String(index)}\u0001`] as const)

  return (key) => {
    let text = key.toUpperCase()
    for (const [from, to] of expand) text = text.split(from).join(to)
    if (guards.length === 0) return stripDiacritics(text)
    for (const [letter, guard] of guards) text = text.split(letter).join(guard)
    text = stripDiacritics(text)
    for (const [letter, guard] of guards) text = text.split(guard).join(letter)
    return text
  }
}

/**
 * Builds a greedy longest-match segmenter for an alphabet with multi-character letters, so
 * a Croatian LJ tile wins over an L tile at the same position. Anything the alphabet does
 * not know survives as a single code point, to be dropped when the word list is filtered.
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

/** One code point per tile: correct for every alphabet without digraph letters. */
export const byCodePoint = (word: string): string[] => [...word]
