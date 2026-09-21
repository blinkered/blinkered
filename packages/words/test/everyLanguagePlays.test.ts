import { existsSync, readFileSync, readdirSync } from 'node:fs'
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

  /*
   * The engine knows more alphabets than this repository has lists, and that is now the normal
   * state rather than a gap to close.
   *
   * It used to be the other way round: fifty-one alphabets, fifty-one lists, and this test
   * pinned the two together. The lists here are borrowed from the language repositories now, one
   * per attested language, so the count is whatever the attestation queue has reached. Holding
   * the old equality would mean either deleting an alphabet the moment a language is withdrawn
   * or never withdrawing one.
   *
   * What is still worth pinning is the direction that can actually break. A list whose tag the
   * engine has no alphabet for is silently skipped by the filter above -- never dealt, never
   * checked, and reported by nothing -- so it is caught here by walking the directory rather
   * than the alphabets.
   */
  it('has an alphabet for every word list here, and deals every one of them', () => {
    const shipped = readdirSync(DATA, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'licences')
      .map((entry) => entry.name)
      .sort()
    expect(shipped.filter((tag) => !ALPHABET_IDS.includes(tag))).toEqual([])
    expect([...playable].sort()).toEqual(shipped)
  })

  it('offers exactly the languages the manifest does', () => {
    // The app reads the manifest and the tests read the directory. A language in one and not the
    // other is a list that ships without being checked, or a list checked and never shipped.
    const manifest = JSON.parse(readFileSync(`${DATA}manifest.json`, 'utf8')) as {
      languages: { tag: string }[]
    }
    expect(manifest.languages.map((entry) => entry.tag).sort()).toEqual([...playable].sort())
  })
})
