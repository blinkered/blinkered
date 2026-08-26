import { DEFAULT_LANGUAGE } from './languages.js'
import { at } from './invariant.js'
import type { Difficulty, GameConfig } from './types.js'

export const ENGINE_VERSION = '0.1.0'

/** Twelve tiles, 4x3 in landscape and 3x4 in portrait. A player may pick another size. */
export const DEFAULT_BOARD_SIZE = 12

/**
 * Board size is a player's choice, not a difficulty axis. A bigger board is harder to track
 * and gives less time per tile, but it admits far more words and much longer ones, so it is
 * easier to score on: at N=6 a seven-letter word is arithmetically impossible. So a profile
 * holds only the rules that do not scale with the board, and the two that do are derived
 * from N below, which keeps a level equally hard at every size.
 *
 * Opening bids. tools/simulate replaces these with numbers that came from watching thousands
 * of games rather than from a hunch. See docs/PLAN.md 1.9.
 */
export interface DifficultyProfile {
  readonly speedMultiplier: number
  readonly holdTicks: number
  /** Rounds you survive having scored nothing at all. Flips are this times the board size. */
  readonly initialRounds: number
  readonly minWordLength: number
}

export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultyProfile>> = {
  easy: { speedMultiplier: 1.6, holdTicks: 4, initialRounds: 14, minWordLength: 3 },
  medium: { speedMultiplier: 1.2, holdTicks: 2, initialRounds: 12, minWordLength: 3 },
  hard: { speedMultiplier: 0.9, holdTicks: 1, initialRounds: 11, minWordLength: 4 },
  insane: { speedMultiplier: 0.7, holdTicks: 0, initialRounds: 10, minWordLength: 4 },
}

/**
 * Median distinct words a board of n tiles admits at minimum length 3, indexed from n=4.
 *
 * Regenerate with `pnpm derive` whenever the word list changes; these numbers describe a
 * dictionary, not the rules. Currently measured against the phase-1 placeholder list.
 */
const MEDIAN_WORDS = [6, 16, 30, 50, 103, 164, 247, 362, 464] as const
const SMALLEST_MEASURED = 4
const LARGEST_MEASURED = SMALLEST_MEASURED + MEDIAN_WORDS.length - 1

/** Share of those words that survive raising the minimum length. Also from `pnpm derive`. */
const SHARE_BY_MINIMUM: Readonly<Record<number, number>> = {
  2: 1.13,
  3: 1,
  4: 0.67,
  5: 0.28,
  6: 0.08,
}
const SHARE_BEYOND_TABLE = 0.06

/** Aim below the median so acceptance costs a draw or two rather than hundreds. */
const TARGET_SHARE_OF_MEDIAN = 0.7

/**
 * How many words a board must admit to be worth playing. Scales with the board, because a
 * count that filters hard at nine tiles is trivial at twelve and impossible at six.
 */
export function defaultWMin(n: number, minWordLength: number): number {
  const size = Math.min(LARGEST_MEASURED, Math.max(SMALLEST_MEASURED, Math.round(n)))
  const median = at(MEDIAN_WORDS, size - SMALLEST_MEASURED)
  const share = SHARE_BY_MINIMUM[minWordLength] ?? SHARE_BEYOND_TABLE
  return Math.max(1, Math.round(median * share * TARGET_SHARE_OF_MEDIAN))
}

/**
 * The first length that turns a profit under the fibonacci economy: five letters only break
 * even, so a board with no six-letter word cannot be played at a profit however well it is
 * played. Board acceptance requires one. See docs/PLAN.md 1.7.
 */
export const PROFITABLE_LENGTH = 6

/**
 * Resolves a difficulty and any explicit overrides into a complete ruleset. Board size and
 * minimum word length are read first, because the flip budget and the word floor are derived
 * from them; an explicit `initialFlips` or `wMin` still wins.
 */
export function configFor(difficulty: Difficulty, overrides: Partial<GameConfig> = {}): GameConfig {
  const profile = DIFFICULTIES[difficulty]
  const n = overrides.n ?? DEFAULT_BOARD_SIZE
  const minWordLength = overrides.minWordLength ?? profile.minWordLength

  const resolved: GameConfig = {
    n,
    speedMultiplier: profile.speedMultiplier,
    holdTicks: profile.holdTicks,
    initialFlips: profile.initialRounds * n,
    minWordLength,
    wMin: defaultWMin(n, minWordLength),
    ceilingMin: PROFITABLE_LENGTH,
    wordCompleteMode: 'spend',
    flipEconomy: 'fibonacci',
    chargeFullRound: false,
    language: DEFAULT_LANGUAGE,
    engineVersion: ENGINE_VERSION,
  }
  return { ...resolved, ...overrides }
}
