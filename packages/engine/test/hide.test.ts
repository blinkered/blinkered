import { describe, expect, it } from 'vitest'
import { configFor, createGame, replay } from '../src/index.js'
import { MAX_HIDES_PER_ROUND } from '../src/index.js'
import { WORDS, letter, play, submit, tick } from './helpers.js'
import type { Effect, GameState } from '../src/index.js'

/**
 * Letters that hide, which is the mechanic the game was named after and did not have.
 *
 * Until this rule the letters queued: every one of them was coming, in an order the grid could be
 * read for, and nothing on the board ever took itself away. Two rules together make the name
 * literal -- the deal walks the board in a shuffled order, and an exposed letter can turn back
 * over -- and the first is what makes the second invisible. Against a predictable sweep, a letter
 * that went back would be the only gap behind the front.
 */

/** A board dealt in reading order with hiding on, so a test can say which tile went where. */
function board(letters: string, overrides = {}, seed = 1) {
  const config = configFor('easy', {
    n: letters.length,
    holdTicks: 2,
    wildChance: 0,
    replaceChance: 0,
    hideChance: 1,
    ...overrides,
  })
  const [state, effects] = createGame({
    config,
    letters: [...letters],
    seed,
    revealOrder: [...letters].map((_, position) => position),
  })
  return { state, effects }
}

const hides = (effects: readonly Effect[]): readonly number[] =>
  effects.filter((effect) => effect.type === 'TILE_HIDDEN').map((effect) => effect.tileId)

const exposed = (state: GameState): number =>
  state.tiles.filter((tile) => tile.revealed && !tile.spent).length

