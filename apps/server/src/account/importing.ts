import { ENGINE_VERSION, alphabetFor, configFor, isCanonical, wordScore } from '@blinkered/engine'
import type { Difficulty, FlipEconomy, GameConfig, WordCompleteMode } from '@blinkered/engine'
import type { Rejection } from '../submission.js'
import { scoreSubmission } from '../submission.js'
import type { BoardAtRound, DetailWord } from './types.js'

/**
 * Reading a game a browser played before anybody was signed in.
 *
 * This is the one route in the account surface where the whole body is a claim: the game
 * happened on somebody's machine, in a tab the server never saw, and no amount of checking here
 * makes it a fact. What that buys is a bound rather than a proof — the numbers have to be
 * numbers, the ruleset has to be a ruleset, and the words have to be a game that could have been
 * played under it — so the row is at least internally coherent and nothing absurd reaches a
 * column.
 *
 * The score is not read from the body at all. `scoreSubmission` sums `wordScore` over the words,
 * segmented in the game's own alphabet, which is the mechanism docs/ACCOUNTS.md settles on under
 * "How a score is checked". An imported game is never leaderboard-eligible, so this is a diary
 * entry either way; doing the arithmetic here anyway means the number in the column was computed
 * by the same function everywhere, and there is one fewer path to remember when boards open.
 */

export type ImportProblem =
  | 'not-an-object'
  | 'bad-times'
  | 'bad-seed'
  | 'bad-difficulty'
  | 'bad-config'
  | 'bad-boards'
  | 'bad-words'
  | Rejection

export interface ImportedGame {
  readonly config: GameConfig
  readonly difficulty: Difficulty
  /** Whether the ruleset is a published preset, decided here rather than taken from the body. */
  readonly canonical: boolean
  readonly seed: number
  readonly source: 'web' | 'ios'
  /**
   * Whether the game began before there was an account, which is what `games.imported` means.
   *
   * Not "was it sent by a signed-in browser", which is true of every game that reaches this
   * route: phase A issues no seeds, so a game played while signed in is also finished on the
   * client and posted at the end. Marking both as imported was the first version and it produced
   * a history that told people their own games had been kept from a guest game, which was untrue
   * and told them nothing they could use. `leaderboard_eligible` is the column that decides
   * ranking, and it is false for both of these regardless.
   */
  readonly imported: boolean
  /** The board each round had, with any wilds it was showing. See `GameDetail`. */
  readonly boards: readonly BoardAtRound[]
  /** Every word, with what the engine knew about it. Scored here, never read from the body. */
  readonly words: readonly DetailWord[]
  readonly rounds: number
  readonly score: number
  readonly dictionaryVersion: string | null
  readonly startedAt: Date
  readonly finishedAt: Date
}

export type ParsedImport =
  | { readonly ok: true; readonly game: ImportedGame }
  | { readonly ok: false; readonly problem: ImportProblem }

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'insane']
const COMPLETE_MODES: readonly WordCompleteMode[] = ['shuffle', 'spend', 'keep']
const ECONOMIES: readonly FlipEconomy[] = ['none', 'perLetter', 'fibonacci', 'overMinimum']

/**
 * Ceilings, and none of them are rules of the game.
 *
 * They exist so a row cannot be an attack on the column that holds it: `n` is a smallint, and a
 * board of four billion tiles is a request to be refused rather than a game. Loose enough that
 * no nerd-mode setting the interface offers comes near them.
 */
const LIMITS = {
  n: [1, 400],
  speedMultiplier: [0.01, 600],
  holdTicks: [0, 3600],
  initialFlips: [0, 1_000_000],
  wMin: [0, 1_000_000],
  minWordLength: [1, 64],
  wildChance: [0, 1],
  replaceChance: [0, 1],
} as const

/**
 * The preset's generation floor, read once.
 *
 * Every difficulty carries the same value -- it is `PROFITABLE_LENGTH`, not a per-preset dial --
 * so which one is asked does not matter, and asking the engine beats copying the number here.
 */
const CEILING_MIN = configFor('medium').ceilingMin

/** How far ahead of the server a client's clock is allowed to be before the game is refused. */
const CLOCK_SLACK_MS = 5 * 60 * 1000

/** Longest a single tile's face may be. Croatian DŽ is two characters; nothing is eight. */
const LETTER_MAX = 8

/** Longest a submitted word may be, as a bound on the request rather than a rule of play. */
const WORD_MAX = 64

/**
 * Ceilings on the numbers the engine reports about a word, so a document cannot be an attack on
 * the column that holds it. Bounds on the request rather than rules of play, and loose enough
 * that no game anybody could sit through comes near them.
 */
const ROUND_MAX = 100_000
const FLIPS_MAX = 10_000_000
const TICK_MAX = 100_000_000

