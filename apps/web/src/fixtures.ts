import { ENGINE_VERSION } from '@blinkered/engine'
import type { Difficulty, GameResult } from '@blinkered/engine'
import { standingOf } from './scores.js'
import type { Standing } from './scores.js'

/**
 * Canned game states, so a screen can be looked at without playing to it.
 *
 * The game-over panel is several minutes of play away: the flips have to run out, and a player who
 * submits words keeps the game alive, so reaching it deliberately means playing badly for a while.
 * That is a poor loop for working on the panel, and worse for checking every translation of it.
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

/**
 * A board the canned words actually come from, checked rather than assumed.
 *
 * The first version claimed this and was not: it dealt `STRAIGHENMVY` and then found STRAIGHTEN
 * on it, which needs two T, along with four words using an F the board never held. Nothing caught
 * it, because the server checks length, duplicates and the tile budget rather than spellability,
 * and no screen drew the board beside the words. The game-detail page now does, so an impossible
 * fixture is visibly impossible.
 *
 * Every word below is spellable from these twelve tiles, consuming one per letter.
 */
const LETTERS = [...'AUTHORISEDNG']

/**
 * Long enough to exercise the rail's shrinking, short enough to be plausible.
 *
 * Three of them carry wilds, because the marking is the part of a found word most easily got
 * wrong and least easily reached by playing: at the real 0.02 a wild turns up about once every
 * four rounds, and one that resolves into a word the player then submits is rarer still. The
 * three cover the cases that differ. `HEADSTRONG` is the longest word here, so it is drawn at the
 * smallest size the rail allows: whatever marks a wild has to survive that. `DOSE` carries two,
 * which is the cap and so the most a word can hold. `AGE` is the shortest, where the mark is
 * drawn at full size and has nowhere to hide.
 *
 * The points are `wordScore` of the length rather than numbers somebody liked: 2, 3, 5, 8, 13,
 * 21, 34, 55 for three tiles up to ten.
 */
const WORDS: readonly { word: string; points: number; wilds?: readonly number[] }[] = [
  { word: 'HEADSTRONG', points: 55, wilds: [4] },
  { word: 'DAUGHTERS', points: 34 },
  { word: 'DINOSAUR', points: 21 },
  { word: 'DROUGHT', points: 13 },
  { word: 'ASHORE', points: 8 },
  { word: 'ARGUE', points: 5 },
  { word: 'DOSE', points: 3, wilds: [0, 3] },
  { word: 'ANTE', points: 3 },
  { word: 'HUGS', points: 3 },
  { word: 'RIDE', points: 3 },
  { word: 'AGE', points: 2, wilds: [1] },
  { word: 'OUT', points: 2 },
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
    /*
     * Repeated to length rather than truncated to the canned list.
     *
     * `?words=34` used to give fourteen, which is the length of `WORDS` -- so the one state this
     * fixture exists to make reachable, a long game whose panel runs off the bottom of a phone,
     * could not be reached with it. Repeats are fine: the rail cares how many there are and how
     * long each one is, not whether a word appears twice.
     */
    words: Array.from(
      { length: Math.max(0, result.words) },
      (_, at) => WORDS[at % WORDS.length] as (typeof WORDS)[number],
    ),
    letters: LETTERS,
  }
}
