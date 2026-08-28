import { alphabetFor } from './languages.js'
import { reduce, revealNext, settle, type Reduction } from './reducer.js'
import { seedRng } from './rng.js'
import { dealWilds } from './wild.js'
import type { Dictionary, Effect, GameConfig, GameEvent, GameState, Tile } from './types.js'

export interface NewGame {
  readonly config: GameConfig
  /** Exactly config.n letters, supplied by @blinkered/words so the board is known solvable. */
  readonly letters: readonly string[]
  readonly seed: number
}

/**
 * Opens a game. The first tile is revealed immediately, so the timer reads N with one
 * tile already face up and the last tile lands with one tick left. See docs/PLAN.md 1.2.
 */
export function createGame({ config, letters, seed }: NewGame): Reduction {
  if (config.n < 2) throw new RangeError('a board needs at least two tiles')
  if (letters.length !== config.n) {
    throw new RangeError(`expected ${String(config.n)} letters, got ${String(letters.length)}`)
  }
  if (config.minWordLength < 2) throw new RangeError('minWordLength must be at least 2')
  if (config.initialFlips < 1) throw new RangeError('initialFlips must be positive')
  if (!Number.isInteger(config.holdTicks)) throw new RangeError('holdTicks must be an integer')
  if (config.holdTicks < 0) throw new RangeError('holdTicks cannot be negative')

  const alphabet = alphabetFor(config.language)
  const dealt: Tile[] = letters.map((letter, index) => ({
    id: index,
    letter: alphabet.fold(letter),
    position: index,
    revealed: false,
    spent: false,
    wild: false,
  }))

  // The first round's wilds come off the same seeded stream as everything else, so the whole
  // game is still reproducible from the seed alone.
  const [tiles, rng] = dealWilds(seedRng(seed), dealt, config.wildChance)

  return settle(
    revealNext({
      config,
      rng,
      tiles,
      selection: [],
      roundIndex: 0,
      ticksRemaining: config.n + config.holdTicks,
      revealsThisRound: 0,
      flipsRemaining: config.initialFlips,
      score: 0,
      wordsFound: [],
      tick: 0,
      status: 'playing',
    }),
  )
}

export interface Replay {
  readonly state: GameState
  readonly effects: readonly Effect[]
}

/**
 * Folds an event log over the reducer. The server scores a submitted game by running
 * this against its own seed, rather than believing whatever the client claims.
 */
export function replay(
  start: GameState,
  events: readonly GameEvent[],
  dictionary: Dictionary,
): Replay {
  let state = start
  const effects: Effect[] = []
  for (const event of events) {
    const [next, produced] = reduce(state, event, dictionary)
    state = next
    effects.push(...produced)
  }
  return { state, effects }
}
