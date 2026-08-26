import { describe, expect, it } from 'vitest'
import { ENGLISH } from '@flippy/engine'
import { MAX_SOLVABLE_TILES, anagramKey, buildIndex } from '../src/index.js'
import { DIGRAPHS, WORDS } from './fixtures.js'

const index = buildIndex(WORDS, ENGLISH)

describe('anagramKey', () => {
  it('sorts tiles', () => {
    expect(anagramKey(['T', 'A', 'E'])).toBe(anagramKey(['E', 'A', 'T']))
  })

  it('keeps multi-character letters from colliding with their parts', () => {
    expect(anagramKey(['IJ', 'A'])).not.toBe(anagramKey(['I', 'JA']))
  })
})

describe('buildIndex', () => {
  it('answers membership', () => {
    expect(index.has('ATE')).toBe(true)
    expect(index.has('AXE')).toBe(false)
  })

  it('counts distinct words, not distinct spellings', () => {
    expect(index.size).toBe(WORDS.length)
  })

  it('ignores duplicates in its input', () => {
    expect(buildIndex(['ATE', 'ATE', 'EAT'], ENGLISH).size).toBe(2)
  })
})

describe('profile', () => {
  it('finds every word the tiles admit', () => {
    const { count, longest } = index.profile([...'ATESON'], 3)
    // ATE, EAT, TEA, SEAT, EAST, STONE, NOTES, ONSET, ATONES
    expect(count).toBe(9)
    expect(longest).toBe(6)
  })

  it('respects the minimum length', () => {
    expect(index.profile([...'ATESON'], 5).count).toBe(4)
    expect(index.profile([...'ATESON'], 6).count).toBe(1)
    expect(index.profile([...'ATESON'], 7)).toEqual({ count: 0, longest: 0 })
  })

  it('uses each tile at most once', () => {
    // ZZZ needs three Z tiles, and one board has only two.
    expect(index.profile([...'ZZ'], 3).count).toBe(0)
    expect(index.profile([...'ZZZ'], 3).count).toBe(1)
  })

  it('counts a digraph tile as one letter', () => {
    const dutch = buildIndex(['IJS', 'IJ', 'NAJA'], DIGRAPHS)
    // IJS is three characters but two tiles, so a two-tile minimum reaches it and a
    // three-tile minimum does not. That is the whole point of measuring length in tiles.
    expect(dutch.profile(['IJ', 'S', 'A'], 2)).toEqual({ count: 1, longest: 2 })
    expect(dutch.profile(['IJ', 'S', 'A'], 3)).toEqual({ count: 0, longest: 0 })
    expect(dutch.profile(['IJ', 'S', 'A'], 1).count).toBe(2)
  })

  it('refuses a board too large to solve by enumeration', () => {
    const tooMany = Array.from({ length: MAX_SOLVABLE_TILES + 1 }, () => 'A')
    expect(() => index.profile(tooMany, 3)).toThrow(RangeError)
  })
})
