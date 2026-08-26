import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { createGame, isEligible, replay, wordScore } from '../src/index.js'
import type { Effect, GameEvent, GameState, WordCompleteMode } from '../src/index.js'
import { WORDS } from './helpers.js'
import { configFor } from '../src/index.js'

const BOARD = 'ATESONBRUGP'
const KEYS = [...'ATESONBRUGPZ']

const anEvent: fc.Arbitrary<GameEvent> = fc.oneof(
  { weight: 4, arbitrary: fc.constant<GameEvent>({ type: 'TICK' }) },
  { weight: 2, arbitrary: fc.constant<GameEvent>({ type: 'SUBMIT_WORD' }) },
  { weight: 1, arbitrary: fc.constant<GameEvent>({ type: 'RESET_WORD' }) },
  { weight: 1, arbitrary: fc.constant<GameEvent>({ type: 'UNDO_LETTER' }) },
  {
    weight: 8,
    arbitrary: fc
      .constantFrom(...KEYS)
      .map((value): GameEvent => ({ type: 'SELECT_LETTER', letter: value })),
  },
  {
    weight: 2,
    arbitrary: fc
      .constantFrom(...KEYS)
      .map((value): GameEvent => ({ type: 'CLEAR_LETTER', letter: value })),
  },
  {
    weight: 2,
    arbitrary: fc
      .integer({ min: -2, max: BOARD.length + 2 })
      .map((tileId): GameEvent => ({ type: 'TAP_TILE', tileId })),
  },
)

const aGame = fc.record({
  seed: fc.integer(),
  holdTicks: fc.integer({ min: 0, max: 3 }),
  mode: fc.constantFrom<WordCompleteMode>('shuffle', 'spend', 'keep'),
  chargeFullRound: fc.boolean(),
  initialFlips: fc.integer({ min: 1, max: 60 }),
  events: fc.array(anEvent, { maxLength: 250 }),
})

interface Run {
  readonly state: GameState
  readonly effects: readonly Effect[]
  readonly initialFlips: number
}

function runGame(sample: {
  seed: number
  holdTicks: number
  mode: WordCompleteMode
  chargeFullRound: boolean
  initialFlips: number
  events: readonly GameEvent[]
}): Run {
  const config = configFor('easy', {
    n: BOARD.length,
    holdTicks: sample.holdTicks,
    wordCompleteMode: sample.mode,
    chargeFullRound: sample.chargeFullRound,
    initialFlips: sample.initialFlips,
  })
  const [start, opening] = createGame({ config, letters: [...BOARD], seed: sample.seed })
  const { state, effects } = replay(start, sample.events, WORDS)
  return { state, effects: [...opening, ...effects], initialFlips: sample.initialFlips }
}

describe('invariants that must hold for any sequence of inputs', () => {
  it('never lets the flip counter go negative', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        expect(runGame(sample).state.flipsRemaining).toBeGreaterThanOrEqual(0)
      }),
    )
  })

  it('balances the flip ledger exactly', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        const { state, effects, initialFlips } = runGame(sample)
        const revealed = effects.filter((e) => e.type === 'REVEALED').length
        const charged = effects.reduce(
          (sum, e) => (e.type === 'ROUND_ENDED' ? sum + e.flipsCharged : sum),
          0,
        )
        const earned = effects.reduce(
          (sum, e) => (e.type === 'WORD_ACCEPTED' ? sum + e.flips : sum),
          0,
        )
        expect(state.flipsRemaining).toBe(initialFlips - revealed - charged + earned)
      }),
    )
  })

  it('only ever holds a selection of distinct, selectable tiles', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        const { state } = runGame(sample)
        expect(new Set(state.selection).size).toBe(state.selection.length)
        for (const id of state.selection) {
          const tile = state.tiles[id]
          expect(tile).toBeDefined()
          expect(isEligible(tile!)).toBe(true)
        }
      }),
    )
  })

  it('keeps the score equal to the sum of its words', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        const { state } = runGame(sample)
        const total = state.wordsFound.reduce((sum, found) => sum + found.points, 0)
        expect(state.score).toBe(total)
        for (const found of state.wordsFound) {
          expect(found.points).toBe(wordScore(found.length))
        }
      }),
    )
  })

  it('never credits the same word twice', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        const words = runGame(sample).state.wordsFound.map((found) => found.word)
        expect(new Set(words).size).toBe(words.length)
      }),
    )
  })

  it('never accepts a word shorter than the minimum', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        const { state } = runGame(sample)
        for (const found of state.wordsFound) {
          expect(found.length).toBeGreaterThanOrEqual(state.config.minWordLength)
        }
      }),
    )
  })

  it('keeps the board a well-formed grid', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        const { state } = runGame(sample)
        const positions = state.tiles.map((tile) => tile.position).sort((a, b) => a - b)
        expect(positions).toEqual(state.tiles.map((_, index) => index))
        expect(state.tiles.map((tile) => tile.letter).join('')).toHaveLength(BOARD.length)
      }),
    )
  })

  it('keeps the timer and the reveal count inside the round', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        const { state } = runGame(sample)
        expect(state.revealsThisRound).toBeLessThanOrEqual(state.config.n)
        if (state.status === 'playing') {
          expect(state.ticksRemaining).toBeGreaterThan(0)
          expect(state.ticksRemaining).toBeLessThanOrEqual(state.config.n + state.config.holdTicks)
        }
      }),
    )
  })

  it('always runs out of flips if the player only watches', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        let state = runGame(sample).state
        let ticks = 0
        while (state.status === 'playing') {
          state = replay(state, [{ type: 'TICK' }], WORDS).state
          ticks += 1
          expect(ticks).toBeLessThan(2000)
        }
        expect(state.flipsRemaining).toBe(0)
      }),
    )
  })

  it('stays over once it is over', () => {
    fc.assert(
      fc.property(aGame, fc.array(anEvent, { maxLength: 20 }), (sample, more) => {
        let state = runGame(sample).state
        while (state.status === 'playing') {
          state = replay(state, [{ type: 'TICK' }], WORDS).state
        }
        const after = replay(state, more, WORDS)
        expect(after.state).toBe(state)
        expect(after.effects.every((e) => e.type === 'INPUT_IGNORED')).toBe(true)
      }),
    )
  })

  it('replays identically from the same seed and log', () => {
    fc.assert(
      fc.property(aGame, (sample) => {
        expect(runGame(sample).state).toEqual(runGame(sample).state)
      }),
    )
  })
})
