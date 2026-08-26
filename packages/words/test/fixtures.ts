import { ENGLISH } from '@blinkered/engine'
import type { Alphabet } from '@blinkered/engine'

/** A tiny alphabet with a digraph letter, to prove tiles are not characters. */
export const DIGRAPHS: Alphabet = {
  id: 'test-digraph',
  endonym: 'Digraphish',
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

/**
 * A deliberately miniature language: seven letters, and words spelled only from them.
 *
 * Generation tests need a board to actually admit words, which used to mean reading
 * /usr/share/dict/words. That file exists on macOS and not on a Linux CI runner, so the
 * suite passed locally and failed the moment it was pushed. Shrinking the language instead
 * keeps the tests hermetic, deterministic and fast.
 */
export const MINI: Alphabet = {
  id: 'test-mini',
  endonym: 'Miniature',
  weights: { A: 8, E: 9, O: 5, N: 6, R: 6, S: 6, T: 7 },
  vowels: ['A', 'E', 'O'],
  rareLetters: ['R'],
  requires: {},
  fold: (key) => key.toUpperCase(),
  segment: (word) => [...word],
}

/** Everything MINI can spell, more or less. Lengths 3 to 7, so ceilings are reachable. */
export const MINI_WORDS = [
  'ANT',
  'ART',
  'ATE',
  'EAR',
  'EAT',
  'EON',
  'ERA',
  'NET',
  'NOR',
  'NOT',
  'OAR',
  'OAT',
  'ONE',
  'ORE',
  'RAT',
  'ROE',
  'ROT',
  'SAT',
  'SEA',
  'SET',
  'SON',
  'TAN',
  'TAR',
  'TEA',
  'TEN',
  'TOE',
  'TON',
  'TOR',
  'ANTE',
  'ANTS',
  'ARTS',
  'EARN',
  'EAST',
  'EATS',
  'NEAR',
  'NOSE',
  'NOTE',
  'OATS',
  'ONES',
  'RANT',
  'RATE',
  'RATS',
  'RENT',
  'ROSE',
  'ROTE',
  'SANE',
  'SEAT',
  'SORE',
  'STAR',
  'TARE',
  'TARS',
  'TEAR',
  'TERN',
  'TOES',
  'TONE',
  'TORE',
  'ATONE',
  'ASTER',
  'NOTES',
  'OATEN',
  'ONSET',
  'RATES',
  'ROAST',
  'SNORE',
  'STARE',
  'STONE',
  'TAROS',
  'TEARS',
  'TENOR',
  'TONER',
  'TONES',
  'ATONES',
  'ORNATE',
  'STONER',
  'TENORS',
  'SENATOR',
  'TREASON',
]
