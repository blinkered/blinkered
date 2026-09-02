import { describe, expect, it } from 'vitest'
import { alphabetFor, keyToEvent } from '../src/index.js'
import type { KeyScheme } from '../src/index.js'

const schemes: readonly KeyScheme[] = ['advance', 'cycle']

describe('keys that mean the same thing in every scheme', () => {
  for (const scheme of schemes) {
    it(`maps Enter, Escape and Backspace under ${scheme}`, () => {
      expect(keyToEvent({ key: 'Enter' }, scheme)).toEqual({ type: 'SUBMIT_WORD' })
      expect(keyToEvent({ key: 'Escape' }, scheme)).toEqual({ type: 'RESET_WORD' })
      expect(keyToEvent({ key: 'Backspace' }, scheme)).toEqual({ type: 'UNDO_LETTER' })
    })

    it(`ignores keys that are not letters under ${scheme}`, () => {
      for (const key of [' ', '1', 'F1', 'Shift', 'ArrowLeft', 'Tab', '-', '.']) {
        expect(keyToEvent({ key }, scheme)).toBeNull()
      }
    })

    it(`accepts letters outside the Latin alphabet under ${scheme}`, () => {
      // A Cyrillic, Croatian or Swedish keyboard produces keys a Latin-only test rejects.
      // Whether the letter is on the board is the reducer's business, not the keymap's.
      for (const key of ['я', 'č', 'ö', 'ñ', 'ı', 'İ']) {
        expect(keyToEvent({ key }, scheme)).toMatchObject({ letter: key })
      }
    })

    it(`clears every copy of a letter with the modifier under ${scheme}`, () => {
      expect(keyToEvent({ key: 'a', modified: true }, scheme)).toEqual({
        type: 'CLEAR_LETTER',
        letter: 'a',
      })
    })

    it(`passes the letter through as pressed under ${scheme}`, () => {
      // Case belongs to the alphabet, not to the keymap. See the Turkish case below.
      expect(keyToEvent({ key: 'a' }, scheme)).toMatchObject({ letter: 'a' })
      expect(keyToEvent({ key: 'A' }, scheme)).toMatchObject({ letter: 'A' })
    })
  }
})

describe('the advance scheme', () => {
  it('takes the next copy and never clears', () => {
    expect(keyToEvent({ key: 'a' }, 'advance')).toEqual({ type: 'SELECT_LETTER', letter: 'a' })
  })
})

describe('the cycle scheme', () => {
  it('hands the whole decision to the reducer', () => {
    // Not SELECT or CLEAR: which of those it becomes depends on live game state, so the
    // keymap must not decide it from a snapshot.
    expect(keyToEvent({ key: 'a' }, 'cycle')).toEqual({ type: 'CYCLE_LETTER', letter: 'a' })
  })
})

describe('what the keymap deliberately does not know', () => {
  it('needs no game state, so identical keystrokes always map identically', () => {
    // The regression this guards: typing ALIAS gave different results depending on whether
    // the view had re-rendered between keystrokes, because the old keymap read a snapshot.
    const first = 'ALIAS'.split('').map((key) => keyToEvent({ key }, 'cycle'))
    const second = 'ALIAS'.split('').map((key) => keyToEvent({ key }, 'cycle'))
    expect(first).toEqual(second)
    expect(first).toEqual([
      { type: 'CYCLE_LETTER', letter: 'A' },
      { type: 'CYCLE_LETTER', letter: 'L' },
      { type: 'CYCLE_LETTER', letter: 'I' },
      { type: 'CYCLE_LETTER', letter: 'A' },
      { type: 'CYCLE_LETTER', letter: 'S' },
    ])
  })
})

describe('the key as pressed', () => {
  /*
   * The keymap does not upper-case, and Turkish is why.
   *
   * `toUpperCase` sends both the dotless ı and the dotted i to a plain I, so upper-casing here
   * would hand the reducer one letter for two keys, and a board holding both tiles would give
   * the wrong one. Every consumer folds through the game's alphabet, which knows the language.
   */
  it('passes a Turkish dotted i through unchanged', () => {
    expect(keyToEvent({ key: 'i' }, 'cycle')).toEqual({ type: 'CYCLE_LETTER', letter: 'i' })
    expect(keyToEvent({ key: 'ı' }, 'cycle')).toEqual({ type: 'CYCLE_LETTER', letter: 'ı' })
  })

  it('leaves the two apart once the Turkish alphabet has folded them', () => {
    const turkish = alphabetFor('tr')
    const of = (key: string): string => {
      const event = keyToEvent({ key }, 'cycle')
      return turkish.fold((event as { letter: string }).letter)
    }
    expect(of('i')).toBe('İ')
    expect(of('ı')).toBe('I')
  })
})
