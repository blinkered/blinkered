import { describe, expect, it } from 'vitest'
import { configFor, createGame, replay } from '../src/index.js'
import { MAX_HIDES_PER_ROUND } from '../src/index.js'
import { WORDS, letter, play, submit, tap, tick } from './helpers.js'
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

/** A board with hiding on, and the seed a test can vary to get a different deal. */
function board(letters: string, overrides = {}, seed = 1) {
  const config = configFor('easy', {
    n: letters.length,
    holdTicks: 2,
    wildChance: 0,
    replaceChance: 0,
    hideChance: 1,
    ...overrides,
  })
  const [state, effects] = createGame({ config, letters: [...letters], seed })
  return { state, effects }
}

const hides = (effects: readonly Effect[]): readonly number[] =>
  effects.filter((effect) => effect.type === 'TILE_HIDDEN').map((effect) => effect.tileId)

const reveals = (effects: readonly Effect[]): readonly number[] =>
  effects.filter((effect) => effect.type === 'REVEALED').map((effect) => effect.tileId)

const exposed = (state: GameState): number =>
  state.tiles.filter((tile) => tile.revealed && !tile.spent).length

const faceDown = (state: GameState): readonly number[] =>
  state.tiles.filter((tile) => !tile.revealed && !tile.spent).map((tile) => tile.id)

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
    // One of the two that were showing is face down again, and it is face down in the only sense
    // the board has: there is nothing anywhere recording that it was ever up.
    expect(exposed(state)).toBe(1)
    expect(faceDown(state)).toContain(hides(effects)[0])
  })

  it('is indistinguishable from a letter the deal has not reached', () => {
    /*
     * The principle the mechanic is built on, in Nick's words: the state machine of the board
     * should be as independent as possible from the path used to arrive at a given state.
     *
     * So a withdrawn letter goes back into the same pool as every letter never dealt, and the
     * deal picks from that pool at random. Two earlier versions of this each imposed an order --
     * the withdrawn letter first, so it blinked back next tick, then last -- and both let a
     * player read the board for its own history. Nothing does now, and there is no field left in
     * the state to read.
     */
    const taken = play(board('ATESON').state, [tick, tick])
    const hidden = hides(taken.effects)[0]
    expect(hidden).toBeDefined()

    // Over many seeds the letter comes back at every point in the round rather than always next.
    const positions = new Set<number>()
    for (let seed = 1; seed <= 40; seed++) {
      const round = play(
        board('ATESON', {}, seed).state,
        Array.from({ length: 8 }, () => tick),
      )
      const went = hides(round.effects)[0]
      if (went === undefined) continue
      const order = reveals(round.effects)
      const back = order.indexOf(went, order.indexOf(went) + 1)
      positions.add(back === -1 ? -1 : back)
    }
    expect(positions.size).toBeGreaterThan(1)
  })

  it('takes at most one letter a round, however certain the chance', () => {
    // `hideChance` of 1 would take a letter every tick without the cap, and every hide makes the
    // round two ticks longer, so the cap is what keeps the chance safe to raise.
    const { state, effects } = play(
      board('ATESON').state,
      Array.from({ length: 9 }, () => tick),
    )
    expect(state.roundIndex).toBe(0)
    expect(MAX_HIDES_PER_ROUND).toBe(1)
    expect(hides(effects)).toHaveLength(1)
    expect(state.hidesThisRound).toBeLessThanOrEqual(MAX_HIDES_PER_ROUND)
  })

  it('shows every letter before the round ends, and the hold opens on a full board', () => {
    /*
     * What the added tick buys. A hide adds one and the reveal that brings the letter round again
     * spends one, so the round is two ticks longer and the window with everything showing is the
     * window the level always had. Two retunes went into setting that window and this leaves it
     * alone.
     */
    for (const hideChance of [0, 1]) {
      let state = board('ATESON', { hideChance }).state
      let cycles = 0
      let full = 0
      while (state.status === 'playing' && cycles < 40) {
        if (faceDown(state).length === 0) full += 1
        state = replay(state, [tick], WORDS).state
        cycles += 1
        if (state.roundIndex > 0) break
      }
      // Three, being `holdTicks` of two plus the tick the last letter lands on.
      expect(full, `hideChance ${String(hideChance)}`).toBe(3)
    }
  })

  it('never takes a letter that is selected', () => {
    /*
     * Selecting is a defensive move as well as a constructive one, and this is what makes it one.
     * The cost of changing your mind is that a selection cannot be reordered in place: clearing
     * it to spell something else unpins every letter in it, at the moment you meant to use them.
     */
    const opened = play(board('ATESON', { hideChance: 0 }).state, [tick, tick]).state
    const held = play(opened, [letter(opened.tiles.find((t) => t.revealed)?.letter ?? 'A')]).state
    expect(held.selection).toHaveLength(1)

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
    const dealt = play(board('ATE', { hideChance: 0, holdTicks: 2 }).state, [tick, tick]).state
    const full = play(
      dealt,
      dealt.tiles.map((tile) => tap(tile.id)),
    ).state
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

  it('forgets its budget when the next board is dealt', () => {
    const { state } = play(
      board('ATESON').state,
      Array.from({ length: 20 }, () => tick),
    )
    expect(state.roundIndex).toBeGreaterThan(0)
    expect(state.hidesThisRound).toBe(0)
  })

  it('does not end the game over a letter that is merely away', () => {
    /*
     * `stillToCome` decides both whether a round is dead and whether the game is over, and it
     * counts what is face down rather than what was dealt. Counted the other way, a letter going
     * away would read as a board that had run out of letters.
     */
    const opened = board('ATE', { hideChance: 1, minWordLength: 3, initialFlips: 40 }).state
    const { state } = play(opened, [tick, tick])
    expect(exposed(state)).toBe(1)
    expect(faceDown(state)).toHaveLength(2)
    expect(state.status).toBe('playing')
  })

  it('still replays identically from the same seed', () => {
    // Every roll comes off the seeded stream -- which letter hides, and which face-down letter
    // the next tick turns over -- which is what lets a server recompute a game rather than
    // believe it.
    const events = [tick, tick, tick, tick, submit, tick]
    const once = play(board('ATESON').state, events)
    const twice = play(board('ATESON').state, events)
    expect(once.state).toEqual(twice.state)
    expect(once.effects).toEqual(twice.effects)
  })
})

