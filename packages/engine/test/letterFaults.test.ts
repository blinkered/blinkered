import { describe, expect, it } from 'vitest'
import { drawLetters, letterFaults, seedRng } from '../src/index.js'
import type { Alphabet } from '../src/index.js'

describe('letterFaults', () => {
  it('passes a sound board', () => {
    expect(letterFaults([...'ATESONBRUG'])).toEqual([])
  })

  it('rejects a Q with no U, because that tile can never be used', () => {
    expect(letterFaults([...'QATESONBRG'])).toEqual([
      { type: 'unaccompanied-letter', letter: 'Q', needs: ['U'] },
    ])
  })

  it('accepts a Q once a U is there to follow it', () => {
    expect(letterFaults([...'QUATESONBR'])).toEqual([])
  })

  it('rejects a duplicated rare letter', () => {
    expect(letterFaults([...'EPSTOWWE'])).toEqual([{ type: 'duplicate-rare-letter', letter: 'W' }])
  })

  it('reports each duplicated letter once, however many copies', () => {
    expect(letterFaults([...'WWWATESON'])).toEqual([{ type: 'duplicate-rare-letter', letter: 'W' }])
  })

  it('reports every distinct fault it finds', () => {
    expect(letterFaults([...'WWZZQATESON'])).toEqual([
      { type: 'duplicate-rare-letter', letter: 'W' },
      { type: 'duplicate-rare-letter', letter: 'Z' },
      { type: 'unaccompanied-letter', letter: 'Q', needs: ['U'] },
    ])
  })

  it('tolerates duplicates of ordinary letters', () => {
    expect(letterFaults([...'BANANA'])).toEqual([])
  })

  it('folds the board through the alphabet, so case does not matter', () => {
    expect(letterFaults([...'qatesonbrg'])).toEqual([
      { type: 'unaccompanied-letter', letter: 'Q', needs: ['U'] },
    ])
  })

  it('applies whatever rules the alphabet carries, not English ones', () => {
    // A made-up alphabet: no rare letters at all, and X is the letter that needs company.
    const invented: Alphabet = {
      id: 'test',
      endonym: 'Test',
      weights: { A: 1, X: 1, Y: 1, Z: 1 },
      vowels: ['A'],
      rareLetters: [],
      requires: { X: ['Y', 'Z'] },
      fold: (key) => key.toUpperCase(),
      segment: (word) => [...word],
    }
    expect(letterFaults([...'WWQQ'], invented)).toEqual([])
    expect(letterFaults([...'XAAA'], invented)).toEqual([
      { type: 'unaccompanied-letter', letter: 'X', needs: ['Y', 'Z'] },
    ])
    expect(letterFaults([...'XAAY'], invented)).toEqual([])
    expect(letterFaults([...'XAAZ'], invented)).toEqual([])
  })

  it('rejects a fair share of raw draws, so the generator has work to do', () => {
    let faulty = 0
    for (let seed = 1; seed <= 2000; seed++) {
      const [letters] = drawLetters(seedRng(seed * 7919), 12)
      if (letterFaults(letters).length > 0) faulty++
    }
    // Enough to matter, nowhere near enough to make generation expensive.
    expect(faulty / 2000).toBeGreaterThan(0.02)
    expect(faulty / 2000).toBeLessThan(0.25)
  })
})
