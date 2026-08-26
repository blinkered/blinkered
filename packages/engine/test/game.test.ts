import { describe, expect, it } from 'vitest'
import { configFor, createGame, reduce, replay } from '../src/index.js'
import type { GameEvent } from '../src/index.js'
import { WORDS, letter, open, play, submit, tick } from './helpers.js'

describe('createGame', () => {
  it('refuses a board smaller than two tiles', () => {
    expect(() =>
      createGame({ config: configFor('easy', { n: 1 }), letters: ['A'], seed: 1 }),
    ).toThrow(RangeError)
  })

  it('refuses a letter count that disagrees with the config', () => {
    expect(() =>
      createGame({ config: configFor('easy', { n: 6 }), letters: [...'ABC'], seed: 1 }),
    ).toThrow(/expected 6 letters, got 3/)
  })

  it('refuses a minimum word length below two', () => {
    expect(() =>
      createGame({
        config: configFor('easy', { n: 3, minWordLength: 1 }),
        letters: [...'ATE'],
        seed: 1,
      }),
    ).toThrow(RangeError)
  })

  it('refuses a game with no flips to spend', () => {
    expect(() =>
      createGame({
        config: configFor('easy', { n: 3, initialFlips: 0 }),
        letters: [...'ATE'],
        seed: 1,
      }),
    ).toThrow(RangeError)
  })

  it('refuses a fractional hold', () => {
    expect(() =>
      createGame({
        config: configFor('easy', { n: 3, holdTicks: 1.5 }),
        letters: [...'ATE'],
        seed: 1,
      }),
    ).toThrow(/holdTicks must be an integer/)
  })

  it('refuses a negative hold', () => {
    expect(() =>
      createGame({
        config: configFor('easy', { n: 3, holdTicks: -1 }),
        letters: [...'ATE'],
        seed: 1,
      }),
    ).toThrow(/holdTicks cannot be negative/)
  })

  it('opens an already-dead game when there is only one flip to spend', () => {
    const config = configFor('easy', { n: 6, initialFlips: 1 })
    const [state, effects] = createGame({ config, letters: [...'ATESON'], seed: 1 })
    expect(state.flipsRemaining).toBe(0)
    expect(state.status).toBe('over')
    expect(effects).toEqual([{ type: 'REVEALED', tileId: 0 }, { type: 'GAME_OVER' }])
  })

  it('normalises letters to upper case', () => {
    const [state] = createGame({
      config: configFor('easy', { n: 3 }),
      letters: [...'ate'],
      seed: 1,
    })
    expect(state.tiles.map((tile) => tile.letter)).toEqual(['A', 'T', 'E'])
  })
})

describe('replay', () => {
  const events: readonly GameEvent[] = [
    tick,
    tick,
    letter('A'),
    letter('T'),
    letter('E'),
    submit,
    tick,
    tick,
    tick,
    tick,
  ]

  it('agrees with stepping the reducer by hand', () => {
    const start = open('ATESON').state
    let byHand = start
    for (const event of events) {
      byHand = reduce(byHand, event, WORDS)[0]
    }
    expect(replay(start, events, WORDS).state).toEqual(byHand)
  })

  it('is deterministic for a seed', () => {
    const first = play(open('ATESON', {}, 12345).state, events)
    const second = play(open('ATESON', {}, 12345).state, events)
    expect(first.state).toEqual(second.state)
    expect(first.effects).toEqual(second.effects)
  })

  it('diverges on a different seed once the board has shuffled', () => {
    const first = play(open('ATESON', {}, 1).state, events)
    const second = play(open('ATESON', {}, 2).state, events)
    expect(first.state.tiles.map((t) => t.position)).not.toEqual(
      second.state.tiles.map((t) => t.position),
    )
  })

  it('returns the state untouched for an empty log', () => {
    const start = open('ATESON').state
    expect(replay(start, [], WORDS)).toEqual({ state: start, effects: [] })
  })
})
