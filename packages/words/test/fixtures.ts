import { ENGLISH } from '@flippy/engine'
import type { Alphabet } from '@flippy/engine'

/** A tiny alphabet with a digraph letter, to prove tiles are not characters. */
export const DIGRAPHS: Alphabet = {
  id: 'test-digraph',
  weights: { A: 4, I: 3, J: 2, IJ: 2, N: 3, S: 2 },
  vowels: ['A', 'I', 'IJ'],
  rareLetters: ['S'],
  requires: {},
  fold: (key) => key.toUpperCase(),
  segment: segmentGreedily(['IJ', 'A', 'I', 'J', 'N', 'S']),
}

function segmentGreedily(letters: readonly string[]): (word: string) => string[] {
  const ordered = [...letters].sort((a, b) => b.length - a.length)
  return (word) => {
    const tiles: string[] = []
    let at = 0
    while (at < word.length) {
      const letter = ordered.find((candidate) => word.startsWith(candidate, at))
      const tile = letter ?? word.slice(at, at + 1)
      tiles.push(tile)
      at += tile.length
    }
    return tiles
  }
}

export const WORDS = [
  'AT',
  'ATE',
  'EAT',
  'TEA',
  'SEAT',
  'EAST',
  'STONE',
  'NOTES',
  'ONSET',
  'ATONES',
  'QUIT',
  'ZZZ',
]

export { ENGLISH }