describe('the deal', () => {
  it('turns over a letter chosen from whatever is face down', () => {
    // Not a precomputed order: there is no order held in the state at all, so the board cannot be
    // read for what comes next any more than for what came before.
    const config = configFor('medium', { n: 9, wildChance: 0, replaceChance: 0, hideChance: 0 })
    const [opened] = createGame({ config, letters: [...'ATESONRIP'], seed: 7 })
    let state = opened
    const seen: number[] = []
    for (let i = 0; i < config.n - 1; i++) {
      const step = replay(state, [tick], WORDS)
      seen.push(...reveals(step.effects))
      state = step.state
    }
    // Every slot exactly once, and not in reading order.
    expect([...seen].sort((a, b) => a - b)).toHaveLength(config.n - 1)
    expect(new Set(seen).size).toBe(config.n - 1)
    expect(faceDown(state)).toHaveLength(0)
  })

  it('deals a different order from the same board on a different seed', () => {
    const config = configFor('medium', { n: 6, wildChance: 0, replaceChance: 0, hideChance: 0 })
    const order = (seed: number): readonly number[] => {
      const [opened, effects] = createGame({ config, letters: [...'ATESON'], seed })
      let state = opened
      const seen = [...reveals(effects)]
      for (let i = 0; i < config.n - 1; i++) {
        const step = replay(state, [tick], WORDS)
        seen.push(...reveals(step.effects))
        state = step.state
      }
      return seen
    }
    expect(order(3)).not.toEqual(order(4))
  })
})
