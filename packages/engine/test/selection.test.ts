import { describe, expect, it } from 'vitest'
import { clearLetter, letter, open, play, resetWord, tap, tick, undo } from './helpers.js'
import { letterAvailability, selectedLetters } from '../src/index.js'
import type { GameState } from '../src/index.js'

/** BANANA gives three A's and two N's, which is where the keyboard rules earn their keep. */
const banana = (): GameState =>
  play(
    open('BANANA').state,
    Array.from({ length: 5 }, () => tick),
  ).state

describe('tapping tiles', () => {
  it('selects an exposed tile', () => {
    const { state, effects } = play(banana(), [tap(1)])
    expect(state.selection).toEqual([1])
    expect(effects).toEqual([{ type: 'SELECTED', tileId: 1 }])
  })

  it('undoes the most recent tile when tapped again', () => {
    const { state, effects } = play(banana(), [tap(1), tap(2), tap(2)])
    expect(state.selection).toEqual([1])
    expect(effects.at(-1)).toEqual({ type: 'DESELECTED', tileIds: [2] })
  })

  it('refuses to disturb a tile from the middle of the word', () => {
    const { state, effects } = play(banana(), [tap(1), tap(2), tap(3), tap(2)])
    expect(state.selection).toEqual([1, 2, 3])
    expect(effects.at(-1)).toEqual({ type: 'INPUT_IGNORED', reason: 'already-selected' })
  })

  it('ignores a face-down tile', () => {
    const { state, effects } = play(open('BANANA').state, [tap(3)])
    expect(state.selection).toEqual([])
    expect(effects).toEqual([{ type: 'INPUT_IGNORED', reason: 'not-tappable' }])
  })

  it('ignores a tile id that does not exist', () => {
    const { effects } = play(banana(), [tap(99), tap(-1)])
    expect(effects).toEqual([
      { type: 'INPUT_IGNORED', reason: 'not-tappable' },
      { type: 'INPUT_IGNORED', reason: 'not-tappable' },
    ])
  })
})

describe('typing letters', () => {
  it('takes the first matching tile in reading order', () => {
    const { state } = play(banana(), [letter('a')])
    expect(state.selection).toEqual([1])
  })

  it('advances to the next matching tile on each press', () => {
    const { state } = play(banana(), [letter('A'), letter('A'), letter('A')])
    expect(state.selection).toEqual([1, 3, 5])
    expect(selectedLetters(state)).toBe('AAA')
  })

  it('reports when every matching tile is already spoken for', () => {
    const { effects } = play(banana(), [letter('A'), letter('A'), letter('A'), letter('A')])
    expect(effects.at(-1)).toEqual({ type: 'INPUT_IGNORED', reason: 'already-selected' })
  })

  it('interleaves letters in typing order, so repeated letters spell correctly', () => {
    const { state } = play(banana(), [
      letter('B'),
      letter('A'),
      letter('N'),
      letter('A'),
      letter('N'),
      letter('A'),
    ])
    expect(selectedLetters(state)).toBe('BANANA')
  })

  it('says nothing about letters that are still face down', () => {
    // The T of ATE sits at position 1 and has not been revealed yet. If the keyboard
    // answered here it would be an oracle for the hidden board.
    const { state, effects } = play(open('ATE').state, [letter('T')])
    expect(state.selection).toEqual([])
    expect(effects).toEqual([{ type: 'INPUT_IGNORED', reason: 'no-such-letter' }])
  })

  it('says nothing about letters that are not on the board at all', () => {
    const { effects } = play(banana(), [letter('Z')])
    expect(effects).toEqual([{ type: 'INPUT_IGNORED', reason: 'no-such-letter' }])
  })

  it('follows position, not tile id, after a shuffle', () => {
    const shuffled = play(
      banana(),
      Array.from({ length: 6 }, () => tick),
    ).state
    const exposed = play(
      shuffled,
      Array.from({ length: 5 }, () => tick),
    ).state
    const { state } = play(exposed, [letter('A')])
    const chosen = state.tiles[state.selection[0] as number]
    const aPositions = exposed.tiles.filter((t) => t.letter === 'A').map((t) => t.position)
    expect(chosen?.position).toBe(Math.min(...aPositions))
  })
})

