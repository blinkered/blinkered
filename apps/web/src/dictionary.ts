import { alphabetFor } from '@blinkered/engine'
import { buildIndex } from '@blinkered/words'
import type { WordIndex } from '@blinkered/words'

/**
 * Loads the word list and builds its index.
 *
 * This runs on the main thread on purpose. The engine's `Dictionary.has` is synchronous,
 * because word validation happens inside a pure reducer, so moving the index into a Web
 * Worker would mean making validation async and changing the engine's contract. Instead the
 * index is built once, behind a loading state, and the cost is paid per session rather than
 * per word.
 */
export async function loadDictionary(language: string, signal: AbortSignal): Promise<WordIndex> {
  const alphabet = alphabetFor(language)
  const response = await fetch(`${import.meta.env.BASE_URL}words-${language}.txt`, { signal })
  if (!response.ok) {
    throw new Error(`No word list for "${language}". Generate one with: pnpm wordlist`)
  }
  const text = await response.text()
  // Already folded and length-filtered by tools/wordlist, so this only drops the trailing line.
  const words = text.split('\n').filter((word) => word.length > 0)
  if (words.length === 0) throw new Error(`The word list for "${language}" is empty.`)
  return buildIndex(words, alphabet)
}
