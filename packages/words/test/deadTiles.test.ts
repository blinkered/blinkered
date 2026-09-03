import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ALPHABET_IDS, alphabetFor } from '@blinkered/engine'

/*
 * Every letter a board can deal has to be a letter some word can use.
 *
 * The two halves of an alphabet are written yards apart and nothing tied them together:
 * `weights` says what the bag holds, `fold` says what a word is made of, and a letter can
 * appear in the first while the second quietly destroys it. Russian shipped that way. Й is a
 * letter of the alphabet and a tile in Russian's own word games, but in NFD it is И plus a
 * combining breve, so the default fold ate it — leaving Й in the bag at weight 1 and in no
 * word at all. МОЙ was stored as МОИ and merged with it, and one draw in a hundred was a tile
 * that could never be played.
 *
 * Nothing caught it because every test that could have was written against the same fold. This
 * reads the shipped lists instead, which is the only place the two halves meet.
 */
const DATA = fileURLToPath(new URL('../data/', import.meta.url))

/** Every tile that appears in any word of a language's shipped list. */
function tilesUsedBy(tag: string): Set<string> {
  const alphabet = alphabetFor(tag)
  const seen = new Set<string>()
  for (const line of readFileSync(`${DATA}${tag}/words.txt`, 'utf8').split('\n')) {
    const word = line.trim()
    // The header lines carry no word, and segmenting them would invent tiles from punctuation.
    if (word === '' || word.startsWith('#')) continue
    for (const tile of alphabet.segment(word)) seen.add(tile)
  }
  return seen
}

const built = ALPHABET_IDS.filter((tag) => existsSync(`${DATA}${tag}/words.txt`))

describe('every tile is playable', () => {
  it.each(built)('%s deals no letter its own words cannot spell', (tag) => {
    const used = tilesUsedBy(tag)
    const dead = Object.keys(alphabetFor(tag).weights).filter((letter) => !used.has(letter))
    expect(dead).toEqual([])
  })

  it('checks every language that has a list', () => {
    expect(built.length).toBeGreaterThan(0)
  })
})
