import { readFileSync } from 'node:fs'
import type { Alphabet } from '@blinkered/engine'
import { normaliseWordList } from './wordList.js'
import type { WordListOptions } from './wordList.js'

/**
 * Filesystem access lives behind its own entry point, `@blinkered/words/node`.
 *
 * The main entry point has to stay browser-safe: the web app imports the solver and the
 * generator, and a stray `node:fs` in the barrel breaks the bundle. Keeping the split at the
 * module boundary means the bundler enforces it rather than a comment asking politely.
 */
export function readWordList(
  path: string,
  alphabet: Alphabet,
  options: WordListOptions = {},
): string[] {
  return normaliseWordList(readFileSync(path, 'utf8').split('\n'), alphabet, options)
}