describe('a letter turning back over', () => {
  it('adds a tick and hands back the flip the letter cost', () => {
    // The second tick is the first that can take one: a round opens with a single letter showing
    // and the board is never left with nothing on it, so the first tick only ever deals.
    const opened = play(board('ATESON').state, [tick]).state
    const before = { ticks: opened.ticksRemaining, flips: opened.flipsRemaining }
    const { state, effects } = play(opened, [tick])

    expect(hides(effects)).toHaveLength(1)
    expect(state.ticksRemaining).toBe(before.ticks + 1)
    expect(state.flipsRemaining).toBe(before.flips + 1)
    expect(state.withdrawn).toHaveLength(1)
    // One of the two that were showing is gone, and the deal has not moved on.
    expect(exposed(state)).toBe(1)
    expect(state.revealsThisRound).toBe(opened.revealsThisRound)
  })

  it('brings it back on the next tick, at the price it was refunded', () => {
    /*
     * The pair is a no-op on both counters, which is the whole shape of the mechanic: it cannot
     * shorten the window with the whole board up, because the letter is always back before the
     * deal is finished with. What it spends is time and the player's memory of the board.
     */
    const opened = play(board('ATESON').state, [tick]).state
    const before = { ticks: opened.ticksRemaining, flips: opened.flipsRemaining }
    const { state, effects } = play(opened, [tick, tick])

    expect(hides(effects)).toHaveLength(1)
    expect(state.withdrawn).toEqual([])
    expect(state.ticksRemaining).toBe(before.ticks)
    expect(state.flipsRemaining).toBe(before.flips)
    // The tile that came back is the one that went, and the deal has not moved on past it.
    const returned = effects.filter((effect) => effect.type === 'REVEALED').at(-1)
    expect(returned).toEqual({ type: 'REVEALED', tileId: hides(effects)[0] })
    expect(state.revealsThisRound).toBe(opened.revealsThisRound)
  })

  it('takes at most one letter a round, however certain the chance', () => {
    // `hideChance` of 1 would take a letter every tick without the cap, and every hide makes the
    // round two ticks longer, so the cap is what keeps the chance safe to raise.
    // Nine ticks, which is inside one round: six tiles and two hold ticks is an eight-tick round,
    // and the hide plus its return make this one ten.
    const { state, effects } = play(
      board('ATESON').state,
      Array.from({ length: 9 }, () => tick),
    )
    expect(state.roundIndex).toBe(0)
    expect(MAX_HIDES_PER_ROUND).toBe(1)
    expect(hides(effects)).toHaveLength(1)
    expect(state.hidesThisRound).toBeLessThanOrEqual(MAX_HIDES_PER_ROUND)
  })

  /** Ticks in one round with every letter showing at the moment the tick begins. */
  function ticksWithEverythingUp(state: GameState): number {
    let full = 0
    let cycles = 0
    while (state.status === 'playing' && cycles < 40) {
      if (state.revealsThisRound === state.config.n && state.withdrawn.length === 0) full += 1
      state = replay(state, [tick], WORDS).state
      cycles += 1
      if (state.roundIndex > 0) break
    }
    return full
  }

  it('does not shorten the window with the whole board up', () => {
    /*
     * The claim the mechanic rests on, and the reason it is safe to raise `hideChance` without
     * re-tuning the perception budget two retunes went into setting. A hide adds a tick and its
     * return spends one, so the letter is always back before the deal is finished with, and the
     * hold that follows is the hold the level always had. The round is two ticks longer instead.
     */
    const taking = board('ATESON', { hideChance: 1 }).state
    const still = board('ATESON', { hideChance: 0 }).state
    expect(ticksWithEverythingUp(taking)).toBe(ticksWithEverythingUp(still))
  })

  it('lengthens it by one when the letter is taken after the board is complete', () => {
    /*
     * Which is the honest other half, and it surprised me: a hide during the hold is *generous*
     * in time. The board was complete when the tick began, so that tick counts, and the tick the
     * hide added is spent bringing the letter back, after which the hold plays out in full.
     *
     * Measured over two hundred games it comes to about a tenth of a tick a round, because most
     * hides land during the deal where there is far more room for them. It is worth pinning
     * rather than rounding away, because "the window is exactly preserved" is the sort of claim
     * that gets quoted later.
     */
    const complete = play(board('ATESON', { hideChance: 0 }).state, [
      tick,
      tick,
      tick,
      tick,
      tick,
    ]).state
    expect(complete.revealsThisRound).toBe(complete.config.n)

    const taking = { ...complete, config: { ...complete.config, hideChance: 1 } }
    expect(ticksWithEverythingUp(taking)).toBe(ticksWithEverythingUp(complete) + 1)
  })

  it('never takes a letter that is selected', () => {
    /*
     * Selecting is a defensive move as well as a constructive one, and this is what makes it one.
     * The cost of changing your mind is that a selection cannot be reordered in place: clearing
     * it to spell something else unpins every letter in it, at the moment you meant to use them.
     */
    const opened = play(board('ATESON', { hideChance: 0 }).state, [tick, tick]).state
    const held = play(opened, [letter('A'), letter('T')]).state
    expect(held.selection).toHaveLength(2)

    const { state, effects } = replay(
      { ...held, config: { ...held.config, hideChance: 1 } },
      [tick],
      WORDS,
    )
    const taken = hides(effects)
    expect(taken).toHaveLength(1)
    expect(held.selection).not.toContain(taken[0])
    expect(state.selection).toEqual(held.selection)
  })

  it('does nothing when every letter showing is selected, and the tick behaves as any other', () => {
    // Otherwise a full selection would be a way to buy time: a tick that always hid would always
    // add a tick, and a player could hold the board still by holding every letter.
    const full = play(board('ATE', { hideChance: 0, holdTicks: 2 }).state, [
      tick,
      tick,
      letter('A'),
      letter('T'),
      letter('E'),
    ]).state
    expect(full.selection).toHaveLength(3)

    const { state, effects } = replay(
      { ...full, config: { ...full.config, hideChance: 1 } },
      [tick],
      WORDS,
    )
    expect(hides(effects)).toEqual([])
    expect(state.ticksRemaining).toBe(full.ticksRemaining - 1)
    expect(state.flipsRemaining).toBe(full.flipsRemaining)
  })

  it('never takes the last letter showing', () => {
    // A board with nothing on it is not a harder board, it is a broken one. One tile is up when
    // a round opens, so the first tick has nothing it may take.
    const { state, effects } = play(board('ATESON', { hideChance: 1 }).state, [])
    expect(exposed(state)).toBe(1)
    expect(hides(effects)).toEqual([])
  })

  it('does not hide at all on a level that does not', () => {
    const { effects } = play(
      board('ATESON', { hideChance: 0 }).state,
      Array.from({ length: 8 }, () => tick),
    )
    expect(hides(effects)).toEqual([])
    expect(configFor('easy').hideChance).toBe(0)
  })

  it('forgets what it took when the next board is dealt', () => {
    const { state } = play(
      board('ATESON').state,
      Array.from({ length: 20 }, () => tick),
    )
    expect(state.roundIndex).toBeGreaterThan(0)
    expect(state.hidesThisRound).toBe(0)
    expect(state.withdrawn).toEqual([])
  })

  it('does not end the game over a letter that is merely away', () => {
    /*
     * `stillToCome` decides both whether a round is dead and whether the game is over, and a
     * withdrawn letter is neither face up nor waiting to be dealt. Left out of that count, a
     * letter going away would read as a board that had run out of letters.
     */
    const opened = board('ATE', { hideChance: 1, minWordLength: 3, initialFlips: 40 }).state
    const { state } = play(opened, [tick, tick])
    // One letter away, one showing, one still to be dealt: below the three-letter floor on every
    // count that ignores the letter that is coming back.
    expect(state.withdrawn).toHaveLength(1)
    expect(state.tiles.filter((tile) => tile.revealed)).toHaveLength(1)
    expect(state.status).toBe('playing')
  })

  it('still replays identically from the same seed', () => {
    // The roll comes off the seeded stream like every other decision, which is what lets a server
    // recompute a game rather than believe it.
    const events = [tick, tick, tick, letter('A'), tick, submit, tick]
    const once = play(board('ATESON').state, events)
    const twice = play(board('ATESON').state, events)
    expect(once.state).toEqual(twice.state)
    expect(once.effects).toEqual(twice.effects)
  })
})