export function parseImport(body: unknown, now: Date): ParsedImport {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, problem: 'not-an-object' }
  }
  const fields = body as Record<string, unknown>

  const startedAt = whole(fields.startedAt)
  const finishedAt = whole(fields.finishedAt)
  if (startedAt === null || finishedAt === null) return { ok: false, problem: 'bad-times' }
  // A game cannot end before it began, and cannot end after now. The second is not anti-cheat --
  // an imported game is unrankable whatever its timestamps say -- it is so that a machine with a
  // wrong clock cannot put a row at the top of a history sorted by date for the next decade.
  if (finishedAt < startedAt) return { ok: false, problem: 'bad-times' }
  if (finishedAt > now.getTime() + CLOCK_SLACK_MS) return { ok: false, problem: 'bad-times' }

  const seed = whole(fields.seed)
  if (seed === null) return { ok: false, problem: 'bad-seed' }

  const difficulty = DIFFICULTIES.find((value) => value === fields.difficulty)
  if (difficulty === undefined) return { ok: false, problem: 'bad-difficulty' }

  const config = parseConfig(fields.config)
  if (config === null) return { ok: false, problem: 'bad-config' }

  // Checked here rather than left to `scoreSubmission`, which would also catch it, because the
  // board count is bounded by the round count below: a zero would make every board an excess one
  // and report a board problem for what is a round problem.
  const rounds = whole(fields.rounds)
  if (rounds === null || rounds < 1) return { ok: false, problem: 'impossible-rounds' }

  const boards = parseBoards(fields.boards, config.n, rounds)
  if (boards === null) return { ok: false, problem: 'bad-boards' }

  const found = parseWords(fields.words)
  if (found === null) return { ok: false, problem: 'bad-words' }

  // Scored from the words alone and never read from the body: `wordScore` is a function of tile
  // count and nothing else. See docs/ACCOUNTS.md, "How a score is checked".
  const verdict = scoreSubmission({ words: found.map((one) => one.word), rounds }, config)
  if (!verdict.ok) return { ok: false, problem: verdict.reason }

  const alphabet = alphabetFor(config.language)
  const words: DetailWord[] = found.map((one) => {
    // Tiles rather than characters, for the reason reducer.ts gives where it matters: Croatian
    // LJ is one tile, and a length in characters would overpay every word that holds one.
    const tiles = alphabet.segment(one.word).length
    return {
      word: one.word,
      tiles,
      points: wordScore(tiles),
      round: one.round,
      flips: one.flips,
      tick: one.tick,
      // Absent rather than empty, so the ordinary word costs nothing to say it has no wilds.
      ...(one.wilds.length === 0 ? {} : { wilds: one.wilds }),
    }
  })

  return {
    ok: true,
    game: {
      config,
      difficulty,
      // Asked of the ruleset, not taken from the body. A client that says a game was canonical
      // is a client claiming its own score is rankable, which is not its claim to make.
      canonical: isCanonical(config, difficulty),
      seed,
      source: fields.source === 'ios' ? 'ios' : 'web',
      boards,
      // Absent reads as "not a guest game", which is the safer default of the two: it withholds
      // a label rather than inventing one about where somebody's game came from.
      imported: fields.guest === true,
      words,
      rounds,
      score: verdict.score,
      dictionaryVersion:
        typeof fields.dictionaryVersion === 'string' ? fields.dictionaryVersion : null,
      startedAt: new Date(startedAt),
      finishedAt: new Date(finishedAt),
    },
  }
}

/**
 * The ruleset the game was played under, field by field.
 *
 * Read from the body rather than rebuilt from the difficulty, because nerd mode exists: a game
 * played on somebody's own numbers is still their game, and refusing to keep it would mean the
 * one player who most wants a history is the one who cannot have one. What is *not* taken from
 * the body is whether those numbers count as a preset — see `isCanonical` above.
 *
 * `ceilingMin` is a generation constraint rather than a rule of play: it decides which boards may
 * be dealt, and by the time a game is finished it has had its say. It is not in the `games` table
 * for that reason, so it is not read from the body either, and the preset's value stands in.
 */
