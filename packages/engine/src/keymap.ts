import type { GameEvent } from './types.js'

/**
 * What a bare letter key does when the board holds several copies of that letter.
 *
 * - `cycle` (default): with N copies of A on the board, each of the first N presses takes
 *   one of them and the N+1th cancels them all. Typing ALIAS against a board holding one A
 *   goes A, AL, ALI, LI, LIS. The word being built is on screen throughout, so the
 *   cancellation is visible and needs no announcing.
 * - `advance`: the first N presses behave identically, and the N+1th does nothing. Typing is
 *   never destructive, at the cost of losing one-key cancelling.
 *
 * Either way the clear modifier clears every copy of a letter at once.
 */
export type KeyScheme = 'cycle' | 'advance'

export interface KeyPress {
  /** As in KeyboardEvent.key. */
  readonly key: string
  /**
   * The clear modifier was held. Shift in a browser, because macOS turns Option into an
   * accented character and Ctrl and Cmd belong to the browser; Ctrl in a terminal.
   */
  readonly modified?: boolean
}

/**
 * Any single-character key that is not punctuation or a control name.
 *
 * Deliberately not a Latin range: Cyrillic, Croatian and Swedish letters are all keys a
 * player will press, and the keymap has no business deciding which characters count as
 * letters in a language it knows nothing about. `letterAvailability` folds the key through
 * the game's alphabet and reports no-such-letter if it is not on the board, which is the
 * same answer an unknown character deserves.
 */
const LETTER = /^\p{L}$/u

/**
 * Translates a keystroke into an intent, or null when the key means nothing here.
 *
 * Deliberately knows nothing about the game. Choosing between taking another copy and
 * clearing them all depends on live state, so the reducer makes that call: a view choosing
 * from a snapshot gives different answers depending on whether it re-rendered between two
 * keystrokes, which is exactly the kind of bug that only appears when someone types fast.
 */
export function keyToEvent(press: KeyPress, scheme: KeyScheme): GameEvent | null {
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

  if (press.modified === true) return { type: 'CLEAR_LETTER', letter }
  return scheme === 'cycle' ? { type: 'CYCLE_LETTER', letter } : { type: 'SELECT_LETTER', letter }
}
