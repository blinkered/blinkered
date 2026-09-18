import { ENGLISH, configFor, createGame, replay } from '../src/index.js'
import type {
  Alphabet,
  Dictionary,
  Effect,
  GameConfig,
  GameEvent,
  GameState,
} from '../src/index.js'

/** Whether a board holds every tile a word needs, counting repeats. */
function fits(word: readonly string[], board: readonly string[]): boolean {
  const spare = new Map<string, number>()
  for (const tile of board) spare.set(tile, (spare.get(tile) ?? 0) + 1)
  for (const tile of word) {
    const left = spare.get(tile) ?? 0
    if (left === 0) return false
    spare.set(tile, left - 1)
  }
  return true
}

/**
 * A dictionary over a handful of words.
 *
 * `profile` is a second implementation of what @blinkered/words solves by enumerating subsets and
 * looking up anagram keys, which it has to be: the engine cannot depend on the package that
 * depends on it. Written the opposite way round on purpose, walking the words rather than the
 * boards, so agreement between the two is worth something rather than being a copy agreeing with
 * itself. Over sixty fixture words it is instant either way.
 */
export function dictionaryOf(...words: readonly string[]): Dictionary {
  return dictionaryIn(ENGLISH, ...words)
}

/** The same, for a test that needs an alphabet whose letters are not single characters. */
export function dictionaryIn(alphabet: Alphabet, ...words: readonly string[]): Dictionary {
  const set = new Set(words.map((word) => word.toUpperCase()))
  return {
    has: (word) => set.has(word),
    profile: (letters, minLength) => {
      let count = 0
      let longest = 0
      for (const word of set) {
        const tiles = alphabet.segment(word)
        if (tiles.length < minLength || !fits(tiles, letters)) continue
        count += 1
        if (tiles.length > longest) longest = tiles.length
      }
      return { count, longest }
    },
  }
}

/** Enough of the language to exercise the rules without depending on @blinkered/words. */
export const WORDS = dictionaryOf(
  'AT',
  'AS',
  'AN',
  'ON',
  'NO',
  'SO',
  'TO',
  'OR',
  'IT',
  'ATE',
  'EAT',
  'TEA',
  'SEA',
  'SET',
  'TEN',
  'NET',
  'ONE',
  'SON',
  'TON',
  'NOT',
  'OAT',
  'ANT',
  'TAN',
  'NAP',
  'PAN',
  'TOE',
  'NOR',
  'ROT',
  'TOR',
  'OAR',
  'EAR',
  'ERA',
  'ARE',
  'TAR',
  'RAT',
  'ART',
  'EAT',
  'TEAS',
  'SEAT',
  'EAST',
  'EATS',
  'NOTE',
  'TONE',
  'OATS',
  'ANTS',
  'PANT',
  'RATE',
  'TEAR',
  'NEAR',
  'STONE',
  'NOTES',
  'ONSET',
  'TONES',
  'ATONE',
  'OATEN',
  'PANTS',
  'RATES',
  'ATONES',
  'PRIEST',
  'ESPRIT',
  'SPRITE',
  'STRIPE',
  'RIPEST',
  'PANTERS',
  'PARENTS',
  'TREPANS',
)

export interface Harness {
  readonly state: GameState
  readonly effects: readonly Effect[]
}

/** Opens a game on an exact board. Letters are given, never drawn, so tests are legible. */
export function open(letters: string, overrides: Partial<GameConfig> = {}, seed = 1): Harness {
  /*
   * Wild cards off unless a test asks for them.
   *
   * `wildChance` defaults to 0.02 in real play, which is correct there and wrong here: every
   * board in the suite would roll for wilds, a handful would get one, and tests written about
   * letters would start failing about something else. A test that wants a wild says so.
   *
   * `replaceChance` is off for the same reason and more so, since it defaults to 0.5: half the
   * rounds in the suite would deal a board made of different letters from the one the test named.
   */
  const config = configFor('easy', {
    n: letters.length,
    holdTicks: 0,
    wildChance: 0,
    replaceChance: 0,
    ...overrides,
  })
  const [state, effects] = createGame({ config, letters: [...letters], seed })
  return { state, effects }
}

/**
 * The same board, with the letters laid so that the **deal** spells the string.
 *
 * `open` keeps tile `k` carrying letter `k`, which is what a test asserting on tile ids or on the
 * board in slot order needs. This is for the other kind: a test about what is showing after three
 * ticks, which used to be answered by reading order and cannot be now, because a tick turns over
 * a letter chosen from whatever is face down.
 *
 * There is no order to inject -- the engine holds none, deliberately -- so this runs the game once
 * with no input to learn which slots the seed turns over and in what order, then lays the first
 * letter in the first of those slots and so on. Sound because a pick depends only on the stream
 * and on how many tiles are face down, never on what is written on them, so the probe and the
 * real game deal the same slots in the same order.
 *
 * The board therefore reads as some arrangement of the string rather than as the string, and the
 * letters arrive in the order written. A test that hides or spends letters diverges from the probe
 * at that point, which is why the ones using this tick without touching anything first.
 */
export function dealt(letters: string, overrides: Partial<GameConfig> = {}, seed = 1): Harness {
  const config = configFor('easy', {
    n: letters.length,
    holdTicks: 0,
    wildChance: 0,
    replaceChance: 0,
    ...overrides,
  })
  const probe = createGame({ config: { ...config, hideChance: 0 }, letters: [...letters], seed })[0]
  const slots = faceUpSlots(probe)
  let walked = probe
  while (slots.length < letters.length) {
    const step = replay(walked, [tick], WORDS)
    if (step.state === walked) break
    walked = step.state
    for (const slot of faceUpSlots(walked)) {
      if (!slots.includes(slot)) slots.push(slot)
    }
  }

  const arranged = [...letters]
  slots.forEach((slot, at) => {
    arranged[slot] = letters[at] as string
  })
  const [state, effects] = createGame({ config, letters: arranged, seed })
  return { state, effects }
}

/** Which slots are face up, in slot order, which is all the probe needs. */
function faceUpSlots(state: GameState): number[] {
  return state.tiles
    .filter((tile) => tile.revealed)
    .map((tile) => tile.position)
    .sort((a, b) => a - b)
}

export function play(
  state: GameState,
  events: readonly GameEvent[],
  dictionary: Dictionary = WORDS,
): Harness {
  return replay(state, events, dictionary)
}

export const tick: GameEvent = { type: 'TICK' }
export const submit: GameEvent = { type: 'SUBMIT_WORD' }
export const resetWord: GameEvent = { type: 'RESET_WORD' }
export const undo: GameEvent = { type: 'UNDO_LETTER' }
export const letter = (value: string): GameEvent => ({ type: 'SELECT_LETTER', letter: value })
export const clearLetter = (value: string): GameEvent => ({ type: 'CLEAR_LETTER', letter: value })
export const tap = (tileId: number): GameEvent => ({ type: 'TAP_TILE', tileId })

/** Ticks until the board is fully exposed, which is the tick before the round ends. */
export function ticksToFullBoard(n: number): GameEvent[] {
  return Array.from({ length: n - 1 }, () => tick)
}

export function revealedLetters(state: GameState): string {
  return state.tiles
    .filter((t) => t.revealed)
    .sort((a, b) => a.position - b.position)
    .map((t) => t.letter)
    .join('')
}

export function spell(...letters: readonly string[]): GameEvent[] {
  return letters.map((value) => letter(value))
}
