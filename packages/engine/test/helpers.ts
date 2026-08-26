import { configFor, createGame, replay } from '../src/index.js'
import type { Dictionary, Effect, GameConfig, GameEvent, GameState } from '../src/index.js'

export function dictionaryOf(...words: readonly string[]): Dictionary {
  const set = new Set(words.map((word) => word.toUpperCase()))
  return { has: (word) => set.has(word) }
}

/** Enough of the language to exercise the rules without depending on @flippy/words. */
export const WORDS = dictionaryOf(
  'AT',
  'AS',
  'AN',
  'ON',
  'NO',
  'SO',
  'TO',
  'OR',
  'IT',
  'ATE',
  'EAT',
  'TEA',
  'SEA',
  'SET',
  'TEN',
  'NET',
  'ONE',
  'SON',
  'TON',
  'NOT',
  'OAT',
  'ANT',
  'TAN',
  'NAP',
  'PAN',
  'TOE',
  'NOR',
  'ROT',
  'TOR',
  'OAR',
  'EAR',
  'ERA',
  'ARE',
  'TAR',
  'RAT',
  'ART',
  'EAT',
  'TEAS',
  'SEAT',
  'EAST',
  'EATS',
  'NOTE',
  'TONE',
  'OATS',
  'ANTS',
  'PANT',
  'RATE',
  'TEAR',
  'NEAR',
  'STONE',
  'NOTES',
  'ONSET',
  'TONES',
  'ATONE',
  'OATEN',
  'PANTS',
  'RATES',
  'ATONES',
  'PRIEST',
  'ESPRIT',
  'SPRITE',
  'STRIPE',
  'RIPEST',
  'PANTERS',
  'PARENTS',
  'TREPANS',
)

export interface Harness {
  readonly state: GameState
  readonly effects: readonly Effect[]
}

/** Opens a game on an exact board. Letters are given, never drawn, so tests are legible. */
export function open(letters: string, overrides: Partial<GameConfig> = {}, seed = 1): Harness {
  const config = configFor('easy', { n: letters.length, holdTicks: 0, ...overrides })
  const [state, effects] = createGame({ config, letters: [...letters], seed })
  return { state, effects }
}

export function play(
  state: GameState,
  events: readonly GameEvent[],
  dictionary: Dictionary = WORDS,
): Harness {
  return replay(state, events, dictionary)
}

export const tick: GameEvent = { type: 'TICK' }
export const submit: GameEvent = { type: 'SUBMIT_WORD' }
export const resetWord: GameEvent = { type: 'RESET_WORD' }
export const undo: GameEvent = { type: 'UNDO_LETTER' }
export const letter = (value: string): GameEvent => ({ type: 'SELECT_LETTER', letter: value })
export const clearLetter = (value: string): GameEvent => ({ type: 'CLEAR_LETTER', letter: value })
export const tap = (tileId: number): GameEvent => ({ type: 'TAP_TILE', tileId })

/** Ticks until the board is fully exposed, which is the tick before the round ends. */
export function ticksToFullBoard(n: number): GameEvent[] {
  return Array.from({ length: n - 1 }, () => tick)
}

export function revealedLetters(state: GameState): string {
  return state.tiles
    .filter((t) => t.revealed)
    .sort((a, b) => a.position - b.position)
    .map((t) => t.letter)
    .join('')
}

export function spell(...letters: readonly string[]): GameEvent[] {
  return letters.map((value) => letter(value))
}
