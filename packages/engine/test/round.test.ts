import { describe, expect, it } from 'vitest'
import { letter, open, play, revealedLetters, submit, tick } from './helpers.js'
import type { Effect } from '../src/index.js'

const revealsIn = (effects: readonly Effect[]): number =>
  effects.filter((effect) => effect.type === 'REVEALED').length

describe('round lifecycle', () => {
  it('opens with one tile face up and the timer reading N', () => {
    const { state, effects } = open('ATESON')
    expect(state.ticksRemaining).toBe(6)
    expect(state.revealsThisRound).toBe(1)
    expect(revealedLetters(state)).toBe('A')
    expect(effects).toEqual([{ type: 'REVEALED', tileId: 0 }])
  })

  it('reveals in reading order, one per tick', () => {
    let current = open('ATESON').state
    const seen: string[] = [revealedLetters(current)]
    for (let i = 0; i < 5; i++) {
      current = play(current, [tick]).state
      seen.push(revealedLetters(current))
    }
    expect(seen).toEqual(['A', 'AT', 'ATE', 'ATES', 'ATESO', 'ATESON'])
  })

  it('shows the last tile with exactly one tick left', () => {
    const { state } = play(
      open('ATESON').state,
      Array.from({ length: 5 }, () => tick),
    )
    expect(state.ticksRemaining).toBe(1)
    expect(state.revealsThisRound).toBe(6)
  })

  it('runs a round for exactly N ticks, then shuffles', () => {
    const { state, effects } = play(
      open('ATESON').state,
      Array.from({ length: 6 }, () => tick),
    )
    const ended = effects.filter((effect) => effect.type === 'ROUND_ENDED')
    expect(ended).toHaveLength(1)
    expect(state.roundIndex).toBe(1)
    expect(state.ticksRemaining).toBe(6)
    expect(state.revealsThisRound).toBe(1)
  })

  it('hides and unspends everything at the shuffle, and re-lays the board', () => {
    const { state, effects } = play(
      open('ATESON').state,
      Array.from({ length: 6 }, () => tick),
    )
    expect(state.tiles.filter((t) => t.revealed)).toHaveLength(1)
    expect(state.tiles.every((t) => !t.spent)).toBe(true)
    const positions = [...state.tiles.map((t) => t.position)].sort((a, b) => a - b)
    expect(positions).toEqual([0, 1, 2, 3, 4, 5])
    const ended = effects.find((effect) => effect.type === 'ROUND_ENDED')
    expect(ended).toMatchObject({ flipsCharged: 0 })
    expect([...(ended?.type === 'ROUND_ENDED' ? ended.layout : [])].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5,
    ])
  })

  it('charges one flip per reveal', () => {
    const { state } = play(open('ATESON', { initialFlips: 100 }).state, [tick, tick])
    expect(state.flipsRemaining).toBe(97)
  })

  it('stops revealing once the flips run out, but still finishes the round', () => {
    const opened = open('ATESON', { initialFlips: 3 }).state
    expect(opened.flipsRemaining).toBe(2)
    const { state, effects } = play(
      opened,
      Array.from({ length: 4 }, () => tick),
    )
    expect(revealsIn(effects)).toBe(2)
    expect(state.revealsThisRound).toBe(3)
    expect(state.flipsRemaining).toBe(0)
    expect(state.status).toBe('playing')
  })

  it('ends the game when the flips are gone and the round completes', () => {
    const { state, effects } = play(
      open('ATESON', { initialFlips: 3 }).state,
      Array.from({ length: 6 }, () => tick),
    )
    expect(state.status).toBe('over')
    expect(state.flipsRemaining).toBe(0)
    expect(effects.at(-1)).toEqual({ type: 'GAME_OVER' })
  })

  it('holds the full board for holdTicks extra ticks', () => {
    const opened = open('ATESON', { holdTicks: 2 }).state
    expect(opened.ticksRemaining).toBe(8)
    const exposed = play(
      opened,
      Array.from({ length: 5 }, () => tick),
    )
    expect(exposed.state.revealsThisRound).toBe(6)
    expect(exposed.state.ticksRemaining).toBe(3)
    // Three ticks of a fully exposed board instead of one, and no further reveals.
    const held = play(exposed.state, [tick, tick])
    expect(revealsIn(held.effects)).toBe(0)
    expect(held.state.roundIndex).toBe(0)
    expect(held.state.ticksRemaining).toBe(1)
    const rolled = play(held.state, [tick])
    expect(rolled.state.roundIndex).toBe(1)
  })

  it('charges the same flips per round however long the hold', () => {
    const withHold = play(
      open('ATESON', { holdTicks: 4, initialFlips: 100 }).state,
      Array.from({ length: 10 }, () => tick),
    ).state
    const without = play(
      open('ATESON', { holdTicks: 0, initialFlips: 100 }).state,
      Array.from({ length: 6 }, () => tick),
    ).state
    expect(withHold.roundIndex).toBe(1)
    expect(without.roundIndex).toBe(1)
    expect(withHold.flipsRemaining).toBe(without.flipsRemaining)
  })

  it('carries the hold into every later round', () => {
    const second = play(
      open('ATESON', { holdTicks: 2 }).state,
      Array.from({ length: 8 }, () => tick),
    )
    expect(second.state.roundIndex).toBe(1)
    expect(second.state.ticksRemaining).toBe(8)
  })

  it('ends the moment the board goes dead, without running the timer down', () => {
    // Two letters up, no flips left to turn over a third, and a three-letter minimum.
    // Nothing the player does can matter, so the remaining ticks are dead time.
    const opened = open('ATESON', { initialFlips: 2 }).state
    expect(opened.flipsRemaining).toBe(1)
    const { state, effects } = play(opened, [tick])
    expect(revealedLetters(state)).toBe('AT')
    expect(state.status).toBe('over')
    expect(state.ticksRemaining).toBe(5)
    expect(effects.at(-1)).toEqual({ type: 'GAME_OVER' })
  })

  it('keeps going when exactly enough letters are exposed to spell something', () => {
    const { state } = play(open('ATESON', { initialFlips: 3 }).state, [tick, tick])
    expect(revealedLetters(state)).toBe('ATE')
    expect(state.flipsRemaining).toBe(0)
    expect(state.status).toBe('playing')
  })

  it('ends when a word spends the last letters it could have used', () => {
    // The word still scores. It just leaves nothing behind to play with.
    const exposed = play(open('ATESON', { initialFlips: 3, flipEconomy: 'none' }).state, [
      tick,
      tick,
    ]).state
    const { state, effects } = play(exposed, [letter('A'), letter('T'), letter('E'), submit])
    expect(state.score).toBe(2)
    expect(state.wordsFound.map((found) => found.word)).toEqual(['ATE'])
    expect(state.status).toBe('over')
    expect(effects.at(-1)).toEqual({ type: 'GAME_OVER' })
  })

  it('can be revived by a word that pays for more flips', () => {
    // Same position, but fibonacci pays two flips for ATE, so reveals resume.
    const exposed = play(open('ATESON', { initialFlips: 3 }).state, [tick, tick]).state
    const { state } = play(exposed, [letter('A'), letter('T'), letter('E'), submit])
    expect(state.status).toBe('playing')
    expect(state.flipsRemaining).toBe(2)
    expect(revealedLetters(play(state, [tick]).state)).toBe('S')
  })

  it('ignores every input once the game is over', () => {
    const over = play(
      open('ATESON', { initialFlips: 3 }).state,
      Array.from({ length: 6 }, () => tick),
    ).state
    const after = play(over, [tick, { type: 'SELECT_LETTER', letter: 'A' }])
    expect(after.state).toBe(over)
    expect(after.effects).toEqual([
      { type: 'INPUT_IGNORED', reason: 'game-over' },
      { type: 'INPUT_IGNORED', reason: 'game-over' },
    ])
  })
})
