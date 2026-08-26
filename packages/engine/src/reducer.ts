import { shuffle } from './rng.js'
import { flipReward, wordScore } from './score.js'
import { isEligible, letterAvailability, selectedLetters, tileAt } from './selection.js'
import type {
  Dictionary,
  Effect,
  GameEvent,
  GameState,
  IgnoredReason,
  RejectReason,
} from './types.js'

export type Reduction = readonly [GameState, readonly Effect[]]

function ignored(state: GameState, reason: IgnoredReason): Reduction {
  return [state, [{ type: 'INPUT_IGNORED', reason }]]
}

/**
 * No flips left to reveal with, and not enough exposed to spell anything with. Nothing the
 * player can do will change that, so the round has no reason to keep running.
 */
function isStranded(state: GameState): boolean {
  if (state.flipsRemaining > 0) return false
  return state.tiles.filter(isEligible).length < state.config.minWordLength
}

/** Ends a game that has nothing left in it, whichever event exposed that. */
export function settle([state, effects]: Reduction): Reduction {
  if (state.status === 'over' || !isStranded(state)) return [state, effects]
  return [{ ...state, selection: [], status: 'over' }, [...effects, { type: 'GAME_OVER' }]]
}

/**
 * The whole game, as one pure function. No clock, no randomness beyond the seeded
 * state it carries, no I/O. That is what makes a game replayable on a server.
 */
export function reduce(state: GameState, event: GameEvent, dictionary: Dictionary): Reduction {
  if (state.status === 'over') return ignored(state, 'game-over')
  return settle(apply(state, event, dictionary))
}

function apply(state: GameState, event: GameEvent, dictionary: Dictionary): Reduction {
  switch (event.type) {
    case 'TICK':
      return tick(state)
    case 'TAP_TILE':
      return tapTile(state, event.tileId)
    case 'SELECT_LETTER':
      return selectLetter(state, event.letter)
    case 'CLEAR_LETTER':
      return clearLetter(state, event.letter)
    case 'UNDO_LETTER':
      return undoLetter(state)
    case 'RESET_WORD':
      return resetWord(state)
    case 'SUBMIT_WORD':
      return submitWord(state, dictionary)
  }
}

/** Reveals the next tile in reading order, if the board still has one and flips remain. */
export function revealNext(state: GameState): Reduction {
  // Once the board is fully up, the remaining ticks of the round are hold time.
  if (state.revealsThisRound >= state.config.n) return [state, []]
  if (state.flipsRemaining <= 0) return [state, []]
  const tile = tileAt(state, state.revealsThisRound)
  const tiles = state.tiles.map((candidate) =>
    candidate.id === tile.id ? { ...candidate, revealed: true } : candidate,
  )
  const next: GameState = {
    ...state,
    tiles,
    revealsThisRound: state.revealsThisRound + 1,
    flipsRemaining: state.flipsRemaining - 1,
  }
  return [next, [{ type: 'REVEALED', tileId: tile.id }]]
}

function tick(state: GameState): Reduction {
  const ticksRemaining = state.ticksRemaining - 1
  const advanced: GameState = { ...state, ticksRemaining, tick: state.tick + 1 }
  if (ticksRemaining <= 0) return endRound(advanced)
  return revealNext(advanced)
}

/**
 * Hides everything, shuffles, and opens the next round. Also the single place the
 * game can end, since the rule is that a round always finishes first.
 */
function endRound(state: GameState): Reduction {
  const { config } = state
  const unrevealed = config.n - state.revealsThisRound
  const flipsCharged = config.chargeFullRound ? Math.min(unrevealed, state.flipsRemaining) : 0
  const flipsRemaining = state.flipsRemaining - flipsCharged

  if (flipsRemaining <= 0) {
    const over: GameState = { ...state, flipsRemaining: 0, selection: [], status: 'over' }
    return [over, [{ type: 'GAME_OVER' }]]
  }

  const [layout, rng] = shuffle(
    state.rng,
    state.tiles.map((tile) => tile.id),
  )
  const tiles = state.tiles.map((tile) => ({
    ...tile,
    position: layout.indexOf(tile.id),
    revealed: false,
    spent: false,
  }))
  const [opened, effects] = revealNext({
    ...state,
    tiles,
    rng,
    flipsRemaining,
    roundIndex: state.roundIndex + 1,
    ticksRemaining: config.n + config.holdTicks,
    revealsThisRound: 0,
    selection: [],
  })
  return [opened, [{ type: 'ROUND_ENDED', layout, flipsCharged }, ...effects]]
}

