import { letterAvailability } from './selection.js'
import type { GameEvent, GameState } from './types.js'

/**
 * How a bare letter key behaves when the board holds more than one of that letter.
 *
 * - `cycle`: A selects the first A, A again selects the second, and once every A is
 *   selected the next press clears them all.
 * - `modifier`: A always selects the next unselected A. Ctrl, Alt or Cmd plus A clears
 *   every selected A at once. Shift is not needed, since a bare press already advances.
 *
 * This is a keyboard ergonomics question, not a rules question, which is why it lives
 * out here rather than in the reducer. Both schemes are a user preference.
 */
export type KeyScheme = 'cycle' | 'modifier'

export interface KeyPress {
  /** As in KeyboardEvent.key. */
  readonly key: string
  readonly ctrl?: boolean
  readonly alt?: boolean
  readonly meta?: boolean
}

const LETTER = /^[a-z]$/i

/** Translates a keystroke into a game event, or null when the key means nothing here. */
export function keyToEvent(state: GameState, press: KeyPress, scheme: KeyScheme): GameEvent | null {
  switch (press.key) {
    case 'Enter':
      return { type: 'SUBMIT_WORD' }
    case 'Escape':
      return { type: 'RESET_WORD' }
    case 'Backspace':
      return { type: 'UNDO_LETTER' }
    default:
      break
  }
  if (!LETTER.test(press.key)) return null
  const letter = press.key.toUpperCase()

  if (scheme === 'modifier') {
    const clearing = press.ctrl === true || press.alt === true || press.meta === true
    return clearing ? { type: 'CLEAR_LETTER', letter } : { type: 'SELECT_LETTER', letter }
  }

  const { eligible, selected } = letterAvailability(state, letter)
  const exhausted = eligible.length > 0 && selected.length === eligible.length
  return exhausted ? { type: 'CLEAR_LETTER', letter } : { type: 'SELECT_LETTER', letter }
}
