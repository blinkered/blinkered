import { nextFloat, nextInt, shuffle } from './rng.js'
import { at } from './invariant.js'
import { WILD_GLYPH, dealWilds, resolveWilds } from './wild.js'
import { replaceLetter } from './replace.js'
import { alphabetFor } from './languages.js'
import { flipReward, wordScore } from './score.js'
import { freeWild, isEligible, letterAvailability, tileById, wildsAskedFor } from './selection.js'
import type {
  Dictionary,
  Effect,
  GameEvent,
  GameState,
  IgnoredReason,
  RejectReason,
  RngState,
  Tile,
} from './types.js'

export type Reduction = readonly [GameState, readonly Effect[]]

function ignored(state: GameState, reason: IgnoredReason): Reduction {
  return [state, [{ type: 'INPUT_IGNORED', reason }]]
}

/**
 * Changes the selection, and keeps the typed-card record honest while doing it.
 *
 * Every path that drops a tile has to drop what was typed onto it, and there are six of them:
 * tap, backspace, escape, clear-letter, submit and the deal. Pruning here rather than at each
 * one is the difference between an invariant and six places that have to remember the same
 * thing.
 */
function reselect(
  state: GameState,
  selection: readonly number[],
  intent: Readonly<Record<number, string>> = state.wildIntent,
): GameState {
  const held = new Set(selection)
  const wildIntent = Object.fromEntries(
    Object.entries(intent).filter(([id]) => held.has(Number(id))),
  )
  return { ...state, selection, wildIntent }
}

/**
 * Letters this round can still put in front of the player: the ones face up and unspent, plus
 * the ones a flip could still turn over.
 *
 * The second half is why this is not simply a count of eligible tiles. A round with two letters
 * showing is not finished if eight more are waiting face down and there are flips to pay for
 * them.
 */
function stillToCome(state: GameState): number {
  const exposed = state.tiles.filter(isEligible).length
  // Every letter that is face down, whether it has been shown before or not, and each of them
  // costs one flip to turn over. Counting them off the board rather than off a reveal tally is
  // what keeps a letter that is merely away from reading as a board out of letters.
  const down = state.tiles.filter((tile) => !tile.revealed && !tile.spent).length
  return exposed + Math.min(down, state.flipsRemaining)
}

/** What a fresh board would offer, since a deal hands every tile back unspent. */
function nextRoundWouldOffer(state: GameState): number {
  return Math.min(state.config.n, state.flipsRemaining)
}

/** Fewer letters than the shortest word this level accepts, so no word can be made from them. */
function tooFewFor(count: number, state: GameState): boolean {
  return count < state.config.minWordLength
}

/**
 * Nothing the player can do, this round or any round after it, will produce another word.
 *
 * This used to read "no flips left, and not enough exposed to spell anything with", which is the
 * same test with `flipsRemaining` at zero and a weaker one above it. With two flips left and a
 * four-letter floor the game was not over by that definition, so it went on turning tiles over
 * at full speed to reach a position that was already decided. Counting what the flips can still
 * reach ends it at the moment it becomes true, which is the same waiting the round-cutting rule
 * below exists to stop.
 */
function isStranded(state: GameState): boolean {
  return tooFewFor(stillToCome(state), state) && tooFewFor(nextRoundWouldOffer(state), state)
}

/** Ends a game that has nothing left in it, whichever event exposed that. */
export function settle([state, effects]: Reduction): Reduction {
  if (state.status === 'over' || !isStranded(state)) return [state, effects]
  return [{ ...reselect(state, []), status: 'over' }, [...effects, { type: 'GAME_OVER' }]]
}

/**
 * Deals the next board early when this one cannot produce another word.
 *
 * Playtesting found the dead time: pick the board clean and the last few letters cannot make
 * anything, but the clock keeps spending flips at the usual pace until the round runs out. The
 * player sits and watches a round they have already finished. So the round ends when it becomes
 * unwinnable rather than when its ticks run out, and the view is told to say why before the next
 * board arrives -- unannounced, a board appearing early would read as a bug.
 *
 * Nothing is charged for the tiles it skips. `chargeFullRound` is off, so flips have only ever
 * been spent by reveals that happened, and billing for reveals that did not would make clearing
 * a board cost more than dawdling on one. Clearing a board is the skilful thing.
 *
 * It cannot fire twice over: `settle` runs first, so reaching here means a fresh board offers at
 * least `minWordLength` letters, and the round this deals is therefore not barren itself.
 */
function cutBarrenRound([state, effects]: Reduction, dictionary: Dictionary): Reduction {
  if (state.status === 'over' || !tooFewFor(stillToCome(state), state)) return [state, effects]
  const [next, ended] = endRound(state, dictionary, true)
  return [next, [...effects, ...ended]]
}

