import { shuffle } from './rng.js'
import { WILD_GLYPH, dealWilds, resolveWilds } from './wild.js'
import { replaceLetter } from './replace.js'
import { alphabetFor } from './languages.js'
import { flipReward, wordScore } from './score.js'
import { isEligible, letterAvailability, tileAt, tileById } from './selection.js'
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
      return tick(state, dictionary)
    case 'TAP_TILE':
      return tapTile(state, event.tileId)
    case 'SELECT_LETTER':
      return selectLetter(state, event.letter)
    case 'CLEAR_LETTER':
      return clearLetter(state, event.letter)
    case 'CYCLE_LETTER':
      return cycleLetter(state, event.letter)
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

function tick(state: GameState, dictionary: Dictionary): Reduction {
  const ticksRemaining = state.ticksRemaining - 1
  const advanced: GameState = { ...state, ticksRemaining, tick: state.tick + 1 }
  if (ticksRemaining <= 0) return endRound(advanced, dictionary)
  return revealNext(advanced)
}

/**
 * Hides everything, shuffles, and opens the next round. Also the single place the
 * game can end, since the rule is that a round always finishes first.
 */
function endRound(state: GameState, dictionary: Dictionary): Reduction {
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
  const reset = state.tiles.map((tile) => ({
    ...tile,
    position: layout.indexOf(tile.id),
    revealed: false,
    spent: false,
  }))
  /*
   * Replace first, then deal wilds, and never both on the same tile.
   *
   * A tile that was replaced and then masked would spend its announcement on a letter the board
   * immediately hides: the player is shown "R became S" and then handed a card. Two mechanics
   * arriving on one tile also makes them hard to tell apart, and they have to stay tellable apart
   * or the board stops being trustworthy.
   *
   * Replacement is safe to run before the wild deal for the same reason it needs no change to
   * board generation: it leaves the board above its word floor, and a wild is strictly better than
   * the letter it hides.
   */
  const [swapped, replacement, replacedRng] = replaceLetter(
    rng,
    reset,
    config,
    alphabetFor(config.language),
    dictionary,
  )
  const eligible = swapped.filter((tile) => tile.id !== replacement?.tileId)
  const [dealt, dealtRng] = dealWilds(replacedRng, eligible, config.wildChance)
  const wilds = new Set(dealt.filter((tile) => tile.wild).map((tile) => tile.id))
  const tiles = swapped.map((tile) => ({ ...tile, wild: wilds.has(tile.id) }))
  const [opened, effects] = revealNext({
    ...state,
    tiles,
    rng: dealtRng,
    flipsRemaining,
    roundIndex: state.roundIndex + 1,
    ticksRemaining: config.n + config.holdTicks,
    revealsThisRound: 0,
    selection: [],
  })
  const announced: readonly Effect[] =
    replacement === null
      ? []
      : [
          {
            type: 'LETTER_REPLACED',
            tileId: replacement.tileId,
            from: replacement.from,
            to: replacement.to,
          },
        ]
  return [opened, [{ type: 'ROUND_ENDED', layout, flipsCharged }, ...announced, ...effects]]
}

/**
 * A tap takes a letter, and a tap on a letter already taken gives it back.
 *
 * Any of them, not only the most recent. Deselecting only the last tile is what a keyboard's
 * Backspace does, and it made sense while the keyboard was the primary interface; under a thumb
 * it is wrong. A player looking at the letters they have taken sees the one they do not want and
 * taps it, and being silently refused because two other letters came after it is the interface
 * arguing with them. The survivors keep their order, so giving back the middle of A-L-I leaves
 * A-I rather than reshuffling anything.
 */
function tapTile(state: GameState, tileId: number): Reduction {
  const tile = state.tiles.find((candidate) => candidate.id === tileId)
  if (!tile || !isEligible(tile)) return ignored(state, 'not-tappable')
  if (state.selection.includes(tileId)) {
    return [
      { ...state, selection: state.selection.filter((id) => id !== tileId) },
      [{ type: 'DESELECTED', tileIds: [tileId] }],
    ]
  }
  return [{ ...state, selection: [...state.selection, tileId] }, [{ type: 'SELECTED', tileId }]]
}

function selectLetter(state: GameState, letter: string): Reduction {
  const { eligible, selected } = letterAvailability(state, letter)
  if (eligible.length === 0) return ignored(state, 'no-such-letter')
  const next = eligible.find((id) => !selected.includes(id))
  if (next === undefined) return ignored(state, 'already-selected')
  return [{ ...state, selection: [...state.selection, next] }, [{ type: 'SELECTED', tileId: next }]]
}

/** Advance to the next copy, or clear them all once every copy is selected. */
function cycleLetter(state: GameState, letter: string): Reduction {
  const { eligible, selected } = letterAvailability(state, letter)
  if (eligible.length === 0) return ignored(state, 'no-such-letter')
  if (selected.length === eligible.length) return clearLetter(state, letter)
  return selectLetter(state, letter)
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
  // `tileById` states the invariant rather than defending against it. The first version of this
  // used `find` with `??` fallbacks, which added two branches that cannot be reached and so
  // cannot be tested: `selection` only ever holds ids of tiles that exist.
  const faces = state.selection.map((id) => {
    const tile = tileById(state, id)
    return { letter: tile.letter, wild: tile.wild }
  })
  // What the player sees they submitted. A wild contributes nothing to it, so a rejection names
  // the selection honestly rather than naming one letter the engine happened to try.
  const word = faces.map((face) => (face.wild ? WILD_GLYPH : face.letter)).join('')
  // Length is measured in tiles, never in characters. They agree in English; they will not
  // agree in a language whose alphabet has digraphs or combining accents.
  const length = state.selection.length
  const cleared: GameState = { ...state, selection: [] }
  const reject = (reason: RejectReason): Reduction => [
    cleared,
    [{ type: 'WORD_REJECTED', word, reason }],
  ]

  if (length < state.config.minWordLength) return reject('too-short')

  const anyWild = faces.some((face) => face.wild)
  let made = word
  let wilds: readonly number[] = []
  let rng = state.rng

  if (anyWild) {
    const found = new Set(state.wordsFound.map((entry) => entry.word))
    const outcome = resolveWilds(faces, alphabetFor(state.config.language), dictionary, found, rng)
    switch (outcome.kind) {
      case 'too-many-wilds':
      case 'unknown':
        return reject('unknown')
      case 'all-found':
        return reject('all-found')
      case 'resolved':
        made = outcome.resolution.word
        wilds = outcome.resolution.wilds
        rng = outcome.rng
        break
    }
  } else {
    if (state.wordsFound.some((found) => found.word === word)) return reject('duplicate')
    if (!dictionary.has(word)) return reject('unknown')
  }

  const points = wordScore(length)
  const flips = flipReward(length, state.config)
  const accepted: GameState = {
    ...cleared,
    rng,
    score: state.score + points,
    flipsRemaining: state.flipsRemaining + flips,
    wordsFound: [
      ...state.wordsFound,
      {
        word: made,
        wilds,
        length,
        points,
        flips,
        roundIndex: state.roundIndex,
        tick: state.tick,
      },
    ],
  }
  const announced: Effect = { type: 'WORD_ACCEPTED', word: made, points, flips, wilds }

  switch (state.config.wordCompleteMode) {
    case 'shuffle': {
      const [next, effects] = endRound(accepted, dictionary)
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
