import { ENGINE_VERSION } from '@blinkered/engine'
import type { Difficulty, GameResult } from '@blinkered/engine'
import { standingOf } from './scores.js'
import type { Standing } from './scores.js'

/**
 * Canned game states, so a screen can be looked at without playing to it.
 *
 * The game-over panel is several minutes of play away: the flips have to run out, and a player who
 * submits words keeps the game alive, so reaching it deliberately means playing badly for a while.
 * That is a poor loop for working on the panel, and worse for checking sixteen translations of it.
 *
 * `?fixture=over` puts the panel on screen immediately, with the real components and the real
 * leaderboard logic. Nothing here is a mock of the view; only the game that preceded it is
 * invented.
 *
 * **Development only.** The call site is behind `import.meta.env.DEV`, so this is not in a
 * production bundle at all. That is not tidiness: a URL that fakes a finished game is a URL that
 * fakes a personal best, and screenshots travel.
 *
 * Parameters, all optional:
 *
 * | key         | default | what it does                                     |
 * | ----------- | ------- | ------------------------------------------------ |
 * | `score`     | 96      | points on the finished game                      |
 * | `words`     | 14      | words found                                      |
 * | `rounds`    | 12      | rounds played                                    |
 * | `best`      | absent  | present: this game tops the table                |
 * | `custom`    | absent  | present: played on edited rules, so unranked     |
 * | `difficulty`| medium  | which preset it claims to be                     |
 * | `others`    | 3       | how many earlier games to put in the leaderboard  |
 */
export interface Fixture {
  readonly result: GameResult
  readonly standing: Standing
  readonly words: readonly { word: string; points: number; wilds?: readonly number[] }[]
  readonly letters: readonly string[]
}

/** A board the canned words could plausibly have come from. */
const LETTERS = [...'STRAIGHENMVY']

/**
 * Long enough to exercise the rail's shrinking, short enough to be plausible.
 *
 * Three of them carry wilds, because the marking is the part of a found word most easily got
 * wrong and least easily reached by playing: at the real 0.02 a wild turns up about once every
 * four rounds, and one that resolves into a word the player then submits is rarer still. The
 * three cover the cases that differ. `STRAIGHTEN` is the longest word here, so it is drawn at the
 * smallest size the rail allows: whatever marks a wild has to survive that. `SEEM` carries two,
 * which is the cap and so the most a word can hold. `FIE` is the shortest, where the mark is
 * drawn at full size and has nowhere to hide.
 */
const WORDS: readonly { word: string; points: number; wilds?: readonly number[] }[] = [
  { word: 'STRAIGHTEN', points: 13, wilds: [4] },
  { word: 'MARRIES', points: 5 },
  { word: 'SENATOR', points: 5 },
  { word: 'FEVERS', points: 3 },
  { word: 'SAVER', points: 3 },
  { word: 'MERRY', points: 3 },
  { word: 'SEEM', points: 2, wilds: [0, 3] },
  { word: 'RIME', points: 2 },
  { word: 'FRAY', points: 2 },
  { word: 'VARY', points: 2 },
  { word: 'FIE', points: 1, wilds: [1] },
  { word: 'FRY', points: 1 },
]

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'insane']

function number(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key)
  if (raw === null) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * The finished game `?fixture=over` asks for, or null when it was not asked for.
 *
 * `at` is derived from the parameters rather than from the clock, so the same URL produces the same
 * fixture every time. A screenshot that changes because time passed is a screenshot that cannot be
 * compared with yesterday's.
 */
export function overFixture(search: string): Fixture | null {
  const params = new URLSearchParams(search)
  if (params.get('fixture') !== 'over') return null

  const asked = params.get('difficulty')
  const difficulty = DIFFICULTIES.find((name) => name === asked) ?? 'medium'
  const custom = params.has('custom')
  const language = params.get('lang') ?? 'en'

  const score = number(params, 'score', 96)
  const result: GameResult = {
    score,
    words: number(params, 'words', 14),
    rounds: number(params, 'rounds', 12),
    language,
    difficulty,
    canonical: !custom,
    at: 1_700_000_000_000,
    seed: 4242,
    engineVersion: ENGINE_VERSION,
  }

  // Earlier games to be ranked against. Below the current score when it should come top, above it
  // otherwise, so `best` decides the outcome rather than the arithmetic happening to agree.
  const others = number(params, 'others', 3)
  const best = params.has('best')
  const history: GameResult[] = Array.from({ length: Math.max(0, others) }, (_, i) => ({
    ...result,
    score: best ? Math.max(0, score - (i + 1) * 7) : score + (i + 1) * 7,
    words: Math.max(1, result.words - (i + 1)),
    rounds: Math.max(1, result.rounds - i),
    at: result.at - (i + 1) * 86_400_000,
    seed: 1000 + i,
  }))

  return {
    result,
    standing: standingOf([...history, result], result, {
      language,
      difficulty,
      engineVersion: ENGINE_VERSION,
    }),
    words: WORDS.slice(0, Math.max(0, Math.min(WORDS.length, result.words))),
    letters: LETTERS,
  }
}