describe('the deal no longer walks the board in reading order', () => {
  it('shuffles the order, and covers every slot exactly once', () => {
    const config = configFor('medium', { n: 9, wildChance: 0, replaceChance: 0, hideChance: 0 })
    const [state] = createGame({ config, letters: [...'ATESONRIP'], seed: 7 })
    expect([...state.revealOrder].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(state.revealOrder).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('deals a fresh order every round', () => {
    const config = configFor('medium', { n: 6, wildChance: 0, replaceChance: 0, hideChance: 0 })
    const [opened] = createGame({ config, letters: [...'ATESON'], seed: 3 })
    const next = replay(
      opened,
      Array.from({ length: config.n + config.holdTicks }, () => tick),
      WORDS,
    ).state
    expect(next.roundIndex).toBe(1)
    expect(next.revealOrder).not.toEqual(opened.revealOrder)
    expect([...next.revealOrder].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('turns tiles over in that order and no other', () => {
    const config = configFor('medium', { n: 6, wildChance: 0, replaceChance: 0, hideChance: 0 })
    const [opened, effects] = createGame({ config, letters: [...'ATESON'], seed: 5 })
    const turned = [
      ...effects.filter((effect) => effect.type === 'REVEALED').map((effect) => effect.tileId),
    ]
    let state = opened
    for (let i = 0; i < config.n - 1; i++) {
      const step = replay(state, [tick], WORDS)
      state = step.state
      for (const effect of step.effects) {
        if (effect.type === 'REVEALED') turned.push(effect.tileId)
      }
    }
    // Position order, read through the round's own sequence.
    const byPosition = (position: number): number =>
      state.tiles.filter((tile) => tile.position === position).map((tile) => tile.id)[0] as number
    expect(turned).toEqual(opened.revealOrder.map(byPosition))
  })

  it('refuses an order that is not one position per tile', () => {
    expect(() =>
      createGame({
        config: configFor('easy', { n: 3 }),
        letters: [...'ATE'],
        seed: 1,
        revealOrder: [0, 1],
      }),
    ).toThrow(RangeError)
  })
})
