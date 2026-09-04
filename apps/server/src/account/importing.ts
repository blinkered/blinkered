import { ENGINE_VERSION, configFor, isCanonical } from '@blinkered/engine'
import type { Difficulty, FlipEconomy, GameConfig, WordCompleteMode } from '@blinkered/engine'
import type { Rejection } from '../submission.js'
import { scoreSubmission } from '../submission.js'

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
  | 'bad-letters'
  | 'bad-words'
  | Rejection

export interface ImportedGame {
  readonly config: GameConfig
  readonly difficulty: Difficulty
  /** Whether the ruleset is a published preset, decided here rather than taken from the body. */
  readonly canonical: boolean
  readonly seed: number
  readonly source: 'web' | 'ios'
  readonly letters: readonly string[]
  readonly words: readonly string[]
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

  const letters = parseLetters(fields.letters, config.n)
  if (letters === null) return { ok: false, problem: 'bad-letters' }

  const words = parseWords(fields.words)
  if (words === null) return { ok: false, problem: 'bad-words' }

  const rounds = whole(fields.rounds)
  if (rounds === null) return { ok: false, problem: 'impossible-rounds' }

  const verdict = scoreSubmission({ words, rounds }, config)
  if (!verdict.ok) return { ok: false, problem: verdict.reason }

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
      letters,
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

/** The board as first dealt: exactly `n` faces, each of them a face. */
function parseLetters(value: unknown, n: number): readonly string[] | null {
  if (!Array.isArray(value) || value.length !== n) return null
  const letters = value as unknown[]
  if (!letters.every((l) => typeof l === 'string' && l !== '' && l.length <= LETTER_MAX))
    return null
  return letters as readonly string[]
}

/** Words as an array of words. Whether they make a possible game is `scoreSubmission`'s question. */
function parseWords(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null
  const words = value as unknown[]
  if (!words.every((w) => typeof w === 'string' && w !== '' && w.length <= WORD_MAX)) return null
  return words as readonly string[]
}

/** A non-negative whole number, or null for anything else somebody sent instead. */
function whole(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null
}
