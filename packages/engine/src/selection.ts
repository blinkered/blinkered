import { alphabetFor } from './alphabet.js'
import type { GameState, Tile } from './types.js'

/** A tile can be selected only while face up and unspent. */
export function isEligible(tile: Tile): boolean {
  return tile.revealed && !tile.spent
}

export function tileAt(state: GameState, position: number): Tile {
  const tile = state.tiles.find((candidate) => candidate.position === position)
  /* c8 ignore next 2 -- invariant: positions are always a permutation of 0..n-1 */
  if (!tile) throw new Error(`no tile at position ${String(position)}`)
  return tile
}

export function tileById(state: GameState, id: number): Tile {
  const tile = state.tiles[id]
  /* c8 ignore next 2 -- invariant: tiles is indexed by id and never resized */
  if (!tile) throw new Error(`no tile with id ${String(id)}`)
  return tile
}

/** The word currently under construction, in tap order. */
export function selectedLetters(state: GameState): string {
  return state.selection.map((id) => tileById(state, id).letter).join('')
}

export interface LetterAvailability {
  /** Eligible tile ids bearing this letter, in reading order. */
  readonly eligible: readonly number[]
  /** The subset already in the selection. */
  readonly selected: readonly number[]
}

/**
 * What the keyboard is allowed to know about a letter.
 *
 * Only revealed tiles count. If this consulted face-down tiles the keyboard would
 * become an oracle for the hidden board, which would dissolve the entire game.
 */
export function letterAvailability(state: GameState, letter: string): LetterAvailability {
  const wanted = alphabetFor(state.config.language).fold(letter)
  const eligible = state.tiles
    .filter((tile) => tile.letter === wanted && isEligible(tile))
    .sort((a, b) => a.position - b.position)
    .map((tile) => tile.id)
  return { eligible, selected: eligible.filter((id) => state.selection.includes(id)) }
}
