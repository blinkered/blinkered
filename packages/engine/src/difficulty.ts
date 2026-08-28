import { DEFAULT_LANGUAGE } from './languages.js'
import { at } from './invariant.js'
import type { Difficulty, GameConfig } from './types.js'

export const ENGINE_VERSION = '0.1.0'

/** Twelve tiles, 4x3 in landscape and 3x4 in portrait. A player may pick another size. */
export const DEFAULT_BOARD_SIZE = 12

/**
 * Chance per tile per deal of a wild card, before nerd mode says otherwise.
 *
 * 0.02 against twelve tiles puts a wild in 21.5% of rounds and two in 2.2%, which is between two
 * and three in a game depending on how many rounds the setting allows. Knowingly generous for a
 * first pass: a wild can be a whole word by fishing, and three of them against a fourteen-word
 * game is a fifth of the words. A treat nobody sees teaches nothing about whether it is fun, so
 * this starts high and comes down if play says so.
 */
export const DEFAULT_WILD_CHANCE = 0.02

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
 * Measured on the shipped English common tier. Regenerate with `pnpm dictionary floor`
 * whenever a word list changes: these numbers describe a dictionary, not the rules, and a
 * stale curve is a silent fault rather than a loud one. The previous values were three times
 * these, having been measured against a 78,000-word placeholder list, and left the floor so
 * far above any real board that the generator rejected every draw it made.
 */
const MEDIAN_WORDS = [2, 6, 12, 21, 35, 56, 79, 116, 152] as const
const SMALLEST_MEASURED = 4
const LARGEST_MEASURED = SMALLEST_MEASURED + MEDIAN_WORDS.length - 1

/** Share of those words that survive raising the minimum length, measured at n=9. */
const SHARE_BY_MINIMUM: Readonly<Record<number, number>> = {
  2: 1,
  3: 1,
  4: 0.59,
  5: 0.18,
  6: 0.04,
}
const SHARE_BEYOND_TABLE = 0.03

/**
 * How rich each language's board is next to English, at the same size and the same cut.
 *
 * The curve above is one language's, and languages are not interchangeable here: a Russian
 * board admits under half what an Italian one does, because a 32-letter alphabet combines
 * differently from a 21-letter one. A single floor would be unreachable in Russian and free
 * in Italian, so it is scaled. Regenerate with `pnpm dictionary floor`.
 */
const DENSITY_SCALE: Readonly<Record<string, number>> = {
  en: 1,
  fr: 0.99,
  es: 0.77,
  it: 1.18,
  de: 0.9,
  nl: 0.92,
  pt: 0.9,
  'pt-BR': 0.92,
  hr: 0.64,
  ms: 1.06,
  id: 0.96,
  ru: 0.45,
  sv: 0.79,
  no: 1.06,
  fi: 0.88,
  el: 0.63,
}

/** A language with no measurement yet is assumed to behave like the one that was measured. */
const UNMEASURED_SCALE = 1

/** Aim below the median so acceptance costs a draw or two rather than hundreds. */
const TARGET_SHARE_OF_MEDIAN = 0.7

/**
 * How many words a board must admit to be worth playing. Scales with the board, because a
 * count that filters hard at nine tiles is trivial at twelve and impossible at six.
 */
export function defaultWMin(
  n: number,
  minWordLength: number,
  language: string = DEFAULT_LANGUAGE,
): number {
  const size = Math.min(LARGEST_MEASURED, Math.max(SMALLEST_MEASURED, Math.round(n)))
  const median = at(MEDIAN_WORDS, size - SMALLEST_MEASURED)
  const share = SHARE_BY_MINIMUM[minWordLength] ?? SHARE_BEYOND_TABLE
  const scale = DENSITY_SCALE[language] ?? UNMEASURED_SCALE
  return Math.max(1, Math.round(median * share * scale * TARGET_SHARE_OF_MEDIAN))
}

/**
 * The first length that turns a profit under the fibonacci economy: five letters only break
 * even, so a board with no six-letter word cannot be played at a profit however well it is
 * played. Board acceptance requires one. See docs/PLAN.md 1.7.
 */
export const PROFITABLE_LENGTH = 6

/**
 * Resolves a difficulty and any explicit overrides into a complete ruleset. Board size,
 * minimum word length and language are read first, because the flip budget and the word floor
 * are derived from them; an explicit `initialFlips` or `wMin` still wins.
 */
export function configFor(difficulty: Difficulty, overrides: Partial<GameConfig> = {}): GameConfig {
  const profile = DIFFICULTIES[difficulty]
  const n = overrides.n ?? DEFAULT_BOARD_SIZE
  const minWordLength = overrides.minWordLength ?? profile.minWordLength
  // Read before the floor is derived, because how many words a board can admit is as much a
  // fact about the language as about the board size.
  const language = overrides.language ?? DEFAULT_LANGUAGE

  const resolved: GameConfig = {
    n,
    wildChance: overrides.wildChance ?? DEFAULT_WILD_CHANCE,
    speedMultiplier: profile.speedMultiplier,
    holdTicks: profile.holdTicks,
    initialFlips: profile.initialRounds * n,
    minWordLength,
    wMin: defaultWMin(n, minWordLength, language),
    ceilingMin: PROFITABLE_LENGTH,
    wordCompleteMode: 'spend',
    flipEconomy: 'fibonacci',
    chargeFullRound: false,
    language,
    engineVersion: ENGINE_VERSION,
  }
  return { ...resolved, ...overrides }
}