function tapTile(state: GameState, tileId: number): Reduction {
  const tile = state.tiles.find((candidate) => candidate.id === tileId)
  if (!tile || !isEligible(tile)) return ignored(state, 'not-tappable')
  if (state.selection.at(-1) === tileId) {
    return [
      { ...state, selection: state.selection.slice(0, -1) },
      [{ type: 'DESELECTED', tileIds: [tileId] }],
    ]
  }
  if (state.selection.includes(tileId)) return ignored(state, 'already-selected')
  return [{ ...state, selection: [...state.selection, tileId] }, [{ type: 'SELECTED', tileId }]]
}

function selectLetter(state: GameState, letter: string): Reduction {
  const { eligible, selected } = letterAvailability(state, letter)
  if (eligible.length === 0) return ignored(state, 'no-such-letter')
  const next = eligible.find((id) => !selected.includes(id))
  if (next === undefined) return ignored(state, 'already-selected')
  return [{ ...state, selection: [...state.selection, next] }, [{ type: 'SELECTED', tileId: next }]]
}

function clearLetter(state: GameState, letter: string): Reduction {
  const { selected } = letterAvailability(state, letter)
  if (selected.length === 0) return ignored(state, 'nothing-selected')
  return [
    { ...state, selection: state.selection.filter((id) => !selected.includes(id)) },
    [{ type: 'DESELECTED', tileIds: selected }],
  ]
}

function undoLetter(state: GameState): Reduction {
  const last = state.selection.at(-1)
  if (last === undefined) return ignored(state, 'nothing-selected')
  return [
    { ...state, selection: state.selection.slice(0, -1) },
    [{ type: 'DESELECTED', tileIds: [last] }],
  ]
}

function resetWord(state: GameState): Reduction {
  if (state.selection.length === 0) return ignored(state, 'nothing-selected')
  return [{ ...state, selection: [] }, [{ type: 'DESELECTED', tileIds: state.selection }]]
}

function submitWord(state: GameState, dictionary: Dictionary): Reduction {
  const word = selectedLetters(state)
  // Length is measured in tiles, never in characters. They agree in English; they will not
  // agree in a language whose alphabet has digraphs or combining accents.
  const length = state.selection.length
  const cleared: GameState = { ...state, selection: [] }
  const reject = (reason: RejectReason): Reduction => [
    cleared,
    [{ type: 'WORD_REJECTED', word, reason }],
  ]

  if (length < state.config.minWordLength) return reject('too-short')
  if (state.wordsFound.some((found) => found.word === word)) return reject('duplicate')
  if (!dictionary.has(word)) return reject('unknown')

  const points = wordScore(length)
  const flips = flipReward(length, state.config)
  const accepted: GameState = {
    ...cleared,
    score: state.score + points,
    flipsRemaining: state.flipsRemaining + flips,
    wordsFound: [
      ...state.wordsFound,
      {
        word,
        length,
        points,
        flips,
        roundIndex: state.roundIndex,
        tick: state.tick,
      },
    ],
  }
  const announced: Effect = { type: 'WORD_ACCEPTED', word, points, flips }

  switch (state.config.wordCompleteMode) {
    case 'shuffle': {
      const [next, effects] = endRound(accepted)
      return [next, [announced, ...effects]]
    }
    case 'spend': {
      const used = new Set(state.selection)
      const tiles = accepted.tiles.map((tile) =>
        used.has(tile.id) ? { ...tile, revealed: false, spent: true } : tile,
      )
      return [{ ...accepted, tiles }, [announced]]
    }
    case 'keep':
      return [accepted, [announced]]
  }
}
