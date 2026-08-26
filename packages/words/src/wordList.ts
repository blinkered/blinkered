import type { Alphabet } from '@blinkered/engine'

export interface WordListOptions {
  /** Shortest word worth keeping. Two-letter words are dictionary trivia; see PLAN 1.9. */
  readonly minLength?: number
  /** Longest word worth keeping. Nothing longer than the biggest board is reachable. */
  readonly maxLength?: number
}

const DEFAULT_MIN_LENGTH = 2
const DEFAULT_MAX_LENGTH = 16

/**
 * Folds a raw word list onto an alphabet's tiles and drops everything unplayable.
 *
 * Folding is where a language's diacritic policy takes effect. French folds accents away, so
 * epee and pere both arrive as words over plain E tiles; Polish does not, because its
 * accented forms are letters in their own right. Either way, anything still carrying a letter
 * the alphabet does not have is dropped rather than silently mangled.
 */
export function normaliseWordList(
  raw: Iterable<string>,
  alphabet: Alphabet,
  options: WordListOptions = {},
): string[] {
  const minLength = options.minLength ?? DEFAULT_MIN_LENGTH
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH
  const playable = new Set(Object.keys(alphabet.weights))
  const kept = new Set<string>()

  for (const line of raw) {
    const word = alphabet.fold(line.trim())
    if (word === '') continue
    const tiles = alphabet.segment(word)
    if (tiles.length < minLength || tiles.length > maxLength) continue
    if (!tiles.every((tile) => playable.has(tile))) continue
    kept.add(word)
  }
  return [...kept].sort()
}