function parseConfig(value: unknown): GameConfig | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const fields = value as Record<string, unknown>

  const n = bounded(fields.n, LIMITS.n, true)
  const speedMultiplier = bounded(fields.speedMultiplier, LIMITS.speedMultiplier, false)
  const holdTicks = bounded(fields.holdTicks, LIMITS.holdTicks, true)
  const initialFlips = bounded(fields.initialFlips, LIMITS.initialFlips, true)
  const wMin = bounded(fields.wMin, LIMITS.wMin, true)
  const minWordLength = bounded(fields.minWordLength, LIMITS.minWordLength, true)
  const wildChance = bounded(fields.wildChance, LIMITS.wildChance, false)
  const replaceChance = bounded(fields.replaceChance, LIMITS.replaceChance, false)
  if (
    n === null ||
    speedMultiplier === null ||
    holdTicks === null ||
    initialFlips === null ||
    wMin === null ||
    minWordLength === null ||
    wildChance === null ||
    replaceChance === null
  ) {
    return null
  }

  const wordCompleteMode = COMPLETE_MODES.find((mode) => mode === fields.wordCompleteMode)
  const flipEconomy = ECONOMIES.find((economy) => economy === fields.flipEconomy)
  if (wordCompleteMode === undefined || flipEconomy === undefined) return null
  if (typeof fields.chargeFullRound !== 'boolean') return null
  if (typeof fields.language !== 'string' || fields.language === '') return null

  return {
    n,
    wildChance,
    replaceChance,
    speedMultiplier,
    initialFlips,
    wMin,
    ceilingMin: CEILING_MIN,
    minWordLength,
    holdTicks,
    wordCompleteMode,
    flipEconomy,
    chargeFullRound: fields.chargeFullRound,
    language: fields.language,
    // The engine the game was played on, which is a fact about the past and may not be this one.
    // A history that silently relabels old games as current is a history that cannot explain why
    // a score from before a retune looks the way it does.
    engineVersion: typeof fields.engineVersion === 'string' ? fields.engineVersion : ENGINE_VERSION,
  }
}

/** A number inside its bounds, and whole where the column or the meaning requires it. */
function bounded(
  value: unknown,
  [low, high]: readonly [number, number],
  round: boolean,
): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < low || value > high) return null
  if (round && !Number.isInteger(value)) return null
  return value
}

/**
 * The board each round had, one entry per round.
 *
 * At least one and never more than the rounds claimed, rather than exactly the rounds claimed. A
 * client that failed to snapshot a boundary should lose a board and not the whole game: the
 * import is silent on failure by design, so strictness here would cost somebody their score to
 * report a bug they cannot see.
 *
 * Each board is exactly `n` faces joined by a space, which is checked, because a board of the
 * wrong size is a board the ruleset says did not happen.
 */
function parseBoards(value: unknown, n: number, rounds: number): readonly BoardAtRound[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > rounds) return null
  const boards: BoardAtRound[] = []
  for (const entry of value as unknown[]) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return null
    const tiles = (entry as Record<string, unknown>).tiles
    if (typeof tiles !== 'string' || tiles.length > n * (LETTER_MAX + 1)) return null
    const faces = tiles.split(' ')
    if (faces.length !== n) return null
    if (!faces.every((face) => face !== '' && face.length <= LETTER_MAX)) return null
    // Slots, so bounded by the board rather than by a word. Absent and empty both mean none.
    const wilds = parseWilds((entry as Record<string, unknown>).wilds, n)
    if (wilds === null) return null
    boards.push(wilds.length === 0 ? { tiles } : { tiles, wilds })
  }
  return boards
}

/** What the client claims about one found word, before this file scores it. */
interface FoundClaim {
  readonly word: string
  readonly round: number
  readonly flips: number
  readonly tick: number
  readonly wilds: readonly number[]
}

/**
 * Words, with what the engine already knew about each one.
 *
 * Whether they make a possible game is `scoreSubmission`'s question and stays there. What this
 * decides is only that every field is the kind of thing it claims to be, so a document cannot
 * carry a string where a round number belongs and surface it years later in a chart.
 */
function parseWords(value: unknown): readonly FoundClaim[] | null {
  if (!Array.isArray(value)) return null
  const claims: FoundClaim[] = []
  for (const entry of value as unknown[]) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return null
    const fields = entry as Record<string, unknown>
    const word = fields.word
    if (typeof word !== 'string' || word === '' || word.length > WORD_MAX) return null
    const round = bounded(fields.round, [0, ROUND_MAX], true)
    const flips = bounded(fields.flips, [0, FLIPS_MAX], true)
    const tick = bounded(fields.tick, [0, TICK_MAX], true)
    if (round === null || flips === null || tick === null) return null
    const wilds = parseWilds(fields.wilds, word.length)
    if (wilds === null) return null
    claims.push({ word, round, flips, tick, wilds })
  }
  return claims
}

/**
 * Positions a wild stood in, bounded by whatever is being indexed.
 *
 * Shared by the two things that count wilds, which index different spaces: a word's `wilds` are
 * letter positions within that word, and a board's are slots on the board. Absent is none, which
 * is what almost every one of either says.
 */
function parseWilds(value: unknown, length: number): readonly number[] | null {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > length) return null
  const wilds = value as unknown[]
  const usable = (at: unknown): boolean =>
    typeof at === 'number' && Number.isInteger(at) && at >= 0 && at < length
  return wilds.every(usable) ? (wilds as readonly number[]) : null
}

/** A non-negative whole number, or null for anything else somebody sent instead. */
function whole(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null
}