describe('clearing letters', () => {
  it('drops every selected copy of a letter at once', () => {
    const { state, effects } = play(banana(), [
      letter('B'),
      letter('A'),
      letter('N'),
      letter('A'),
      clearLetter('A'),
    ])
    expect(selectedLetters(state)).toBe('BN')
    expect(effects.at(-1)).toEqual({ type: 'DESELECTED', tileIds: [1, 3] })
  })

  it('leaves the rest of the word in order', () => {
    const { state } = play(banana(), [
      letter('B'),
      letter('A'),
      letter('N'),
      letter('A'),
      letter('N'),
      clearLetter('N'),
    ])
    expect(selectedLetters(state)).toBe('BAA')
  })

  it('reports when that letter is not in the word', () => {
    const { effects } = play(banana(), [letter('B'), clearLetter('A')])
    expect(effects.at(-1)).toEqual({ type: 'INPUT_IGNORED', reason: 'nothing-selected' })
  })
})

describe('undo and reset', () => {
  it('undo drops the last letter only', () => {
    const { state, effects } = play(banana(), [letter('B'), letter('A'), undo])
    expect(selectedLetters(state)).toBe('B')
    expect(effects.at(-1)).toEqual({ type: 'DESELECTED', tileIds: [1] })
  })

  it('undo on an empty word is a no-op', () => {
    const { effects } = play(banana(), [undo])
    expect(effects).toEqual([{ type: 'INPUT_IGNORED', reason: 'nothing-selected' }])
  })

  it('reset clears the whole word', () => {
    const { state, effects } = play(banana(), [letter('B'), letter('A'), letter('N'), resetWord])
    expect(state.selection).toEqual([])
    expect(effects.at(-1)).toEqual({ type: 'DESELECTED', tileIds: [0, 1, 2] })
  })

  it('reset on an empty word is a no-op', () => {
    const { effects } = play(banana(), [resetWord])
    expect(effects).toEqual([{ type: 'INPUT_IGNORED', reason: 'nothing-selected' }])
  })
})

describe('letterAvailability', () => {
  it('reports eligible and selected tiles for a letter', () => {
    const state = play(banana(), [letter('A')]).state
    expect(letterAvailability(state, 'A')).toEqual({ eligible: [1, 3, 5], selected: [1] })
  })

  it('is case insensitive', () => {
    expect(letterAvailability(banana(), 'b')).toEqual({ eligible: [0], selected: [] })
  })
})

describe('cycling a letter', () => {
  it('advances through every copy, then clears them all', () => {
    let current = banana()
    const seen: string[] = []
    for (let press = 0; press < 4; press++) {
      current = play(current, [{ type: 'CYCLE_LETTER', letter: 'A' }]).state
      seen.push(selectedLetters(current))
    }
    expect(seen).toEqual(['A', 'AA', 'AAA', ''])
  })

  it('is resolved against live state, not against a snapshot', () => {
    // The ALIAS regression: one A on the board, and typing A twice used to clear it. The
    // decision now happens inside the reducer, so the result cannot depend on when the view
    // last re-rendered.
    const oneA = play(
      open('ALISX').state,
      Array.from({ length: 4 }, () => tick),
    ).state
    const once = play(oneA, [{ type: 'CYCLE_LETTER', letter: 'A' }]).state
    expect(selectedLetters(once)).toBe('A')
    const twice = play(once, [{ type: 'CYCLE_LETTER', letter: 'A' }]).state
    expect(selectedLetters(twice)).toBe('')
  })

  it('under advance, a letter the board cannot supply again is simply refused', () => {
    // Same position, but SELECT_LETTER never destroys what is already in the word.
    const oneA = play(
      open('ALISX').state,
      Array.from({ length: 4 }, () => tick),
    ).state
    const once = play(oneA, [letter('A')]).state
    const again = play(once, [letter('A')])
    expect(selectedLetters(again.state)).toBe('A')
    expect(again.effects.at(-1)).toEqual({ type: 'INPUT_IGNORED', reason: 'already-selected' })
  })

  it('reports a letter that is not up at all', () => {
    const { effects } = play(banana(), [{ type: 'CYCLE_LETTER', letter: 'Z' }])
    expect(effects).toEqual([{ type: 'INPUT_IGNORED', reason: 'no-such-letter' }])
  })
})
