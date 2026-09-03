import type { Alphabet, BoardProfile, Dictionary } from '@blinkered/engine'

// `BoardProfile` moved to the engine when letter replacement needed `profile` inside `reduce`.
// Re-exported here because this is where it has always been imported from.
export type { BoardProfile }

/**
 * The shipped dictionary: a `Dictionary` that also knows how big it is.
 *
 * `profile` is the engine's now, since a replaced letter has to be checked against the board
 * floor while a game is running. What is left here is the implementation and the tiering.
 */
export interface WordIndex extends Dictionary {
  readonly size: number
}

/** Subsets grow as 2^n, so refuse a board large enough to make solving expensive. */
export const MAX_SOLVABLE_TILES = 16

/**
 * Sorted tiles joined by a separator so multi-character letters cannot collide: in an
 * alphabet with an IJ tile, [IJ, A] must not key the same as [I, JA].
 */
export function anagramKey(tiles: readonly string[]): string {
  return [...tiles].sort().join(' ')
}

/** One entry per anagram class, holding how many words share it and how many tiles it takes. */
type AnagramMap = Map<string, { count: number; tiles: number }>

function anagramMap(words: Iterable<string>, alphabet: Alphabet): AnagramMap {
  const byAnagram: AnagramMap = new Map()
  for (const word of words) {
    const tiles = alphabet.segment(word)
    const key = anagramKey(tiles)
    const known = byAnagram.get(key)
    byAnagram.set(key, { count: (known?.count ?? 0) + 1, tiles: tiles.length })
  }
  return byAnagram
}

function solver(byAnagram: AnagramMap): WordIndex['profile'] {
  return (letters, minLength) => {
    if (letters.length > MAX_SOLVABLE_TILES) {
      throw new RangeError(`cannot solve a board of ${String(letters.length)} tiles`)
    }
    const keys = new Set<string>()
    for (let mask = 1; mask < 1 << letters.length; mask++) {
      const subset: string[] = []
      for (let bit = 0; bit < letters.length; bit++) {
        if (mask & (1 << bit)) subset.push(letters[bit] as string)
      }
      if (subset.length < minLength) continue
      keys.add(anagramKey(subset))
    }
    let count = 0
    let longest = 0
    for (const key of keys) {
      const entry = byAnagram.get(key)
      if (entry === undefined) continue
      count += entry.count
      if (entry.tiles > longest) longest = entry.tiles
    }
    return { count, longest }
  }
}

export function buildIndex(words: Iterable<string>, alphabet: Alphabet): WordIndex {
  const all = new Set(words)
  return {
    size: all.size,
    has: (word) => all.has(word),
    profile: solver(anagramMap(all, alphabet)),
  }
}

export interface TieredIndex extends WordIndex {
  /** Words `profile` counts, as against the `size` that `has` accepts. */
  readonly commonSize: number
  /**
   * How to write a found word, where the fold threw part of it away.
   *
   * Travels with the dictionary because it comes out of the same file and answers a question
   * only the dictionary can: what the corpus actually spelled. `Alphabet.display` handles
   * what a rule can find, and this handles what only a lookup can.
   */
  spell(word: string): string
  /**
   * Which build of this language's list this is, carried onto every game played against it.
   *
   * A word list is not a constant. Six languages changed vocabulary by up to four times in one
   * afternoon, and a score is only comparable to another score set against the same words. The
   * engine version does not cover this: the rules were identical either side of that rebuild
   * and the dictionary was not.
   */
  readonly digest: string
}

/**
 * One dictionary with two jobs.
 *
 * A shipped list has a common tier and a full tier, and they are not two downloads: they are
 * two roles. Credit is generous, so `has` accepts the full list and an unusual word still
 * scores. The board generator's word floor is not, so `profile` counts only the common tier,
 * and a board is guaranteed solvable from vocabulary people actually use rather than from
 * obscurities nobody will find. See docs/DICTIONARIES.md.
 */
export function buildTieredIndex(
  full: Iterable<string>,
  common: Iterable<string>,
  alphabet: Alphabet,
  written: ReadonlyMap<string, string> = new Map(),
  digest = '',
): TieredIndex {
  const everything = new Set(full)
  const shortlist = new Set(common)
  return {
    size: everything.size,
    commonSize: shortlist.size,
    has: (word) => everything.has(word),
    profile: solver(anagramMap(shortlist, alphabet)),
    // The stored spelling first, then whatever a rule can restore, then the word as tiled.
    // A list with no spellings in it and an alphabet with no `display` leaves this identity.
    spell: (word) => written.get(word) ?? alphabet.display?.(word) ?? word,
    digest,
  }
}
