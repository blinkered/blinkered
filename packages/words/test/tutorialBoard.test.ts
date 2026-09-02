import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { alphabetFor } from '@blinkered/engine'
import { TUTORIAL_BOARDS } from '../src/tutorialBoards.js'
import { spellableFrom, tilesWithCard } from '../src/tutorialBoard.js'

/*
 * The tour's boards, checked against the dictionaries they were generated from.
 *
 * This is the guard against the trap this repo has already been caught by once: a derived table
 * that goes stale silently when the thing it was derived from changes. Rebuild the word lists
 * without regenerating these and one of the tour's three words stops being a word, in a language
 * nobody on the project reads, on the one screen a new player is guaranteed to be looking at.
 *
 * It reads the committed lists rather than a fixture, because a fixture would only prove the
 * table is self-consistent, which is not the thing that goes wrong.
 */
const DATA = fileURLToPath(new URL('../data/', import.meta.url))

function wordsOf(tag: string): Set<string> {
  const text = readFileSync(`${DATA}${tag}/words.txt`, 'utf8')
  const lines = text.split('\n')
  // The header records where the common tier ends; everything after it is the credit tier, which
  // is accepted for score but is not what a tutorial should be showing anybody.
  const common = Number(/common=(\d+)/.exec(lines[0] ?? '')?.[1] ?? '0')
  return new Set(lines.slice(1, 1 + common))
}

const tags = Object.keys(TUTORIAL_BOARDS)

describe('the tour has a board for every language that ships a word list', () => {
  it('covers the sixteen', () => {
    const manifest = JSON.parse(readFileSync(`${DATA}manifest.json`, 'utf8')) as {
      languages: { tag: string }[]
    }
    expect([...tags].sort()).toEqual(manifest.languages.map((l) => l.tag).sort())
  })
})

describe.each(tags)('the %s board', (tag) => {
  const board = TUTORIAL_BOARDS[tag]!
  const alphabet = alphabetFor(tag)
  const segment = (word: string): string[] => alphabet.segment(word)

  it('has six tiles', () => {
    expect(board.tiles).toHaveLength(6)
  })

  it('opens on a word spelled by its first three tiles, in order', () => {
    // In order, not merely from them: the tour taps tile 1, 2 and 3 and the word has to appear.
    expect(segment(board.three)).toEqual([...board.tiles].slice(0, 3))
  })

  it('corrects to a word that uses all six', () => {
    const long = segment(board.six)
    expect(long).toHaveLength(6)
    expect(spellableFrom(long, board.tiles)).toBe(true)
  })

  it('corrects to something other than a longer spelling of the same start', () => {
    // Otherwise the correction is not a correction, it is the same word typed more slowly.
    expect(segment(board.six).slice(0, 3)).not.toEqual(segment(board.three))
  })

  it('has a card that becomes a letter it is not already hiding', () => {
    expect(board.card.at).toBeGreaterThanOrEqual(0)
    expect(board.card.at).toBeLessThan(6)
    expect(board.card.becomes).not.toBe(board.tiles[board.card.at])
  })

  it('spells its card word from the other five tiles and the card', () => {
    const word = segment(board.card.word)
    expect(word).toHaveLength(6)
    expect(spellableFrom(word, tilesWithCard(board))).toBe(true)
  })

  it('needs the card for that word, rather than merely allowing it', () => {
    // If the board could spell it anyway the card is decoration, and the screen teaches nothing.
    expect(spellableFrom(segment(board.card.word), board.tiles)).toBe(false)
  })

  it('swaps a letter that is on the board for one that is not', () => {
    expect(board.tiles).toContain(board.swap.from)
    expect(board.tiles).not.toContain(board.swap.to)
  })

  it('plays three different words', () => {
    expect(new Set([board.three, board.six, board.card.word]).size).toBe(3)
  })

  it('plays words the language actually uses', () => {
    // The common tier, not the credit tier. A tutorial that opens on a word the player has to
    // take on trust is teaching them to distrust the dictionary.
    const common = wordsOf(tag)
    for (const word of [board.three, board.six]) {
      expect(common.has(word), `${word} is not in ${tag}'s common tier`).toBe(true)
    }
  })

  it('plays a card word the dictionary knows', () => {
    // Looser than the two above, and deliberately: English's GASSES is a real word in the credit
    // tier and is the best demonstration of a card in the whole set, because the board holds two
    // esses and the card is the third.
    const text = readFileSync(`${DATA}${tag}/words.txt`, 'utf8')
    expect(new Set(text.split('\n')).has(board.card.word)).toBe(true)
  })
})
