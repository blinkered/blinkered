import { alphabetFor } from './languages.js'
import { WILD_GLYPH } from './wild.js'
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

/**
 * The word currently under construction, in tap order.
 *
 * A wild shows its glyph, not the letter it is masking. That is not presentation, it is the
 * mechanic: the player is not supposed to know which letter is under there, and rendering
 * `tile.letter` here told them. It also made the word line disagree with the board, which showed
 * a card in the same position.
 */
export function selectedLetters(state: GameState): string {
  return state.selection
    .map((id) => {
      const tile = tileById(state, id)
      return tile.wild ? WILD_GLYPH : tile.letter
    })
    .join('')
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
 *
 * A wild is not showing the letter under it either, and leaving that out was a real leak rather
 * than an oversight of taste. Matching a card by `tile.letter` meant typing the masked letter
 * selected it and typing anything else did not, so the keyboard answered the one question the
 * whole mechanic rests on: twenty-six keystrokes read the mask, and you would hit it by accident
 * long before that. It also left no legitimate way to use a card from a keyboard, since the only
 * key that worked was the one you were not supposed to know. `freeWild` is the route now.
 */
export function letterAvailability(state: GameState, letter: string): LetterAvailability {
  const wanted = alphabetFor(state.config.language).fold(letter)
  const eligible = state.tiles
    .filter((tile) => !tile.wild && tile.letter === wanted && isEligible(tile))
    .sort((a, b) => a.position - b.position)
    .map((tile) => tile.id)
  return { eligible, selected: eligible.filter((id) => state.selection.includes(id)) }
}

/**
 * A card the keyboard can still take, in reading order, or nothing.
 *
 * Typing a letter takes a real tile bearing it if the board is showing one, and falls back to a
 * card. Falling back rather than preferring: a card is worth more than a letter, so spending one
 * while the letter itself is sitting there face up would be the interface making a bad trade on
 * the player's behalf.
 */
export function freeWild(state: GameState): number | undefined {
  return state.tiles
    .filter((tile) => tile.wild && isEligible(tile) && !state.selection.includes(tile.id))
    .sort((a, b) => a.position - b.position)
    .map((tile) => tile.id)[0]
}

/** Selected cards the player typed this letter onto, so the same key gives them back. */
export function wildsAskedFor(state: GameState, letter: string): number[] {
  const wanted = alphabetFor(state.config.language).fold(letter)
  return state.selection.filter((id) => state.wildIntent[id] === wanted)
}
