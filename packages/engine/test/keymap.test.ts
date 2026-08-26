import { describe, expect, it } from 'vitest'
import { keyToEvent } from '../src/index.js'
import type { GameState, KeyScheme } from '../src/index.js'
import { letter, open, play, tick } from './helpers.js'

const banana = (): GameState =>
  play(
    open('BANANA').state,
    Array.from({ length: 5 }, () => tick),
  ).state

const schemes: readonly KeyScheme[] = ['cycle', 'modifier']

describe('keys that mean the same thing in every scheme', () => {
  for (const scheme of schemes) {
    it(`maps Enter, Escape and Backspace under ${scheme}`, () => {
      const state = banana()
      expect(keyToEvent(state, { key: 'Enter' }, scheme)).toEqual({ type: 'SUBMIT_WORD' })
      expect(keyToEvent(state, { key: 'Escape' }, scheme)).toEqual({ type: 'RESET_WORD' })
      expect(keyToEvent(state, { key: 'Backspace' }, scheme)).toEqual({ type: 'UNDO_LETTER' })
    })

    it(`ignores keys that are not letters under ${scheme}`, () => {
      const state = banana()
      for (const key of [' ', '1', 'F1', 'Shift', 'ArrowLeft', 'Tab', '-']) {
        expect(keyToEvent(state, { key }, scheme)).toBeNull()
      }
    })
  }
})

describe('the modifier scheme', () => {
  it('advances to the next copy on a bare press', () => {
    const state = banana()
    expect(keyToEvent(state, { key: 'a' }, 'modifier')).toEqual({
      type: 'SELECT_LETTER',
      letter: 'A',
    })
  })

  it('clears every copy with ctrl, alt or cmd', () => {
    const state = play(banana(), [letter('A')]).state
    for (const press of [
      { key: 'a', ctrl: true },
      { key: 'a', alt: true },
      { key: 'a', meta: true },
    ]) {
      expect(keyToEvent(state, press, 'modifier')).toEqual({ type: 'CLEAR_LETTER', letter: 'A' })
    }
  })
})

describe('the cycle scheme', () => {
  it('keeps selecting while copies remain unselected', () => {
    let state = banana()
    for (let press = 0; press < 3; press++) {
      const event = keyToEvent(state, { key: 'A' }, 'cycle')
      expect(event).toEqual({ type: 'SELECT_LETTER', letter: 'A' })
      state = play(state, [letter('A')]).state
    }
    expect(state.selection).toEqual([1, 3, 5])
  })

  it('clears them all once every copy is selected', () => {
    const state = play(banana(), [letter('A'), letter('A'), letter('A')]).state
    expect(keyToEvent(state, { key: 'A' }, 'cycle')).toEqual({ type: 'CLEAR_LETTER', letter: 'A' })
  })

  it('leaves a letter that is not on the board to the reducer to refuse', () => {
    expect(keyToEvent(banana(), { key: 'z' }, 'cycle')).toEqual({
      type: 'SELECT_LETTER',
      letter: 'Z',
    })
  })
})
