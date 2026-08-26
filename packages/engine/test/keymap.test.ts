import { describe, expect, it } from 'vitest'
import { keyToEvent } from '../src/index.js'
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
      for (const key of [' ', '1', 'F1', 'Shift', 'ArrowLeft', 'Tab', '-', 'å']) {
        expect(keyToEvent({ key }, scheme)).toBeNull()
      }
    })

    it(`clears every copy of a letter with the modifier under ${scheme}`, () => {
      expect(keyToEvent({ key: 'a', modified: true }, scheme)).toEqual({
        type: 'CLEAR_LETTER',
        letter: 'A',
      })
    })

    it(`upper-cases the letter under ${scheme}`, () => {
      expect(keyToEvent({ key: 'a' }, scheme)).toMatchObject({ letter: 'A' })
      expect(keyToEvent({ key: 'A' }, scheme)).toMatchObject({ letter: 'A' })
    })
  }
})

describe('the advance scheme', () => {
  it('takes the next copy and never clears', () => {
    expect(keyToEvent({ key: 'a' }, 'advance')).toEqual({ type: 'SELECT_LETTER', letter: 'A' })
  })
})

describe('the cycle scheme', () => {
  it('hands the whole decision to the reducer', () => {
    // Not SELECT or CLEAR: which of those it becomes depends on live game state, so the
    // keymap must not decide it from a snapshot.
    expect(keyToEvent({ key: 'a' }, 'cycle')).toEqual({ type: 'CYCLE_LETTER', letter: 'A' })
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