/**
 * The whole game, as one pure function. No clock, no randomness beyond the seeded
 * state it carries, no I/O. That is what makes a game replayable on a server.
 */
export function reduce(state: GameState, event: GameEvent, dictionary: Dictionary): Reduction {
  if (state.status === 'over') return ignored(state, 'game-over')
  // Settled before cut, so that a game with nothing left in it ends rather than dealing a board
  // the player cannot use.
  return cutBarrenRound(settle(apply(state, event, dictionary)), dictionary)
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

/**
 * Turns over one letter, chosen at random from every letter that is face down.
 *
 * **Face down is face down.** A letter the deal has never shown and a letter that turned back over
 * are the same thing to this function, which is the point rather than an economy: a player cannot
 * tell them apart either, so a hide is indistinguishable from the deal simply not having got
 * there yet. Nick asked for exactly that and I twice built something else -- the withdrawn letter
 * returning first, which made it blink back next tick, then returning last, which was a different
 * invented rule. Both came from trying to preserve a defined next tile, and the random deal had
 * already given that up.
 *
 * So there is no reveal order held anywhere and no record of what went back: the candidates are
 * read off the board, and the roll comes off the seeded stream like every other decision.
 */
export function revealNext(state: GameState): Reduction {
  if (state.flipsRemaining <= 0) return [state, []]
  const down = state.tiles.filter((tile) => !tile.revealed && !tile.spent)
  // Nothing face down: every letter is showing or spent, and the rest of the round is hold time.
  if (down.length === 0) return [state, []]

  const [index, rng] = nextInt(state.rng, down.length)
  const tile = at(down, index)
  const tiles = state.tiles.map((candidate) =>
    candidate.id === tile.id ? { ...candidate, revealed: true } : candidate,
  )
  const next: GameState = {
    ...state,
    rng,
    tiles,
    revealsThisRound: state.revealsThisRound + 1,
    flipsRemaining: state.flipsRemaining - 1,
  }
  return [next, [{ type: 'REVEALED', tileId: tile.id }]]
}

/**
 * Which letter this tick takes back, if any, and the stream it rolled against.
 *
 * The roll only happens where a hide is possible, so a round with nothing to take does not spend
 * randomness on finding that out. Replay is unaffected: the same seed and the same events give
 * the same states, so they give the same eligibility.
 */
function pickHide(state: GameState): [Tile | null, RngState] {
  const { config } = state
  if (config.hideChance <= 0) return [null, state.rng]
  const exposed = state.tiles.filter(isEligible)
  // Never the last letter showing: a board with nothing on it is not a harder board, it is a
  // broken one.
  if (exposed.length < 2) return [null, state.rng]

  /*
   * A selected letter is pinned and cannot be taken.
   *
   * Which makes selecting a defensive move as well as a constructive one, and the cost of
   * changing your mind is that a selection cannot be reordered in place: clearing it to spell
   * something else unpins every letter in it, at the moment you were about to use them.
   */
  const held = new Set(state.selection)
  const candidates = exposed.filter((tile) => !held.has(tile.id))
  // Every letter showing is spoken for, so there is nothing to take. The tick then behaves as
  // any other tick, which is what stops a full selection being a way to buy time.
  if (candidates.length === 0) return [null, state.rng]

  const [roll, rolled] = nextFloat(state.rng)
  if (roll >= config.hideChance) return [null, rolled]
  const [index, next] = nextInt(rolled, candidates.length)
  return [at(candidates, index), next]
}

/**
 * One tick: either a letter turns up, or one turns back over.
 *
 * A hide **adds** a tick rather than spending one, and refunds the flip the letter cost. So the
 * pair of a hide and the return that follows it leaves both counters exactly where they were, and
 * the round is two ticks longer for it. That is deliberate and it is the whole shape of the
 * mechanic: it cannot shorten the window with the whole board up, because a letter always comes
 * back before the deal is finished with. What it spends is the player's time and their memory of
 * the board, and nothing else.
 */
function tick(state: GameState, dictionary: Dictionary): Reduction {
  const [hiding, rng] = pickHide(state)
  if (hiding !== null) {
    const tiles = state.tiles.map((candidate) =>
      candidate.id === hiding.id ? { ...candidate, revealed: false } : candidate,
    )
    const next: GameState = {
      ...state,
      rng,
      tiles,
      ticksRemaining: state.ticksRemaining + 1,
      flipsRemaining: state.flipsRemaining + 1,
      tick: state.tick + 1,
    }
    return [next, [{ type: 'TILE_HIDDEN', tileId: hiding.id }]]
  }
  const ticksRemaining = state.ticksRemaining - 1
  const advanced: GameState = { ...state, rng, ticksRemaining, tick: state.tick + 1 }
  if (ticksRemaining <= 0) return endRound(advanced, dictionary)
  return revealNext(advanced)
}

/**
 * Hides everything, shuffles, and opens the next round. Also the single place the
 * game can end, since the rule is that a round always finishes first.
 */
function endRound(state: GameState, dictionary: Dictionary, cutShort = false): Reduction {
  const { config } = state
  // Counted off the board rather than from a reveal tally, which no longer says the same thing:
  // a letter that went back over and never returned is face down and unbilled either way.
  const faceDown = state.tiles.filter((tile) => !tile.revealed && !tile.spent).length
  const flipsCharged = config.chargeFullRound ? Math.min(faceDown, state.flipsRemaining) : 0
  const flipsRemaining = state.flipsRemaining - flipsCharged

  if (flipsRemaining <= 0) {
    const over: GameState = { ...reselect(state, []), flipsRemaining: 0, status: 'over' }
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
    wildIntent: {},
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
  return [
    opened,
    [{ type: 'ROUND_ENDED', layout, flipsCharged, cutShort }, ...announced, ...effects],
  ]
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
      reselect(
        state,
        state.selection.filter((id) => id !== tileId),
      ),
      [{ type: 'DESELECTED', tileIds: [tileId] }],
    ]
  }
  // A tap says "take that card" and nothing about which letter it should be, so it records no
  // intent and the resolution is the ordinary one.
  return [reselect(state, [...state.selection, tileId]), [{ type: 'SELECTED', tileId }]]
}

