import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ALPHABET_IDS, alphabetFor, configFor } from '@blinkered/engine'
import { buildIndex, generateBoard, parseWordList } from '../src/index.js'

/*
 * Every language deals a board a player could actually play.
 *
 * The pieces of a language are checked separately elsewhere — the fold by its probe, the tiles
 * by the dead-tile guard, the tour's three words against the dictionary they came from. None of
 * those asks the only question that matters to somebody who picked the language out of the
 * menu: does pressing Start give you something to do?
 *
 * It is worth asking of all of them rather than the handful anyone thinks to open. Twenty-five
 * languages arrived at once, and the thin ones are thin for reasons that do not announce
 * themselves: a validator that refuses most of an inflecting corpus, a weight table still
 * carrying placeholders, a language whose words are longer than the board.
 */
const DATA = fileURLToPath(new URL('../data/', import.meta.url))
const playable = ALPHABET_IDS.filter((tag) => existsSync(`${DATA}${tag}/words.txt`))

/** The medium board, which is the one the game opens on. */
function dealt(tag: string, seed: number): { accepted: boolean; words: number; longest: number } {
  const { common } = parseWordList(readFileSync(`${DATA}${tag}/words.txt`, 'utf8'))
  const alphabet = alphabetFor(tag)
  const index = buildIndex([...common], alphabet)
  const config = { ...configFor('medium'), language: tag }
  const board = generateBoard(config, seed, index, alphabet)
  return { accepted: board.accepted, words: board.wordCount, longest: board.longest }
}

describe('every language deals a board worth playing', () => {
  it.each(playable)('%s', (tag) => {
    // Three seeds rather than one. A single lucky draw proves nothing about a thin language,
    // and the generator is allowed four hundred attempts before it gives up and hands back its
    // best effort — which is exactly the outcome worth catching.
    for (const seed of [20260902, 7, 31337]) {
      const { accepted, words, longest } = dealt(tag, seed)
      expect({ tag, seed, accepted, words, longest }).toMatchObject({ accepted: true })
      // The floor the generator enforces: enough words to be worth looking at, and one long
      // enough to turn a profit under the fibonacci economy.
      expect(words).toBeGreaterThan(0)
      expect(longest).toBeGreaterThanOrEqual(6)
    }
  })

  it('has a word list for every alphabet the app can offer', () => {
    expect(playable).toHaveLength(ALPHABET_IDS.length)
  })
})