/**
 * Takes the next tile bearing this letter, or a card if the board is not showing one.
 *
 * The card keeps what was typed onto it. Resolution treats that as a preference and falls back to
 * the ordinary search, so typing a letter onto a card is never worse than tapping it: the player
 * gets the word they meant when it exists and the engine's pick when it does not.
 */
function selectLetter(state: GameState, letter: string): Reduction {
  const { eligible, selected } = letterAvailability(state, letter)
  const next = eligible.find((id) => !selected.includes(id))
  if (next !== undefined) {
    return [reselect(state, [...state.selection, next]), [{ type: 'SELECTED', tileId: next }]]
  }
  const card = freeWild(state)
  if (card !== undefined) {
    const wanted = alphabetFor(state.config.language).fold(letter)
    return [
      reselect(state, [...state.selection, card], { ...state.wildIntent, [card]: wanted }),
      [{ type: 'SELECTED', tileId: card }],
    ]
  }
  if (eligible.length === 0) return ignored(state, 'no-such-letter')
  return ignored(state, 'already-selected')
}

/**
 * Advance to the next copy, or clear them all once there is nothing left to take.
 *
 * "Nothing left to take" now includes the cards: with one E showing and a card on the board, the
 * first press takes the E, the second takes the card, and only the third gives them back. Asking
 * whether a selection is possible rather than counting copies is what keeps that in step, since
 * the cards are not copies of anything.
 */
function cycleLetter(state: GameState, letter: string): Reduction {
  const { eligible, selected } = letterAvailability(state, letter)
  const held = wildsAskedFor(state, letter)
  if (eligible.length === 0 && held.length === 0 && freeWild(state) === undefined) {
    return ignored(state, 'no-such-letter')
  }
  if (selected.length === eligible.length && freeWild(state) === undefined) {
    return clearLetter(state, letter)
  }
  return selectLetter(state, letter)
}

/** Gives back every tile taken for this letter, cards the player typed it onto included. */
function clearLetter(state: GameState, letter: string): Reduction {
  const { selected } = letterAvailability(state, letter)
  const releasing = [...selected, ...wildsAskedFor(state, letter)]
  if (releasing.length === 0) return ignored(state, 'nothing-selected')
  return [
    reselect(
      state,
      state.selection.filter((id) => !releasing.includes(id)),
    ),
    [{ type: 'DESELECTED', tileIds: releasing }],
  ]
}

function undoLetter(state: GameState): Reduction {
  const last = state.selection.at(-1)
  if (last === undefined) return ignored(state, 'nothing-selected')
  return [reselect(state, state.selection.slice(0, -1)), [{ type: 'DESELECTED', tileIds: [last] }]]
}

function resetWord(state: GameState): Reduction {
  if (state.selection.length === 0) return ignored(state, 'nothing-selected')
  return [reselect(state, []), [{ type: 'DESELECTED', tileIds: state.selection }]]
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
  const cleared: GameState = reselect(state, [])
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
    // Aligned with `faces`, which is `selection` in order, so slot `n` is the same tile either
    // side of the call and `resolveWilds` never has to know a tile id.
    const asked = state.selection.map((id) => state.wildIntent[id])
    const outcome = resolveWilds(
      faces,
      alphabetFor(state.config.language),
      dictionary,
      found,
      rng,
      asked,
    )
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
